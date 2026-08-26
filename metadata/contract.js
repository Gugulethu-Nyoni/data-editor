export const scalarTypes = Object.freeze([
  'String',
  'Int',
  'BigInt',
  'Float',
  'Decimal',
  'Boolean',
  'DateTime',
  'Json',
  'Bytes',
  'Enum'
]);

export const structureTypes = Object.freeze([
  'comma-separated-values',
  'key-value',
  'custom-key-value',
  'json'
]);

export function isFieldMetadata(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof value.field === 'string' &&
    typeof value.editor === 'string'
  );
}

export function isRelationMetadata(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof value.field === 'string' &&
    typeof value.modelName === 'string'
  );
}
