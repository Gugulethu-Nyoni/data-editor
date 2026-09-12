# DataEditor — Existing Mode

## Overview

`existing` mode enhances DOM elements you've already authored. It does not generate markup.

For every metadata field, DataEditor looks for an element in the root whose `id` matches the field name. If found, that element is enhanced in place. If not, DataEditor logs a warning and moves on — nothing is generated to fill the gap.

```text
metadata.fields
      │
      ▼
for each field:
      │
      ├── matching #id in DOM?
      │     ├── YES → enhance in place
      │     └── NO  → warn, skip
      ▼
   rendered
```

`existing` mode is the strictest of the metadata-driven modes. You supply the field layout; DataEditor wires the behaviour.


## When to use this

Use `existing` mode when:

- You want full control over field markup and layout.
- Every field that should appear is authored in the template.
- You want DataEditor to warn you if a metadata field has no matching element.
- The metadata and DOM structure are both stable.

If some fields can be generated, use `auto` mode instead. If no fields are authored, use `generate` mode.


## The component

```semantq
@script

import { DataEditor } from '@semantq/data-editor';
import { Notification } from '@semantq/ql';
import AppConfig from '/public/auth/js/config.js';

const model = 'Product';
const endpoint = '/Product/Products';
const recordId = new URLSearchParams(window.location.search).get('rid');

const excludeFields = [
    'id',
    'createdAt',
    'updatedAt'
];

$onMount(() => {

    if (!recordId) {
        Notification.show({
            type: 'warning',
            message: 'A record ID is required to edit this resource.'
        });
        return;
    }

    const fullEndpoint = endpoint + '/' + recordId;

    new DataEditor({
        root: document.getElementById('data-editor'),
        model: model,
        endpoint: fullEndpoint,
        recordId: recordId,
        baseUrl: AppConfig.BASE_URL,
        layout: 'inline',
        fieldMode: 'existing',
        excludeFields: excludeFields
    }).mount();

})

@end


@style

#data-editor {
    width: 100%;
}

#data-editor .field {
    display: flex;
    gap: 0.5rem;
    padding: 0.25rem 0;
}

@end


@html

<div id="data-editor">
  <div class="field">
    <label>name</label>
    <span id="name"></span>
  </div>
  <div class="field">
    <label>price</label>
    <span id="price"></span>
  </div>
  <div class="field">
    <label>active</label>
    <span id="active"></span>
  </div>
</div>
```

Three fields are authored: `name`, `price`, `active`. If the Product metadata has additional fields after exclusion — `description`, `sku`, `stock`, `category` — each one produces a warning and is skipped.

## How matching works

For each field, DataEditor calls `_findFieldElement(field)`:

```js
_findFieldElement(field) {
  if (!field) return null;
  return this.root.querySelector(`#${CSS.escape(field)}`);
}
```

It looks for an element whose `id` equals the field name, scoped to the root. That's the whole matching rule.

Implications:

- The `id` must match the field name **exactly**. `id="product-name"` will not match field `name`.
- The element must be a descendant of the root.
- Any element type works — `<span>`, `<div>`, `<td>`.
- Position in the root determines where the field appears.


## The authoring contract

`existing` mode has a stricter contract than `auto` mode with markup. In `existing` mode:

> **Every metadata field that should render must have a matching `#id` element in the root.**

Fields without a match produce a console warning:

```
[DataEditor] Field "description" not found (mode: existing).
```

This warning is the contract check. It tells you the metadata declares a field that your markup doesn't handle. There are three legitimate responses:

1. **Author the element.** Add `<span id="description"></span>` to the root.
2. **Exclude the field.** Add it to `excludeFields`. The warning stops.
3. **Ignore the warning.** The field simply won't render. Valid if the omission is deliberate and you don't mind the console noise.

Option 2 is the clean choice when a field should never appear. Option 3 is fine for transient experimentation but produces noise in production.


## Loading behavior

`existing` mode uses the same internal loading lifecycle as `auto` mode. When `endpoint` is provided, DataEditor fetches the record and metadata before rendering:

```
mount()
   │
   ▼
_canRead()?
   │
   ▼
endpoint + fieldMode in ['auto','existing','generate']?
   │
   ▼
_loadResource()
   │
   ├── fetch via API adapter
   ├── populate this.metadata
   └── populate this.record
   │
   ▼
_render()
   │
   ▼
_renderFields()  → existing branch → enhance authored elements
```

You do not need to fetch or supply `metadata`/`record` yourself. The same constructor options that work for `auto` work here.


## The DOM after mount

**Before mount:**

```html
<div id="data-editor">
  <div class="field"><label>name</label><span id="name"></span></div>
  <div class="field"><label>price</label><span id="price"></span></div>
  <div class="field"><label>active</label><span id="active"></span></div>
</div>
```

**After mount:**

```html
<div id="data-editor">
  <div class="field"><label>name</label><span id="name" class="smq-data-editable" data-field="name" data-model="Product" data-record-id="..." data-editable="true" data-smq-data-editor-bound="true">Widget</span></div>
  <div class="field"><label>price</label><span id="price" class="smq-data-editable" data-field="price" data-model="Product" data-record-id="..." data-editable="true" data-smq-data-editor-bound="true">9.99</span></div>
  <div class="field"><label>active</label><span id="active" class="smq-data-editable" data-field="active" data-model="Product" data-record-id="..." data-editable="true" data-smq-data-editor-bound="true">true</span></div>
</div>
```

Facts to note:

1. **Elements stay where they were authored.** DataEditor never moves them.
2. **No container is created.** Unlike `auto` and `generate`, `existing` mode never produces a `.smq-data-editor-fields` element.
3. **Each enhanced element gains the standard attribute set** — `smq-data-editable`, `data-field`, `data-model`, `data-record-id`, and (if editable) `data-editable="true"` and `data-smq-data-editor-bound="true"`.
4. **Edit indicators are appended** to each enhanced element's parent, matching the `auto` mode behavior.


## `existing` compared with `auto` + markup

Both modes enhance matching elements. They differ in what happens when a metadata field has no match.

| Field state | `auto` | `existing` |
|---|---|---|
| Metadata field, matching `#id` in root | Enhanced | Enhanced |
| Metadata field, no matching element | **Generated** into a container | **Warned**, skipped |
| Element in root, no metadata field | Ignored | Ignored |
| In `excludeFields` | Skipped | Skipped |

The choice between them:

- **`auto` + markup** — you author a few fields, and DataEditor handles the rest. Metadata can grow; new fields appear automatically.
- **`existing`** — you author every field. The template is the field set. New metadata fields produce warnings until you author or exclude them.

If metadata is stable and you want full layout control, `existing` is the right choice. If metadata evolves, `auto` is safer.


## Verification

After mount, run in the console:

**List every rendered field:**

```js
[...document.querySelectorAll('#data-editor [data-field]')]
  .map(el => ({
    field: el.dataset.field,
    id: el.id,
    editable: el.dataset.editable,
    bound: el.dataset.smqDataEditorBound,
    text: el.textContent.trim()
  }));
```

Expected: three entries for `name`, `price`, `active`, each with `editable: "true"` and `bound: "true"`.

**Confirm no container was generated:**

```js
document.querySelector('#data-editor .smq-data-editor-fields');
```

Expected: `null`.

**Check the warnings:**

Look at the console for `[DataEditor] Field "..." not found (mode: existing).` — one per metadata field that wasn't authored and wasn't excluded.


## Pitfalls

**1. Mismatched `id`.** If the field is named `productName` in metadata but you authored `id="product-name"`, no match occurs. The field warns and skips. Check the actual metadata field names:

```js
Object.keys(metadata.fields)
```

**2. Forgetting a field.** Any metadata field without a matching element produces a warning. If you want it gone, add it to `excludeFields`. If you want it visible, author it.

**3. Authoring an element for a field that doesn't exist in metadata.** Nothing happens. The element stays empty and inert — no warning, no enhancement, no binding.

**4. Duplicating an `id`.** If two elements in the root share `id="name"`, `querySelector` picks the first. The second is ignored. Both warnings and enhancements behave unpredictably. Keep field `id`s unique within the root.

**5. Nesting the root incorrectly.** The match is scoped to the root. Authoring `#name` outside the root won't be found. Keep authored fields as descendants of the root element.

**6. Assuming `existing` mode requires manual `metadata`/`record`.** It doesn't — as long as `endpoint` is provided, DataEditor fetches. You only need to supply `metadata` and `record` manually if you're using `existing` mode without an `endpoint` (e.g. purely local rendering).


## Related

- [Auto Mode Overview](../auto/AutoFieldMode.md)
- [Auto Mode with Existing Markup](../auto/AutoWithMarkup.md)
- [Excluding Fields in Auto Mode](../auto/ExcludeFields.md)
- [Generate Mode](../generate/GenerateFieldMode.md) — for metadata-driven generation with no authored DOM


## Summary

- `existing` mode enhances authored elements. Nothing is generated.
- Matching is by `id` attribute, scoped to the root.
- Every metadata field that should render must be authored, or it warns.
- Loading uses the same internal lifecycle as `auto` — `endpoint` is enough.
- No container is created, and authored elements stay in place.