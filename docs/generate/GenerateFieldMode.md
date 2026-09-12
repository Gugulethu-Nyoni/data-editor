# DataEditor — Generate Mode

## Overview

`generate` mode builds every field from metadata. It ignores whatever markup is already in the root.

```text
metadata.fields
      │
      ▼
for each field:
      │
      ▼
   generate into container
      │
      ▼
   rendered
```

There is no DOM check. DataEditor does not look for existing elements, does not enhance anything, and does not warn about missing markup. It reads metadata and produces markup.

`generate` is the mode for **empty roots**. It is designed for container elements — mount points, slots, dashboard tiles — where the DOM state is not part of the contract.


## When to use this

Use `generate` mode when:

- The root is an empty container.
- You want deterministic output that depends only on metadata.
- The root may contain arbitrary markup you don't control.
- You want an explicit statement that DataEditor should build everything.
- You are verifying what a resource's metadata declares.

Do not use `generate` mode when:

- You've authored field elements in the root.
- You want some fields enhanced in place.
- You want a warning when metadata declares a field you haven't handled.

If you author markup, use `existing` or `auto` mode instead.


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
        fieldMode: 'generate',
        excludeFields: excludeFields
    }).mount();

})

@end


@style

#data-editor {
    width: 100%;
}

#data-editor .smq-data-editor-fields {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

@end


@html

<div id="data-editor"></div>
```

Note the empty root. No authored `.field` blocks, no `#id` spans. That is the contract.


## How it differs from the other modes

| Mode | Reads DOM? | Writes to DOM? |
|---|---|---|
| `auto` | Yes — to find elements to enhance | Enhances matches, generates the rest |
| `existing` | Yes — to find elements to enhance | Enhances matches only |
| `targeted` | Yes — to find `[data-editor-field]` targets | Writes only to those targets |
| `generate` | **No** | Generates everything from scratch |

`generate` is the only mode that never reads the DOM for input. It uses metadata only.


## The relationship to `auto`

On an **empty** root, `generate` and `auto` produce identical output. Both generate every field into a `.smq-data-editor-fields` container, in metadata order.

On a **non-empty** root, they diverge:

- **`auto`** enhances matching elements and generates the rest.
- **`generate`** ignores authored elements and generates everything.

The practical difference is intent. `auto` says: "respect what's here." `generate` says: "ignore what's here."

For an empty root, both produce the same result. `generate` is the clearer statement of intent when generation is what you actually want.


## Loading behavior

`generate` mode uses the same internal loading lifecycle as `auto` and `existing`. When `endpoint` is provided, DataEditor fetches the record and metadata before rendering:

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
_renderFields()  → generate branch → generate every field
```

You do not need to supply `metadata` or `record` yourself. The same constructor options that work for `auto` work here.


## Field filtering

`fields` and `excludeFields` both apply in `generate` mode. They filter `fieldEntries` before generation, same as in `auto`.

```js
excludeFields: ['id', 'createdAt', 'updatedAt']
```

produces the same subset as it would in `auto` mode. The filtering is mode-independent.


## The DOM after mount

**Before mount:**

```html
<div id="data-editor"></div>
```

**After mount:**

```html
<div id="data-editor">
  <div class="smq-data-editor-fields smq-data-editor-layout-inline" data-layout="inline">
    <div class="smq-data-editor-field" data-field="name">
      <span class="smq-data-editor-label">name</span>
      <div class="smq-data-editor-value">
        <span id="name" class="smq-data-editable" data-field="name" data-model="Product" data-record-id="..." data-editable="true" data-smq-data-editor-bound="true">Widget</span>
      </div>
    </div>
    <div class="smq-data-editor-field" data-field="description">...</div>
    <div class="smq-data-editor-field" data-field="sku">...</div>
    <!-- ... remaining fields ... -->
  </div>
</div>
```

Facts to note:

1. **One container holds every field.** DataEditor creates it (or reuses an existing `.smq-data-editor-fields`) and appends it to the root.
2. **Fields render in metadata order.** No interleaving with authored markup, because there is none.
3. **Each generated field is wrapped** in a `.smq-data-editor-field` div containing a `.smq-data-editor-label` and a `.smq-data-editor-value`.
4. **The value element carries the field's `id`.** This is why authored elements with the same `id` would collide.


## Pitfalls

**1. Authoring fields alongside `generate` mode.**

If the root contains `<span id="name">` and `generate` mode runs, two elements end up with `id="name"` — the authored one (untouched) and the generated one (inside the container). `document.getElementById('name')` returns the first, which is usually the authored, empty one. Subsequent code that queries by `id` may operate on the wrong element.

**Do not mix authored markup with `generate` mode.** If you author fields, use `existing` or `auto`.

**2. Expecting warnings.**

`generate` mode does not warn about metadata fields that don't appear in the DOM, because it never looks. If you want that feedback, use `existing` mode.

**3. Duplicate calls.**

Calling `mount()` twice re-runs `_renderFields()`. For `generate`, the code guards against duplicate container entries by checking `[data-field="..."]` inside the container before appending. But if the container was removed between calls, a new one is created. In practice, mount once.

**4. Assuming metadata order.**

Fields render in `Object.entries(metadata.fields)` order — insertion order from the metadata payload. If you want a specific order, either the backend must emit fields in that order, or you must use `fields` (which preserves the array's order) to override.


## Verification

After mount, run in the console:

**List every rendered field, in DOM order:**

```js
[...document.querySelectorAll('#data-editor .smq-data-editor-field')]
  .map(el => el.dataset.field);
```

Expected: every non-excluded metadata field, in metadata order.

**Confirm exactly one container exists:**

```js
document.querySelectorAll('#data-editor .smq-data-editor-fields').length;
```

Expected: `1`.

**Confirm no orphaned authored elements:**

```js
// If the root is empty as documented, this returns 0.
[...document.getElementById('data-editor').children]
  .filter(el => !el.classList.contains('smq-data-editor-fields'))
  .length;
```

Expected: `0`.

**Confirm no `id` collisions:**

```js
[...document.querySelectorAll('#data-editor [id]')]
  .map(el => el.id)
  .filter((id, i, arr) => arr.indexOf(id) !== i);
```

Expected: `[]` — no duplicate `id`s.


## When `generate` is the right statement

If you wrote `auto` on an empty root, `generate` says the same thing more clearly:

```js
fieldMode: 'auto'      // "enhance whatever's here, generate the rest"
fieldMode: 'generate'  // "generate everything, ignore the DOM"
```

For an empty root, they behave identically. But `generate` documents the intent. Six months from now, someone reading the component will know immediately that the DOM isn't part of the contract — no markup authored, no `id` matching, no enhancement path.

The other benefit is robustness: if some other code later inserts a `<span id="name">` into the root, `auto` would try to enhance it and the layout could break. `generate` would ignore it. For mount-point containers where the surrounding app might inject content, `generate` is the safer contract.


## Related

- [Auto Mode Overview](../auto/AutoFieldMode.md)
- [Auto Mode with Existing Markup](../auto/AutoWithMarkup.md)
- [Existing Mode](../existing/ExistingMode.md)
- [Targeted Mode](../targeted/TargetedFieldMode.md) — for explicit per-element rendering


## Summary

- `generate` mode ignores the DOM and builds every field from metadata.
- It is designed for **empty roots** — mount points and containers.
- On an empty root, it is equivalent to `auto`, but with clearer intent.
- It creates one `.smq-data-editor-fields` container and populates it with every non-excluded field.
- Do not author fields alongside `generate` mode — `id` collisions and orphaned elements follow.
- Loading uses the same lifecycle as `auto` and `existing` — `endpoint` is enough.