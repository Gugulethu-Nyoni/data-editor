import DataEditor from './core/DataEditor.js';

class FakeElement {

  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.dataset = {};
    this.classList = {
      add: (...names) => {
        names.forEach(name => this._classes.add(name));
      },

      remove: (...names) => {
        names.forEach(name => this._classes.delete(name));
      },

      contains: (name) =>
        this._classes.has(name),

      has: (name) =>
        this._classes.has(name)
    };

    this._classes = new Set();
    this.children = [];
    this.textContent = '';
    this.value = '';
    this.listeners = {};
  }

  setAttribute(name, value) {
    if (!this.attributes) {
      this.attributes = {};
    }

    this.attributes[name] = String(value);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  replaceChildren(...children) {
    this.children = children;
  }

  addEventListener(type, handler) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }

    this.listeners[type].push(handler);
  }

  dispatchEvent(event) {
    for (const handler of this.listeners[event.type] || []) {
      handler(event);
    }
  }

  focus() {}

  querySelector(selector) {
    if (
      selector ===
      ':scope > .smq-data-editor-status'
    ) {
      return this.children.find(
        child =>
          child.classList?.has(
            'smq-data-editor-status'
          )
      ) || null;
    }

    return null;
  }

  querySelectorAll(selector) {
    if (selector === '.smq-data-editable') {
      return this.children.filter(
        child =>
          child.classList?.has('smq-data-editable')
      );
    }

    if (selector === '[data-metadata-field]') {
      return this.children.filter(
        child =>
          child.dataset?.metadataField
      );
    }

    return [];
  }
}

globalThis.document = {
  createElement(tagName) {
    return new FakeElement(tagName);
  },

  documentElement: new FakeElement('html'),

  getElementById() {
    return null;
  }
};

globalThis.Notification = {
  show() {}
};

const calls = [];

const api = {

  async update(payload) {

    calls.push({
      type: 'api.update',
      payload
    });

    return {
      success: true,
      record: {
        id: payload.recordId,
        [payload.field]: payload.value
      }
    };
  }

};

const root = new FakeElement('div');

const field = new FakeElement('span');

field.dataset.metadataField = 'firstName';

root.appendChild(field);

const editor = new DataEditor({

  root,

  model: 'Resident',

  recordId: 'demo-001',

  record: {
    firstName: 'John'
  },

  metadata: {
    fields: {
      firstName: {
        type: 'String',
        editor: 'text'
      }
    }
  },

  api

});

editor.mount();

console.log('\n=== INITIAL STATE ===');

console.log({
  textContent: field.textContent,
  model: field.dataset.model,
  recordId: field.dataset.recordId,
  field: field.dataset.field
});

if (field.textContent !== 'John') {
  throw new Error('FAIL: initial field value');
}

console.log('\n=== START EDIT ===');

field.dispatchEvent({
  type: 'click',
  preventDefault() {},
  stopPropagation() {}
});

if (!editor.activeEditors.has(field)) {
  throw new Error(
    'FAIL: editor was not activated'
  );
}

const activeEditor =
  editor.activeEditors.get(field);

const input =
  activeEditor.element;

console.log({
  editor: activeEditor.constructor.name,
  inputValue: input.value
});

if (input.value !== 'John') {
  throw new Error(
    'FAIL: editor did not receive original value'
  );
}

console.log('\n=== COMMIT ===');

input.value = 'Gugulethu';

input.dispatchEvent({
  type: 'keydown',
  key: 'Enter',
  preventDefault() {}
});

await new Promise(resolve =>
  setTimeout(resolve, 0)
);

console.log('\n=== FINAL STATE ===');

console.dir({
  record: editor.record,
  fieldText: field.textContent,
  activeEditor:
    editor.activeEditors.has(field),
  calls
}, { depth: 10 });

if (
  editor.record.firstName !==
  'Gugulethu'
) {
  throw new Error(
    'FAIL: record was not updated'
  );
}

if (
  field.textContent !==
  'Gugulethu'
) {
  throw new Error(
    'FAIL: DOM was not restored with new value'
  );
}

if (
  editor.activeEditors.has(field)
) {
  throw new Error(
    'FAIL: active editor was not cleared'
  );
}

const updateCalls =
  calls.filter(
    call =>
      call.type === 'api.update'
  );

if (updateCalls.length !== 1) {
  throw new Error(
    `FAIL: expected exactly 1 API update, got ${updateCalls.length}`
  );
}

console.log(
  '\nPASS: Full DataEditor mutation lifecycle OK'
);
