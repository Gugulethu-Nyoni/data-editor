import assert from 'node:assert/strict';

import MetadataResolver
  from '../core/MetadataResolver.js';

import createDefaultRegistry
  from '../core/createDefaultRegistry.js';

const metadata = {
  fields: {
    firstName: {
      model: 'Resident',
      field: 'firstName',
      type: 'String',
      editor: 'text'
    },

    age: {
      model: 'Resident',
      field: 'age',
      type: 'Int',
      editor: 'number'
    },

    weight: {
      model: 'Resident',
      field: 'weight',
      type: 'Decimal',
      editor: 'number'
    },

    isActive: {
      model: 'Resident',
      field: 'isActive',
      type: 'Boolean',
      editor: 'checkbox'
    },

    admittedAt: {
      model: 'Resident',
      field: 'admittedAt',
      type: 'DateTime',
      editor: 'datetime-local'
    },

    preferences: {
      model: 'Resident',
      field: 'preferences',
      type: 'Json',
      editor: 'json'
    },

    status: {
      model: 'Resident',
      field: 'status',
      type: 'Enum',
      editor: 'select'
    },

    tags: {
      model: 'Resident',
      field: 'tags',
      type: 'String',
      editor: 'textarea',
      structure: {
        type: 'comma-separated-values'
      }
    },

    contacts: {
      model: 'Resident',
      field: 'contacts',
      type: 'Json',
      editor: 'key-value',
      structure: {
        type: 'key-value',
        keys: {
          email: {
            editor: 'email'
          },
          mobile: {
            editor: 'tel'
          },
          website: {
            editor: 'url'
          }
        }
      }
    },

    customData: {
      model: 'Resident',
      field: 'customData',
      type: 'Json',
      editor: 'key-value',
      structure: {
        type: 'custom-key-value',

        key: {
          editor: 'text'
        },

        value: {
          editor: 'text'
        }
      }
    }
  },

  relations: {
    organization: {
      model: 'Resident',
      field: 'organization',
      modelName: 'Organization',
      collection: false
    },

    carePlans: {
      model: 'Resident',
      field: 'carePlans',
      modelName: 'CarePlan',
      collection: true
    }
  }
};

const registry = createDefaultRegistry();

const resolver =
  new MetadataResolver({
    metadata,
    registry
  });

function assertEditor(
  field,
  expected
) {
  const result =
    resolver.resolve(
      'Resident',
      'resident-001',
      field
    );

  assert.ok(result);
  assert.equal(
    result.editor.name,
    expected
  );
}

assertEditor(
  'firstName',
  'text'
);

assertEditor(
  'age',
  'number'
);

assertEditor(
  'weight',
  'number'
);

assertEditor(
  'isActive',
  'checkbox'
);

assertEditor(
  'admittedAt',
  'datetime-local'
);

assertEditor(
  'preferences',
  'json'
);

assertEditor(
  'status',
  'select'
);

assertEditor(
  'tags',
  'textarea'
);

assertEditor(
  'contacts',
  'key-value'
);

assertEditor(
  'customData',
  'key-value'
);

const relation =
  resolver.resolve(
    'Resident',
    'resident-001',
    'carePlans'
  );

assert.ok(relation);
assert.equal(
  relation.kind,
  'relation'
);

assert.equal(
  relation.metadata.modelName,
  'CarePlan'
);

assert.equal(
  relation.metadata.collection,
  true
);

console.log(
  'METADATA RESOLUTION BENCHMARK: PASS'
);
