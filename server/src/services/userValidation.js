const { ROLES } = require('../policies/roles');
const badRequest = (message) => Object.assign(new Error(message), { statusCode: 400 });

function validatePassword(password, minimum = 8) {
  if (typeof password !== 'string' || password.length < minimum || Buffer.byteLength(password, 'utf8') > 72) {
    throw badRequest(`Password minimal ${minimum} karakter dan maksimal 72 byte.`);
  }
  return password;
}

function userFields(body, creating = false) {
  const allowed = ['nipp', 'nama', 'email', 'role', 'jabatan', 'is_active', 'password'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) throw badRequest('Kolom user tidak dikenal.');
  const fields = {};
  for (const [key, max] of [['nipp', 20], ['nama', 100], ['jabatan', 100], ['email', 100]]) {
    if (body[key] === undefined && !creating) continue;
    const value = body[key];
    if (value !== undefined && value !== null && typeof value !== 'string') throw badRequest(`${key} harus berupa teks.`);
    const text = value?.trim() || '';
    if (text.length > max) throw badRequest(`${key} maksimal ${max} karakter.`);
    if (key === 'nipp' && !/^[a-zA-Z0-9._-]{3,20}$/.test(text)) throw badRequest('Username harus 3–20 karakter berupa huruf, angka, titik, garis bawah, atau tanda hubung.');
    if (key === 'nama' && !text) throw badRequest('Nama wajib diisi.');
    if (key === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw badRequest('Alamat email tidak valid.');
    fields[key] = text || null;
  }
  if (creating || body.role !== undefined) {
    if (!ROLES.includes(body.role)) throw badRequest('Role tidak valid.');
    fields.role = body.role;
  }
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== 'boolean') throw badRequest('Status aktif harus berupa boolean.');
    fields.is_active = body.is_active;
  } else if (creating) fields.is_active = true;
  if (creating || (body.password !== undefined && body.password !== '')) {
    const password = creating && !body.password ? fields.nipp : body.password;
    fields.password_hash = validatePassword(password, creating && password === fields.nipp ? 3 : 8);
  }
  return fields;
}

module.exports = { userFields, validatePassword, badRequest };
