# Auto Mode with Selected Fields

## Overview

By default, `DataEditor` in `auto` mode renders **every field** declared in the resource metadata. When you only want to expose a subset — for a leaner form, a restricted editing surface, or to exclude fields that need special handling — pass a `fields` array to the constructor.

`fields` acts as an **allowlist**. Only the field names you list will be rendered. Everything else in `metadata.fields` is ignored.



## Basic usage

```semantq
@script
import { DataEditor } from '@semantq/data-editor';
import { Notification } from '@semantq/ql';
import AppConfig from '/public/auth/js/config.js';

const model = 'Product';
const endpoint = '/Product/Products';
const recordId = new URLSearchParams(window.location.search).get('rid');

// Only these fields will be rendered.
const fields = [
  'name',
  'description',
  'sku',
  'price',
  'stock',
  'active',
  'category'
];

$onMount(() => {
  if (!recordId) {
    Notification.show({
      type: 'warning',
      message: 'A record ID is required to edit this resource.'
    });
    return;
  }

  new DataEditor({
    root: document.getElementById('data-editor'),
    model,
    endpoint: `${endpoint}/${recordId}`,
    recordId,
    baseUrl: AppConfig.BASE_URL,
    layout: 'inline',
    fieldMode: 'auto',
    fields
  }).mount();
});
@script

@html

<div id="data-editor"></div>

```

In this example, only `name`, `description`, `sku`, `price`, `stock`, `active`, and `category` are rendered — even if the resource metadata defines more.



## How `fields` interacts with `fieldMode: 'auto'`

`fields` is a **render filter**. It narrows *which* fields DataEditor considers. The `auto` mode logic then runs unchanged over that narrowed set — for each field in the list, `auto` decides whether to **enhance existing DOM** or **generate new markup**.

The pipeline:

1. `metadata.fields` is fetched from the endpoint.
2. `fields` is intersected with `metadata.fields`.
3. For each surviving field, `auto` checks the DOM for an element with a matching `id`.
   - **Found** → the element is enhanced in place (`_enhanceExistingField`).
   - **Not found** → a field is generated into the container (`_generateField`).
4. Edit indicators, delete control, and bindings are attached only to the surviving fields.

So `fields` + `auto` behaves exactly like `fields` + `generate` **when the root is empty**, and like `fields` + `existing` **for any field whose `id` matches an element in the root**.



## Combining with existing markup

Because `auto` still checks for existing elements, you can pre-place some fields in HTML and let DataEditor generate the rest:

```html
<div id="data-editor">
  <span id="name"></span>
  <span id="price"></span>
</div>
```

```js
new DataEditor({
  root: document.getElementById('data-editor'),
  model: 'Product',
  endpoint: '/Product/Products/' + recordId,
  recordId,
  baseUrl: AppConfig.BASE_URL,
  layout: 'inline',
  fieldMode: 'auto',
  fields: ['name', 'description', 'sku', 'price', 'stock', 'active', 'category']
}).mount();
```

- `name` and `price` — enhanced in place (their `id` matches).
- `description`, `sku`, `stock`, `active`, `category` — generated into a new `.smq-data-editor-fields` container appended to the root.



## Behavior rules

| Rule | Detail |
|---|---|
| **Allowlist only** | `fields` never adds fields. It only removes them from what would otherwise render. |
| **Silent drops** | If a name in `fields` is not present in `metadata.fields`, it is dropped silently. No warning, no error. |
| **Empty array = render everything** | An empty array or omitted `fields` means "render all metadata fields." |
| **Non-array ignored** | If `fields` is not an array, it is treated as if it were absent. |
| **`targeted` mode ignores `fields`** | In `fieldMode: 'targeted'`, the `fields` array is not consulted — the DOM's `[data-editor-field]` elements drive rendering. |
| **Render-only filter** | `fields` does not restrict what is fetched, nor what is sent on create. It only controls rendering. |




## Excluding fields instead of including them

`fields` is strictly an allowlist. To express a **denylist** (render everything *except* these), compute the allowlist from metadata at mount time:

```js
const exclude = [
  'id',
  'createdAt',
  'updatedAt',
  'children',
  'contacts'
];

$onMount(async () => {
  if (!recordId) { /* ... */ return; }

  const fullEndpoint = `${endpoint}/${recordId}`;
  const response = await fetch(AppConfig.BASE_URL + fullEndpoint);
  const payload = await response.json();

  const allFields = Object.keys(payload?.metadata?.fields || {});
  const fields = allFields.filter(f => !exclude.includes(f));

  new DataEditor({
    root: document.getElementById('data-editor'),
    model,
    endpoint: fullEndpoint,
    recordId,
    baseUrl: AppConfig.BASE_URL,
    layout: 'inline',
    fieldMode: 'auto',
    fields
  }).mount();
});
```

**Note:** this fetches the record twice — once here to compute the allowlist, once inside `mount()`. If that is undesirable, add native denylist support to `DataEditor` (see *Extending* below).



## Recipes

### Minimal editable form

```js
fields: ['name', 'price']
```

### Editable fields only, timestamps excluded

```js
fields: ['name', 'description', 'sku', 'price', 'stock', 'active', 'category']
// createdAt / updatedAt / id intentionally omitted
```

### Staged rollout — safe fields first, risky fields later

```js
// Phase 1: types we know render correctly
fields: ['name', 'description', 'age', 'score', 'active', 'birthDate', 'attributes']

// Phase 2: add after serialization fixes are in place
// fields: [...phase1, 'amount', 'bigNumber', 'statuses']
```

### Testing a single field

```js
fields: ['attributes']  // exercises the custom-key-value editor in isolation
```



## Verifying the filter

Two DOM checks confirm the allowlist was applied:

```js
// Count rendered fields
document.querySelectorAll('#data-editor .smq-data-editor-field').length;

// List rendered field names
[...document.querySelectorAll('#data-editor .smq-data-editor-field')]
  .map(el => el.dataset.field);
```

The second check should return exactly the names you passed to `fields` — nothing more, nothing less.

If extra fields appear, the most likely causes are:

- The endpoint returned `metadata.fields` under a different shape than expected.
- `fields` was passed as a non-array (string, `Set`, etc.) — only arrays are honored.
- `fieldMode` was left as `'targeted'`, which bypasses `fields`.



## Full option reference (relevant excerpt)

| Option | Type | Default | Meaning |
|---|---|---|---|
| `fields` | `string[]` | `null` | Allowlist of field names to render. Empty or omitted means "render all." |
| `fieldMode` | `'auto'` \| `'existing'` \| `'generate'` \| `'targeted'` | `'auto'` | Controls how fields are rendered. `fields` is honored in all modes except `'targeted'`. |
| `layout` | `'stacked'` \| `'inline'` | `'stacked'` | Field layout. |


See the main DataEditor docs for the complete constructor reference.



## Extending: native denylist support

If you want `excludeFields: [...]` as a first-class option, patch `_renderFields()`:

```js
_renderFields() {
  if (this.fieldMode === 'targeted') {
    this._renderTargetedFields();
    return;
  }

  const fields = this.metadata.fields || {};
  const exclude = new Set(this.excludeFields || []);

  let fieldEntries;

  if (this.fields && Array.isArray(this.fields) && this.fields.length > 0) {
    fieldEntries = this.fields
      .filter(field => fields[field] && !exclude.has(field))
      .map(field => [field, fields[field]]);
  } else {
    fieldEntries = Object.entries(fields)
      .filter(([field]) => !exclude.has(field));
  }

  // ...rest unchanged
}
```

Then in the constructor:

```js
this.excludeFields = Array.isArray(excludeFields) ? excludeFields : [];
```

Usage becomes symmetric with `fields`:

```js
new DataEditor({
  // ...
  fieldMode: 'auto',
  excludeFields: ['id', 'createdAt', 'updatedAt', 'children', 'contacts']
}).mount();
```

If both `fields` and `excludeFields` are supplied, `fields` is applied first, then `excludeFields` removes from the result.



## Summary

- `fields` is an **allowlist** for which metadata fields render.
- Works with `auto` mode: existing elements are enhanced, missing ones are generated.
- Silently ignores unknown names; empty/omitted means "render all."
- Does not affect fetching or mutation payloads — it is a render-time filter only.
- For **denylist** semantics, either compute `fields` from metadata at mount time, or add `excludeFields` to the class.