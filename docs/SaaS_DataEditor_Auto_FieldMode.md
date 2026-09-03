# DataEditor `auto` Field Mode

## Overview

The `auto` field mode is the default, general-purpose DataEditor mode for editing model records.

In `auto` mode, DataEditor uses the model metadata to:

* discover the fields available on the model;
* generate editable field interfaces;
* populate those fields from an existing record;
* create an editable form when a record does not yet exist;
* determine the appropriate editor for each field type;
* validate edited values;
* create a new database record when the editor is operating on `new-record`;
* automatically transition from CREATE to UPDATE after the first successful save;
* maintain the record ID on generated editable elements.

The component does **not** need to manually create field targets.

```js
fieldMode: 'auto'
```

This makes `auto` mode particularly useful for generic CRUD pages where the model metadata should determine the editing interface.



# 1. The Basic Concept

The important distinction is that `auto` mode allows DataEditor to own the field interface.

The component provides:

```text
Model
Record ID
Record data
Metadata
Permissions
API adapter
```

DataEditor determines:

```text
Which fields to render
        ↓
Which editor each field requires
        ↓
How values are displayed
        ↓
How values are edited
        ↓
How values are validated
        ↓
Whether the operation is CREATE or UPDATE
```

The component therefore does not need to create individual field targets.



# 2. Existing Record

When a valid record ID is supplied, the component loads the record first.

For example:

```text
/dashboard/users?rid=usr_123
```

The component requests:

```js
GET /User/Users/usr_123
```

If the record exists, the component passes the record and metadata to DataEditor:

```js
new DataEditor({
  root,
  model: 'User',
  recordId: 'usr_123',
  metadata,
  record,
  fieldMode: 'auto'
});
```

DataEditor then generates the editable fields and populates them with the record's values.

The lifecycle is:

```text
URL
 ↓
record ID
 ↓
load record
 ↓
receive record + metadata
 ↓
DataEditor
 ↓
generate fields
 ↓
populate values
 ↓
edit
 ↓
UPDATE
```



# 3. When the Record Does Not Exist

`auto` mode also supports the case where the requested record does not exist.

For example:

```text
/auth/dashboard/users?rid=invalid-id
```

The component attempts to load:

```js
GET /User/Users/invalid-id
```

If no record is returned, the component switches to:

```js
recordId = 'new-record';
dataModelRecord = {};
```

The metadata is retained.

This is important.

The absence of a database record does **not** mean the editor should disappear.

Instead:

```text
No record
   ↓
new-record
   ↓
metadata still available
   ↓
DataEditor generates empty fields
   ↓
user enters data
   ↓
first edit creates the record
```

This allows the same editor to support both existing records and first-time creation.



# 4. CREATE → UPDATE Transition

The most important part of the `auto` lifecycle is the transition from a temporary record identity to the real database ID.

Initially:

```js
recordId = 'new-record';
```

When the user edits the first field, DataEditor recognizes:

```js
isNew === true
```

and performs:

```text
CREATE
```

rather than:

```text
UPDATE
```

After a successful CREATE, the server returns the new record:

```js
{
  id: 'usr_123',
  name: 'John',
  ...
}
```

DataEditor then updates its internal state:

```js
this.recordId = result.id;
```

It also updates the generated editable elements so that they no longer contain:

```text
new-record
```

and instead contain:

```text
usr_123
```

The transition is therefore:

```text
BEFORE CREATE

DataEditor recordId
    ↓
new-record

DOM editable fields
    ↓
data-record-id="new-record"


CREATE
    ↓
POST
    ↓
201
    ↓
server returns real ID


AFTER CREATE

DataEditor recordId
    ↓
usr_123

DOM editable fields
    ↓
data-record-id="usr_123"
```

This transition is essential because subsequent edits must be treated as updates.

Without it, every edit could incorrectly be interpreted as another CREATE.



# 5. The `onCreated` Callback

The `onCreated` callback allows the component to react after DataEditor successfully creates a record.

```js
onCreated: (result) => {
  if (!result?.id) return;

  // Component state now points to the real record.
  recordId = result.id;

  // Synchronise the browser URL.
  const newUrl =
    `${window.location.pathname}?rid=${encodeURIComponent(result.id)}`;

  window.history.replaceState({}, '', newUrl);
}
```

The callback is deliberately separate from `onUpdated`.

```text
CREATE
    ↓
onCreated(result)

UPDATE
    ↓
onUpdated(response, payload)
```

Do not use `onUpdated` to detect CREATE operations.



# 6. Why `replaceState()` Is Used

When the page originally contained an invalid record ID:

```text
/auth/dashboard/users?rid=invalid-id
```

that URL does not represent a valid record.

After CREATE, the application has a real ID:

```text
/auth/dashboard/users?rid=usr_123
```

The browser URL should therefore be replaced:

```js
window.history.replaceState(
  {},
  '',
  `${window.location.pathname}?rid=${encodeURIComponent(result.id)}`
);
```

`replaceState()` changes the current URL without creating another browser history entry.

This means the user does not get sent back to the invalid record URL when pressing Back.



# 7. Example Using a User Model

Consider a `User` model containing fields such as:

```text
id
name
email
age
birthDate
contact
active
```

Metadata can tell DataEditor how each field should be edited.

For example:

| User field  | Example type | Editor                      |
| -- |  |  |
| `name`      | String       | Text input                  |
| `email`     | String       | Email input                 |
| `age`       | Int          | Number input                |
| `birthDate` | DateTime     | Date input                  |
| `active`    | Boolean      | Checkbox                    |
| `contact`   | Key-value    | Predefined key/value editor |

A key-value field might have metadata describing predefined keys:

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

DataEditor can then generate the appropriate controls from the metadata.

The component does not need to manually construct:

```html
<input type="email">
<input type="tel">
<input type="url">
```

The metadata drives the editor.



# 8. Generic Component Template

The following is the basic reusable pattern for a component using `auto` mode.

Replace the model-specific configuration values with those for the model being edited.

```js
@script

import { isAuthenticated, user } from '/public/auth/js/auth.js';
import { DataEditor, smQLAdapter } from '@semantq/data-editor';
import { smQL } from '@semantq/ql';
import AppConfig from '/public/auth/js/config.js';

// ─── CONFIGURATION ──────────────────────────────

const dataModel = 'User';
const endpoint = '/User/Users';

// ─── STATE ──────────────────────────────────────

let loadingStatus = $state(true);
let dataModelRecord = {};
let metadata = { fields: {} };

const params = new URLSearchParams(window.location.search);
let recordId = params.get('rid');

// ─── API CLIENT ─────────────────────────────────

const baseUrl = AppConfig.BASE_URL;
const baseOrigin = new URL(baseUrl).origin;
const api = new smQL(baseOrigin);

// ─── PERMISSIONS ────────────────────────────────

const userFeatures = user.features || [];

const canRead = userFeatures.includes('user_read');
const canCreate = userFeatures.includes('user_create');
const canUpdate = userFeatures.includes('user_update');
const canDelete = userFeatures.includes('user_delete');

// ─── LOAD RECORD ────────────────────────────────

async function loadRecord() {

  if (!recordId) {
    console.error(`[${dataModel}] Record ID missing.`);
    return;
  }

  if (!canRead) {
    console.log(`[${dataModel}] No read permission.`);
    return;
  }

  try {

    const response =
      await api.get(`${endpoint}/${recordId}`);

    const record =
      response.data ||
      response.record ||
      response;

    const hasData =
      record &&
      typeof record === 'object' &&
      !Array.isArray(record) &&
      !!record.id;

    // ─── RECORD DOES NOT EXIST ────────────────

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

    // ─── EXISTING RECORD ──────────────────────

    metadata =
      response.metadata ||
      { fields: {} };

    dataModelRecord = { ...record };

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
    document.getElementById('data-editor');

  if (!root) {
    console.error(
      `[${dataModel}] DataEditor root not found.`
    );
    return;
  }

  if (!canRead) {

    root.innerHTML =
      '<div class="permission-denied">Access denied.</div>';

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

      permissions: {
        canRead,
        canCreate,
        canUpdate,
        canDelete
      },

      editable: canUpdate,

      deletable: canDelete,

      // ─── AUTO MODE ─────────────────────────
      fieldMode: 'auto',

      layout: 'inline',

      // ─── CREATE ────────────────────────────

      onCreated: (result) => {

        if (!result?.id) return;

        // DataEditor has established the real
        // database record ID.
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

    if (!isAuthenticated) {

      console.log(
        `[${dataModel}] User is not authenticated.`
      );

      return;
    }

    if (!canRead) {

      renderDataEditor();

      return;
    }

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



# 9. Minimal HTML

The component only needs to provide a container for DataEditor.

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

The component does not need to create individual field elements.



# 10. Existing Record Lifecycle

For an existing record:

```text
URL
 │
 │ ?rid=usr_123
 ▼
Component
 │
 │ GET /User/Users/usr_123
 ▼
API
 │
 │ record + metadata
 ▼
Component
 │
 │ recordId = usr_123
 ▼
DataEditor
 │
 ├── generates fields
 ├── resolves metadata
 ├── formats values
 └── binds editing
      │
      ▼
   User edits field
      │
      ▼
    UPDATE
      │
      ▼
   Database
```

No URL change is required.



# 11. New Record Lifecycle

When the requested record does not exist:

```text
URL
 │
 │ ?rid=invalid
 ▼
Component
 │
 │ GET
 ▼
No record
 │
 ▼
recordId = "new-record"
record = {}
 │
 ▼
DataEditor
 │
 │ generates empty fields
 ▼
User enters first value
 │
 ▼
CREATE
 │
 │ POST
 ▼
Database
 │
 │ returns real ID
 ▼
DataEditor
 │
 ├── this.recordId = real ID
 ├── updates generated field targets
 └── calls onCreated(result)
      │
      ▼
Component
 │
 ├── recordId = real ID
 └── history.replaceState(...)
      │
      ▼
URL now contains real ID
      │
      ▼
User edits another field
      │
      ▼
UPDATE
```



# 12. Why Metadata Is Still Required for an Empty Record

A new record has no values:

```js
{}
```

but it still has a schema.

For example:

```text
User
 ├── name
 ├── email
 ├── age
 ├── birthDate
 ├── active
 └── contact
```

The metadata tells DataEditor what those fields are and how they should be edited.

Therefore:

```js
record = {};
metadata = response.metadata;
```

is intentional.

Do not discard the metadata simply because the database record does not exist.



# 13. Permissions

`auto` mode does not bypass application permissions.

The component should provide the permissions to DataEditor:

```js
permissions: {
  canRead,
  canCreate,
  canUpdate,
  canDelete
},

editable: canUpdate,
deletable: canDelete
```

The four operations remain conceptually separate:

```text
READ
  → load/display record

CREATE
  → create new record

UPDATE
  → modify existing record

DELETE
  → delete existing record
```

A user may therefore have permission to read a model without being allowed to edit it.



# 14. Field Type Resolution

One of the primary benefits of `auto` mode is that the component does not need to know how every field should be edited.

The metadata can describe different data types.

For example:

```text
name
  → text

email
  → email

age
  → number

birthDate
  → date/datetime

active
  → boolean

contact
  → key-value
```

For a predefined key-value structure:

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

DataEditor uses the metadata to construct the appropriate controls.

This allows the same DataEditor implementation to work across models with different schemas.



# 15. `auto` Mode Ownership

The key architectural principle is:

> **In `auto` mode, DataEditor owns field generation and field identity.**

The component owns:

```text
Model configuration
API
Record loading
Metadata acquisition
Permissions
Page-level state
URL state
Lifecycle
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

This separation allows a generic model editor to remain very small.



# 16. `auto` Mode vs Targeted Mode

The two modes solve different problems.

### `auto`

```js
fieldMode: 'auto'
```

DataEditor generates the fields.

Use it when:

* the model metadata should drive the UI;
* a generic CRUD editor is required;
* the component does not need precise control over field placement;
* the developer wants minimal field markup.

### `targeted`

```js
fieldMode: 'targeted'
```

The component creates explicit field targets.

Use it when:

* the component owns the layout;
* fields must appear in specific sections;
* relationships require explicit placement;
* the UI is highly customised;
* the component needs precise control over individual fields.

The important difference is **ownership**:

```text
AUTO

Component
    ↓
DataEditor
    ↓
generates fields


TARGETED

Component
    ↓
creates field targets
    ↓
DataEditor enhances them
```



# 17. The Essential `auto` Configuration

At its core, the configuration is:

```js
new DataEditor({
  root,
  model,
  recordId,
  metadata,
  record,
  api,

  permissions: {
    canRead,
    canCreate,
    canUpdate,
    canDelete
  },

  editable: canUpdate,
  deletable: canDelete,

  fieldMode: 'auto',

  onCreated: (result) => {
    if (!result?.id) return;

    recordId = result.id;

    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?rid=${encodeURIComponent(result.id)}`
    );
  },

  onUpdated: (response, payload) => {
    // Handle successful UPDATE.
  }
});
```

The critical parts are:

```js
fieldMode: 'auto'
```

and, for a complete create-capable page:

```js
onCreated: ...
```



# 18. Complete Lifecycle Contract

A correctly implemented `auto` mode page follows this contract:

### Existing record

```text
Valid ID
 ↓
Load record
 ↓
DataEditor receives record
 ↓
Generate fields
 ↓
Edit
 ↓
UPDATE
```

### New record

```text
Invalid/nonexistent ID
 ↓
recordId = "new-record"
 ↓
record = {}
 ↓
Metadata retained
 ↓
DataEditor generates empty fields
 ↓
First edit
 ↓
CREATE
 ↓
Real ID returned
 ↓
DataEditor switches to real ID
 ↓
Generated DOM switches to real ID
 ↓
onCreated()
 ↓
Component replaces URL
 ↓
Future edits
 ↓
UPDATE
```

The critical invariant is:

```text
After CREATE:

this.recordId !== "new-record"
```

and:

```text
all generated editable targets
    ↓
use the real database ID
```

Once that invariant is established, subsequent edits naturally become UPDATE operations.



# 19. Recommended Mental Model

Think of `auto` mode as:

```text
                MODEL METADATA
                      │
                      ▼
                 DataEditor
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
    Existing record          New record
          │                       │
          ▼                       ▼
       UPDATE                  CREATE
                                  │
                                  ▼
                              Real ID
                                  │
                                  ▼
                           onCreated()
                                  │
                                  ▼
                           Update URL
                                  │
                                  ▼
                               UPDATE
```

The temporary value:

```text
new-record
```

is **not a database ID**.

It is an internal lifecycle marker telling DataEditor:

> "This editor currently represents a record that does not yet exist."

Once CREATE succeeds, that temporary state must disappear and be replaced by the real database identifier.
