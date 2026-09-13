const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

// Exercise the real router, JWT middleware and controllers over HTTP.
// Only persistence and Chromium rendering are replaced; no local DB is changed.
const users = {
  1: { id: 1, role: 'petugas', is_active: true },
  2: { id: 2, role: 'petugas', is_active: true },
  3: { id: 3, role: 'assistant_manager', is_active: true },
};
let report;
let writes;
let renders;
const modelsPath = require.resolve('../src/models');
const pdfPath = require.resolve('../src/services/pdfService');
require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: {
  User: { findByPk: async (id) => users[id] },
  MonitoringReport: { findByPk: async (id) => String(id) === '7' ? report : null },
} };
require.cache[pdfPath] = { id: pdfPath, filename: pdfPath, loaded: true, exports: {
  generateMonitoringPDF: async () => { renders++; return Buffer.from('%PDF-test'); },
} };

const previousSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'report-access-regression-test-only';
const router = require('../src/routes/reports');
let server;
let baseURL;
before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/reports', router);
  app.use((error, req, res, next) => res.status(500).json({ message: error.message }));
  server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  baseURL = `http://127.0.0.1:${server.address().port}/api/reports`;
});
after(async () => {
  await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
  delete require.cache[modelsPath];
  delete require.cache[pdfPath];
});
beforeEach(() => {
  writes = 0;
  renders = 0;
  report = {
    id: 7, created_by: 1, status: 'draft', bulan: 9, tahun: 2026,
    station: { nama_stasiun: 'Uji' }, details: [],
    toJSON() { return { id: this.id, created_by: this.created_by, status: this.status, details: [] }; },
    async update(values) { writes++; Object.assign(this, values); },
  };
});
const request = (id, path, method = 'GET') => fetch(baseURL + path, {
  method,
  headers: id ? { Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}` } : {},
});

for (const status of ['draft', 'rejected', 'submitted', 'approved']) {
  test(`other petugas denied detail, PDF and submit for ${status}`, async () => {
    report.status = status;
    for (const [path, method] of [['/7', 'GET'], ['/7/pdf', 'GET'], ['/7/submit', 'PATCH']]) {
      const response = await request(2, path, method);
      assert.equal(response.status, 403, path);
      assert.equal((await response.json()).data, undefined);
    }
    assert.equal(report.status, status);
    assert.equal(writes, 0);
    assert.equal(renders, 0);
  });
}
for (const id of [1, 3]) {
  test(`authorized reader ${id} can read detail and PDF`, async () => {
    const detail = await request(id, '/7');
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).data.created_by, 1);
    const pdf = await request(id, '/7/pdf');
    assert.equal(pdf.status, 200);
    assert.match(pdf.headers.get('content-type'), /application\/pdf/);
    assert.equal(await pdf.text(), '%PDF-test');
    assert.equal(renders, 1);
  });
}
for (const status of ['draft', 'rejected']) {
  test(`owner can submit ${status}`, async () => {
    report.status = status;
    assert.equal((await request(1, '/7/submit', 'PATCH')).status, 200);
    assert.equal(report.status, 'submitted');
    assert.equal(writes, 1);
  });
}
for (const status of ['submitted', 'approved']) {
  test(`owner cannot resubmit ${status}`, async () => {
    report.status = status;
    assert.equal((await request(1, '/7/submit', 'PATCH')).status, 400);
    assert.equal(writes, 0);
  });
}
test('manager cannot submit even when created_by matches', async () => {
  report.created_by = 3;
  assert.equal((await request(3, '/7/submit', 'PATCH')).status, 403);
  assert.equal(writes, 0);
});
test('unauthenticated requests rejected', async () => {
  for (const [path, method] of [['/7', 'GET'], ['/7/pdf', 'GET'], ['/7/submit', 'PATCH']]) {
    assert.equal((await request(null, path, method)).status, 401);
  }
  assert.equal(writes, 0);
  assert.equal(renders, 0);
});
test('missing report returns 404', async () => {
  for (const [path, method] of [['/999', 'GET'], ['/999/pdf', 'GET'], ['/999/submit', 'PATCH']]) {
    assert.equal((await request(1, path, method)).status, 404);
  }
});
