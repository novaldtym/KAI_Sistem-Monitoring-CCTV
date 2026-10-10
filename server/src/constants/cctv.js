const CCTV_TYPES = ['IP Camera', 'Analog Camera', 'Standalone Camera'];

const normalizeCCTVType = (value) => {
  if (value == null || String(value).trim() === '') return null;
  return CCTV_TYPES.find((type) => type.toLowerCase() === String(value).trim().toLowerCase());
};

module.exports = { CCTV_TYPES, normalizeCCTVType };
