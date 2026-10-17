const fs = require('node:fs');
const path = require('node:path');
const { sequelize, User } = require('../models');
const { userFields } = require('../services/userValidation');

async function provisionUsers(entries) {
  if (!Array.isArray(entries) || !entries.length) throw new Error('File harus berisi daftar user.');
  const prepared = entries.map(({ legacy_nipp, ...entry }) => ({ legacy_nipp, fields: userFields(entry, true) }));
  if (new Set(prepared.map(({ fields }) => fields.nipp.toLowerCase())).size !== prepared.length) {
    throw new Error('Username dalam file tidak boleh berulang.');
  }
  return sequelize.transaction(async (transaction) => {
    const results = [];
    for (const { legacy_nipp, fields } of prepared) {
      let user = await User.findOne({ where: { nipp: fields.nipp }, transaction, lock: transaction.LOCK.UPDATE });
      let legacy = false;
      if (!user && legacy_nipp) {
        user = await User.findOne({ where: { nipp: legacy_nipp }, transaction, lock: transaction.LOCK.UPDATE });
        legacy = Boolean(user);
      }
      if (user) {
        // Re-running setup preserves passwords that users have already changed.
        if (!legacy) delete fields.password_hash;
        const invalidatesSession = legacy || ['role', 'is_active', 'nipp'].some((key) => fields[key] !== user[key]);
        if (invalidatesSession) fields.token_version = user.token_version + 1;
        await user.update(fields, { transaction });
      } else user = await User.create(fields, { transaction });
      results.push({ nipp: user.nipp, nama: user.nama, role: user.role });
    }
    return results;
  });
}

if (require.main === module) {
  (async () => {
    if (!process.argv[2]) throw new Error('Gunakan: npm run setup:users -- <file-json-user>');
    const entries = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), 'utf8'));
    await User.sync({ alter: true });
    console.log(JSON.stringify({ users: await provisionUsers(entries) }, null, 2));
  })().catch((error) => { console.error(error.message); process.exitCode = 1; })
    .finally(() => sequelize.close());
}

module.exports = { provisionUsers };
