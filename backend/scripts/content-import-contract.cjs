'use strict';

const requiredDefaults = [
  'contentType',
  'languageCode',
  'status',
  'origin',
  'rights',
];

function validateDataset(data) {
  if (!data.dataset?.id) throw new Error('dataset.id is required');
  if (!data.defaults || typeof data.defaults !== 'object') {
    throw new Error('defaults is required');
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('items must be a non-empty array');
  }
  for (const field of requiredDefaults) {
    if (!data.defaults[field]) {
      throw new Error(`defaults.${field} is required`);
    }
  }
}

function countByContentType(items) {
  return items.reduce((result, item) => {
    result[item.contentType] = (result[item.contentType] ?? 0) + 1;
    return result;
  }, {});
}

module.exports = { countByContentType, validateDataset };
