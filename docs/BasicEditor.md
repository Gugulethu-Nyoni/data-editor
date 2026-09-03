# DataEditor `auto` Field Mode

## Overview

`auto` is the general-purpose DataEditor field mode.

In this mode, DataEditor uses the supplied model metadata to automatically generate the editable fields for a record.

The component provides:

* the model name;
* the record ID;
* the record data;
* the model metadata;
* the API adapter;
* the editor configuration.

DataEditor handles:

* field generation;
* metadata resolution;
* editor selection;
* value formatting;
* editing;
* validation;
* CREATE;
* UPDATE;
* DELETE;
* the transition from a new record to an existing record.

The basic configuration is:

```js
fieldMode: 'auto'
```

No individual field targets need to be created by the component.


# 1. How `auto` Mode Works

The component supplies a model and its metadata:

```js
const editor = new DataEditor({
  root,
  model: 'User',
  recordId,
  metadata,
  record,
  api,

  fieldMode: 'auto'
});

editor.mount();
```

DataEditor uses the metadata to determine what fields to generate and which editor each field requires.

Conceptually:

```text
Model
  │
  ├── Metadata
  │
  └── Record
        │
        ▼
    DataEditor
        │
        ├── Resolve fields
        ├── Select editors
        ├── Generate fields
        ├── Format values
        └── Bind editing
```

The component does not have to manually create the individual inputs.


# 2. Example User Model

Suppose the application has a `User` model containing:

```text
id
name
email
age
birthDate
contact
active
```

The metadata can describe the appropriate editor for each field.

For example:

| Field       | Data      | Example editor   |
| ----------- | --------- | ---------------- |
| `name`      | String    | Text             |
| `email`     | String    | Email            |
| `age`       | Integer   | Number           |
| `birthDate` | DateTime  | Date/datetime    |
| `active`    | Boolean   | Checkbox         |
| `contact`   | Key-value | Key-value editor |

The component only needs to provide the model, record and metadata.


# 3. Metadata Drives the UI

The purpose of metadata is to allow DataEditor to understand the model without the component having to hard-code every field.

For example, metadata for a contact field could describe predefined keys:

```js
contact: {
  editor: 'key-value',

  structure: {
    fields: {
      email: {
        inputType: 'email'
      },

      mobile: {
        inputType: 'tel'
      },

      website: {
        inputType: 'url'
      }
    }
  }
}
```

DataEditor can use this information to generate the appropriate controls.

The component does not need to manually construct:

```html
<input type="email">
<input type="tel">
<input type="url">
```

Instead:

```text
Metadata
   ↓
DataEditor
   ↓
Appropriate editor
   ↓
Generated field
```

This is one of the primary advantages of `auto` mode.


# 4. Editing an Existing Record

When a valid record ID is supplied, the component first retrieves the record.

For example:

```text
/auth/dashboard/users?rid=usr_123
```

The component requests the record:

```js
const response =
  await api.get(`${endpoint}/${recordId}`);
```

It then extracts the record and metadata:

```js
const record =
  response.data ||
  response.record ||
  response;

metadata =
  response.metadata ||
  { fields: {} };

dataModelRecord = { ...record };
```

The DataEditor is then mounted:

```js
new DataEditor({
  root,
  model: 'User',
  recordId: 'usr_123',
  metadata,
  record: dataModelRecord,
  api,
  fieldMode: 'auto'
});
```

The lifecycle becomes:

```text
URL
 ↓
record ID
 ↓
GET record
 ↓
record + metadata
 ↓
DataEditor
 ↓
generate fields
 ↓
populate values
 ↓
user edits field
 ↓
UPDATE
```


# 5. When the Record Does Not Exist

`auto` mode also supports creating a record when the requested record does not exist.

Suppose the URL contains:

```text
/auth/dashboard/users?rid=invalid-id
```

The component attempts to retrieve that record.

If the response does not contain a valid record, the component switches to a temporary record state:

```js
recordId = 'new-record';
dataModelRecord = {};
```

The metadata is retained:

```js
metadata =
  response.metadata ||
  { fields: {} };
```

The editor is still mounted.

This is important.

An empty database record does **not** mean there is nothing to render.

The schema metadata still tells DataEditor which fields should exist.

Therefore:

```text
No database record
       ↓
recordId = "new-record"
       ↓
record = {}
       ↓
metadata still available
       ↓
DataEditor generates empty fields
       ↓
user enters data
       ↓
CREATE
```


# 6. `new-record` Is a Temporary Identity

`new-record` is not a database ID.

It is a temporary DataEditor state indicating:

> The editor represents a record that has not yet been created.

Initially:

```js
recordId = 'new-record';
```

When the user edits a field, DataEditor recognizes that this is a new record and performs a CREATE rather than an UPDATE.

Conceptually:

```js
isNew = true;
```

which results in:

```text
CREATE
```

After the database creates the record, the server returns its real ID.

For example:

```js
{
  id: 'usr_123',
  name: 'John'
}
```

DataEditor must then transition from:

```text
new-record
```

to:

```text
usr_123
```


# 7. CREATE → UPDATE Transition

This is the critical lifecycle of `auto` mode.

Before creation:

```text
DataEditor
recordId = "new-record"

Generated fields
data-record-id = "new-record"
```

The first edit performs:

```text
CREATE
 ↓
POST
 ↓
201
 ↓
database generates ID
```

For example:

```text
usr_123
```

DataEditor then updates its internal record ID:

```js
this.recordId = result.id;
```

It also updates the generated editable elements:

```js
const targets = this.root.querySelectorAll(
  '[data-editor-field], .smq-data-editable'
);

for (const el of targets) {
  if (
    el.dataset.recordId === 'new-record' ||
    el.dataset.editorRecordId === 'new-record'
  ) {
    el.dataset.recordId = result.id;
    el.dataset.editorRecordId = result.id;
  }
}
```

The editor is now operating on the real record.

Therefore:

```text
BEFORE CREATE

recordId
  ↓
new-record


CREATE


AFTER CREATE

recordId
  ↓
usr_123
```

and:

```text
Generated DOM

new-record
     ↓
usr_123
```

This transition prevents subsequent edits from creating duplicate records.


# 8. The `onCreated` Callback

After DataEditor has successfully created the record and established the real ID, it calls `onCreated`.

Example:

```js
onCreated: (result) => {

  if (!result?.id) return;

  recordId = result.id;

  const newUrl =
    `${window.location.pathname}?rid=${encodeURIComponent(result.id)}`;

  window.history.replaceState(
    {},
    '',
    newUrl
  );

}
```

The order is important:

```text
CREATE
 ↓
receive result
 ↓
DataEditor updates this.recordId
 ↓
DataEditor updates generated fields
 ↓
DataEditor calls onCreated()
 ↓
component updates recordId
 ↓
component updates URL
```

The callback therefore represents a successful transition into an existing database record.


# 9. Updating the URL

When creation occurs from an invalid or temporary URL, the browser may still contain the original ID.

For example:

```text
/auth/dashboard/users?rid=invalid-id
```

After creation:

```text
usr_123
```

the component should replace the URL:

```js
window.history.replaceState(
  {},
  '',
  `${window.location.pathname}?rid=${encodeURIComponent(result.id)}`
);
```

The resulting URL is:

```text
/auth/dashboard/users?rid=usr_123
```

`replaceState()` is preferable here because the original ID did not represent an actual record.

It replaces the current browser history entry rather than creating another one.


# 10. CREATE and UPDATE Are Separate Events

DataEditor exposes separate callbacks for the two operations.

CREATE:

```js
onCreated: (result) => {
  // Record has just been created.
}
```

UPDATE:

```js
onUpdated: (response, payload) => {
  // Existing record has been updated.
}
```

They represent different lifecycle events.

```text
new-record
    │
    │ CREATE
    ▼
real record ID
    │
    │ UPDATE
    ▼
existing record
```

The URL normally changes only during the CREATE transition.


# 11. DELETE

Deletion can be handled with `onDeleted`:

```js
onDeleted: () => {

  root.innerHTML = `
    <div class="smq-data-editor-deleted">
      <p>User record has been deleted.</p>
    </div>
  `;

}
```

The exact post-delete UI is application-specific.

The important point is that the DataEditor handles the DELETE operation while the component decides what the surrounding page should display afterward.


# 12. Generic `auto` Mode Component

The following template demonstrates the complete pattern without authentication or application-specific permission logic.

```js
@script

import { DataEditor, smQLAdapter } from '@semantq/data-editor';
import { smQL } from '@semantq/ql';
import AppConfig from '/public/auth/js/config.js';

// ─── CONFIGURATION ──────────────────────────────

const dataModel = 'User';
const endpoint = '/User/Users';

// ─── STATE ──────────────────────────────────────

let loadingStatus = $state(true);

let dataModelRecord = {};

let metadata = {
  fields: {}
};

const params =
  new URLSearchParams(window.location.search);

let recordId =
  params.get('rid');

// ─── API CLIENT ─────────────────────────────────

const baseUrl =
  AppConfig.BASE_URL;

const baseOrigin =
  new URL(baseUrl).origin;

const api =
  new smQL(baseOrigin);

// ─── LOAD RECORD ────────────────────────────────

async function loadRecord() {

  if (!recordId) {
    console.error(
      `[${dataModel}] Record ID missing.`
    );
    return;
  }

  try {

    const response =
      await api.get(
        `${endpoint}/${recordId}`
      );

    const record =
      response.data ||
      response.record ||
      response;

    const hasData =
      record &&
      typeof record === 'object' &&
      !Array.isArray(record) &&
      !!record.id;

    // ─── NO RECORD ────────────────────────────

    if (!hasData) {

      console.log(
        `[${dataModel}] No record found. Setting up for CREATE.`
      );

      recordId = 'new-record';

      dataModelRecord = {};

      metadata =
        response.metadata ||
        { fields: {} };

      renderDataEditor();

      return;
    }

    // ─── EXISTING RECORD ─────────────────────

    metadata =
      response.metadata ||
      { fields: {} };

    dataModelRecord =
      { ...record };

    delete dataModelRecord.metadata;
    delete dataModelRecord._status;
    delete dataModelRecord._ok;

    renderDataEditor();

  } catch (error) {

    console.error(
      `[${dataModel}] Failed to load:`,
      error
    );

  }
}

// ─── DATA EDITOR ────────────────────────────────

function renderDataEditor() {

  const root =
    document.getElementById(
      'data-editor'
    );

  if (!root) {

    console.error(
      `[${dataModel}] DataEditor root not found.`
    );

    return;
  }

  root.innerHTML = '';

  const adapter =
    new smQLAdapter({

      client: api,

      resources: {
        [dataModel]: {
          endpoint
        }
      }

    });

  const editor =
    new DataEditor({

      root,

      model: dataModel,

      recordId,

      metadata,

      api: adapter,

      record: dataModelRecord,

      fieldMode: 'auto',

      layout: 'inline',

      // ─── CREATE ─────────────────────────────

      onCreated: (result) => {

        if (!result?.id) return;

        // DataEditor now has the real ID.
        recordId = result.id;

        // Replace the temporary/invalid URL.
        const newUrl =
          `${window.location.pathname}?rid=${encodeURIComponent(result.id)}`;

        window.history.replaceState(
          {},
          '',
          newUrl
        );

        console.log(
          `[${dataModel}] Created record:`,
          result.id
        );

        console.log(
          `[${dataModel}] URL updated to:`,
          newUrl
        );

      },

      // ─── UPDATE ────────────────────────────

      onUpdated: (response, payload) => {

        console.log(
          `[${dataModel}] Updated.`,
          response,
          payload
        );

      },

      // ─── DELETE ────────────────────────────

      onDeleted: () => {

        console.log(
          `[${dataModel}] Deleted.`
        );

        root.innerHTML = `
          <div class="smq-data-editor-deleted">
            <p>${dataModel} record has been deleted.</p>
          </div>
        `;

      },

      // ─── ERROR ─────────────────────────────

      onError: (error) => {

        console.error(
          `[${dataModel}] Error:`,
          error
        );

      }

    });

  editor.mount();
}

// ─── DOM LIFECYCLE ──────────────────────────────

$onMount(async () => {

  try {

    loadingStatus.value = false;

    await loadRecord();

  } catch (error) {

    console.error(
      `[${dataModel}] Unexpected error:`,
      error
    );

  }

});

@end
```


# 13. Basic HTML

The component only needs to provide a container.

```html
@html

@if(loadingStatus)

  <div class="loading-container">
    <p>Loading record...</p>
  </div>

@else

  <div class="product">

    <h2>User</h2>

    <section class="section">

      <h3>Data</h3>

      <div id="data-editor"></div>

    </section>

  </div>

@endif

@end
```

DataEditor generates the fields inside:

```html
<div id="data-editor"></div>
```

No individual field targets are required.


# 14. Complete Existing-Record Flow

```text
/auth/dashboard/users?rid=usr_123
              │
              ▼
        Load User record
              │
              ▼
       Record + metadata
              │
              ▼
        DataEditor.auto
              │
              ├── Generate fields
              ├── Resolve editors
              └── Populate values
                       │
                       ▼
                   User edits
                       │
                       ▼
                     UPDATE
                       │
                       ▼
                    Database
```


# 15. Complete New-Record Flow

```text
/auth/dashboard/users?rid=invalid
              │
              ▼
        Load User record
              │
              ▼
          No record
              │
              ▼
     recordId = "new-record"
     record = {}
              │
              ▼
       Metadata retained
              │
              ▼
        DataEditor.auto
              │
              ▼
       Generate empty fields
              │
              ▼
         User enters data
              │
              ▼
             CREATE
              │
              ▼
       Database returns ID
              │
              ▼
      DataEditor updates:
        this.recordId
        generated fields
              │
              ▼
          onCreated()
              │
              ▼
     Component updates URL
              │
              ▼
       Future edits = UPDATE
```


# 16. The Core Contract of `auto` Mode

A correctly functioning `auto` mode implementation maintains the following invariant:

```text
Before CREATE:

recordId = "new-record"
```

After successful CREATE:

```text
recordId = real database ID
```

and:

```text
all generated editable elements
        ↓
use the real database ID
```

The component URL should then also represent the real record:

```text
?rid=<real-record-id>
```

This produces a continuous lifecycle:

```text
NEW
 ↓
CREATE
 ↓
EXISTING
 ↓
UPDATE
 ↓
EXISTING
```

rather than repeatedly treating the same editor as a new record.


# 17. `auto` Mode Ownership

The architectural principle is:

> **In `auto` mode, DataEditor owns field generation.**

The component owns:

```text
Model configuration
API client
Record loading
Metadata acquisition
Page state
URL state
```

DataEditor owns:

```text
Field generation
Metadata resolution
Editor selection
Value formatting
Editing
Validation
CREATE / UPDATE decision
Record ID transition
Generated field identity
Mutation
```

This makes `auto` mode suitable for generic CRUD interfaces where the model metadata should drive the editing interface.


# 18. `auto` vs `targeted`

`auto`:

```js
fieldMode: 'auto'
```

means:

```text
Component
   ↓
DataEditor
   ↓
generates fields
```

`targeted`:

```js
fieldMode: 'targeted'
```

means:

```text
Component
   ↓
creates field targets
   ↓
DataEditor
   ↓
enhances those targets
```

Use `auto` when DataEditor should determine the field interface from metadata.

Use `targeted` when the component needs precise control over field placement, structure, relationships or highly customised layouts.

The fundamental difference is **field ownership**:

```text
AUTO
DataEditor owns fields.


TARGETED
Component owns field targets.
```

---

# 19. Summary

`auto` mode provides a metadata-driven CRUD editing experience with minimal component markup.

The essential configuration is:

```js
fieldMode: 'auto'
```

The component supplies:

```text
model
recordId
record
metadata
api
```

DataEditor then manages the editing lifecycle.

For an existing record:

```text
record ID
 → load
 → generate
 → edit
 → UPDATE
```

For a new record:

```text
missing record
 → new-record
 → generate empty fields
 → edit
 → CREATE
 → real ID
 → update DataEditor state
 → update generated fields
 → onCreated
 → replace URL
 → subsequent UPDATE
```

The key concept is that `new-record` is a **temporary lifecycle state**, not a persistent record identity.

Once the database creates the record, the editor transitions permanently to the real database ID.
