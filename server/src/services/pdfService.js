const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { getReportCalendar } = require('./reportCalendar');

// Register Handlebars helpers
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('formatDate', (dateStr) => {
  if (!dateStr) return '-';
  const [year, month, day] = String(dateStr).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
});
Handlebars.registerHelper('statusSymbol', (val) => {
  if (val === 'V') return '✓';
  if (val === 'X') return 'X';
  return '';
});

const MONTHS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

async function generateMonitoringPDF(reportData) {
  const templatePath = path.join(__dirname, '../templates/pdf/monitoring-cctv.html');
  const templateHTML = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateHTML);

  // Sort details
  const weeks = getReportCalendar(reportData).weeks.map((week) => ({
    ...week, range: week.range.replace('–', '-'), checkedAt: reportData[`checked_at_m${week.number}`] || null,
  }));
  const details = [...(reportData.details || [])].sort(
    (a, b) => (a.cctvPoint?.nomor_urut || 0) - (b.cctvPoint?.nomor_urut || 0)
  ).map((detail) => {
    let label = detail.cctvPoint?.nama_titik || 'Kelompok CCTV';
    const station = reportData.station;
    for (const prefix of [station?.nama_stasiun, station?.nama_stasiun?.replace(/^stasiun\s+/i, ''), station?.kode_stasiun].filter(Boolean)) {
      if (label.toLowerCase().startsWith(prefix.toLowerCase()) && /^\s*[-:]\s*\S/.test(label.slice(prefix.length))) {
        label = label.slice(prefix.length).replace(/^\s*[-:]\s*/, '');
      }
    }
    return { ...detail, pointLabel: label, weeks: weeks.map((week) => ({
      berfungsi: detail[`m${week.number}_berfungsi`] || '-', terbackup: detail[`m${week.number}_terbackup`] || '-',
    })) };
  });

  // Prepare data
  const bulanLabel = `${MONTHS[reportData.bulan]} ${reportData.tahun}`;
  let tanggalLabel = '-';
  if (reportData.tanggal_m1) {
    const d = new Date(reportData.tanggal_m1);
    tanggalLabel = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  } else if (reportData.createdAt) {
    const d = new Date(reportData.createdAt);
    tanggalLabel = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  }

  // Load official KAI WebP Logo as base64
  const logoPath = path.join(__dirname, '../assets/logo-kai.webp');
  let kaiLogoBase64 = '';
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    kaiLogoBase64 = `data:image/webp;base64,${logoBuffer.toString('base64')}`;
  }

  const approvalLog = reportData.approvalLogs && reportData.approvalLogs[0];

  const chunks = [];
  for (let i = 0; i < details.length; i += 20) {
    chunks.push(details.slice(i, i + 20));
  }

  const totalPages = chunks.length || 1;
  const pages = chunks.length ? chunks.map((chunk, index) => ({
    pageNumber: index + 1,
    totalPages,
    isLastPage: index === totalPages - 1,
    items: chunk
  })) : [{
    pageNumber: 1,
    totalPages: 1,
    isLastPage: true,
    items: []
  }];

  const html = template({
    kaiLogoBase64,
    noRef: reportData.no_ref || '-',
    nomorDokumen: 'FR.SM/TI/015.017/10-2020',
    tanggalTerbit: '12 Oktober 2020',
    versi: '002-2020',
    tanggal: tanggalLabel,
    bulan: bulanLabel,
    stasiunNama: reportData.station?.nama_stasiun || '-',
    weeks,
    statusColumnCount: weeks.length * 2,
    tanggalM1: reportData.tanggal_m1,
    tanggalM2: reportData.tanggal_m2,
    tanggalM3: reportData.tanggal_m3,
    tanggalM4: reportData.tanggal_m4,
    pages,
    catatan: reportData.catatan || '',
    managerNama: approvalLog?.approver?.nama || '-',
    managerNipp: approvalLog?.approver?.nipp || '-',
    managerJabatan: approvalLog?.approver?.jabatan || 'Assistant Manager IT Support 1',
    petugasNama: reportData.createdBy?.nama || '-',
    petugasNipp: reportData.createdBy?.nipp || '-',
  });

  function getExecutablePath() {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    return undefined;
  }

  const launchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  };

  const execPath = getExecutablePath();
  if (execPath) {
    launchOptions.executablePath = execPath;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4', landscape: true, printBackground: true,
      margin: { top: '5mm', right: '8mm', bottom: '5mm', left: '8mm' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

module.exports = { generateMonitoringPDF };
