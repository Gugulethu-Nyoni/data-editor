# DataEditor — Targeted Mode

## Overview

`targeted` mode renders fields into **named containers you declare**. The component specifies **which fields go where**, and DataEditor generates the field targets, resolves them against metadata, and wires up editing.

```text
fieldLayout
     │
     ├── identity → [name, sku, category]
     └── pricing  → [price, stock, active]
                        │
                        ▼
             data-editor-target="identity"
             data-editor-target="pricing"
                        │
                        ▼
                  DataEditor
                        │
                   metadata + model
                        │
                        ▼
                 generate targets
                        │
                        ▼
                  existing editors
```

Two declarations, and DataEditor does the rest:

- **`fieldLayout`** in `@script` — what fields belong in which group.
- **`data-editor-target`** in `@html` — where each group renders.

## When to use this

Use `targeted` mode when:

- You want explicit control over **field grouping**.
- Different sets of fields belong in visually distinct sections.
- You want the component to declare its structure without hand-authoring every field element.
- The layout is driven by your design, not by raw metadata order.

If you want a flat list of fields with automatic generation, use `generate`. If you want to author each field element yourself, use `existing`.

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

const fieldLayout = {
    identity: [
        'name',
        'sku',
        'category'
    ],
    pricing: [
        'price',
        'stock',
        'active'
    ]
};

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
        fieldMode: 'targeted',
        fieldLayout: fieldLayout,
        excludeFields: excludeFields
    }).mount();

})

@end


@style

#data-editor {
    width: 100%;
}

#data-editor [data-editor-target] {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
}

@end


@html

<div id="data-editor">

    <div data-editor-target="identity"></div>

    <div data-editor-target="pricing"></div>

</div>
```

Three declarations:

1. `model` — used for the generated `data-editor-model` attribute.
2. `fieldLayout` — the field-to-target mapping.
3. `data-editor-target` divs — where each mapping renders.

Nothing else is required. The component stays thin.

## The `fieldLayout` option

A plain object whose keys are target names and whose values are arrays of field names.

```js
const fieldLayout = {
    identity: ['name', 'sku', 'category'],
    pricing:  ['price', 'stock', 'active']
};
```

Rules:

- Each key must match a `data-editor-target="<key>"` element in the root.
- Each value must be an array of field names from the metadata.
- Fields are rendered in the order listed.
- A field can appear in more than one target if you want it duplicated (rare, but permitted).
- Fields not listed anywhere are not rendered — even if they exist in metadata and aren't excluded.

The `fieldLayout` option is **only honored in `targeted` mode**. It is ignored by `auto`, `existing`, and `generate`.


## The `data-editor-target` attribute

Declares a container for a named group.

```html
<div data-editor-target="identity"></div>
```

Rules:

- The value must match a key in `fieldLayout`.
- The element can be any tag — `<div>`, `<section>`, `<fieldset>`, whatever fits.
- Position in the root determines visual placement.
- The container must exist when `mount()` runs. DataEditor does not create it.

If a `fieldLayout` key has no matching `data-editor-target` element in the root, DataEditor logs:

```
[DataEditor] Target container not found: identity
```

and skips that group. Other groups still render.


## What DataEditor generates

For each target and each field in its layout array, DataEditor creates:

```html
<div class="smq-data-editor-field" data-field="name">
  <span class="smq-data-editor-label">name</span>
  <div class="smq-data-editor-value">
    <span data-editor-field="name"
          data-editor-model="Product"
          data-editor-field-name="name"
          data-editor-record-id="..."
          class="smq-data-editable"
          data-field="name"
          data-model="Product"
          data-record-id="..."
          data-editable="true"
          data-smq-data-editor-bound="true">Widget</span>
    <button class="smq-data-editor-indicator">✎</button>
  </div>
</div>
```

Notes on the structure:

- The `.smq-data-editor-field` wrapper is the same one used by `auto` and `generate`. This means the layout CSS (`inline` / `stacked`) applies uniformly across all three modes.
- The `.smq-data-editor-label` holds the field name.
- The `.smq-data-editor-value` container holds the value span and the pencil indicator.
- The `data-editor-*` attributes on the value span are what `_resolveFieldTarget()` reads during editing.


## The DOM after mount

**Before mount:**

```html
<div id="data-editor">
  <div data-editor-target="identity"></div>
  <div data-editor-target="pricing"></div>
</div>
```

**After mount (with `layout: 'inline'`):**

```html
<div id="data-editor">
  <div data-editor-target="identity"
       class="smq-data-editor-layout-inline"
       data-layout="inline">
    <div class="smq-data-editor-field" data-field="name">
      <span class="smq-data-editor-label">name</span>
      <div class="smq-data-editor-value">
        <span class="smq-data-editable" ...>Widget</span>
        <button class="smq-data-editor-indicator">✎</button>
      </div>
    </div>
    <div class="smq-data-editor-field" data-field="sku">...</div>
    <div class="smq-data-editor-field" data-field="category">...</div>
  </div>
  <div data-editor-target="pricing"
       class="smq-data-editor-layout-inline"
       data-layout="inline">
    <div class="smq-data-editor-field" data-field="price">...</div>
    <div class="smq-data-editor-field" data-field="stock">...</div>
    <div class="smq-data-editor-field" data-field="active">...</div>
  </div>
</div>
```

Facts:

1. **Each target container receives the layout class** — `smq-data-editor-layout-inline` or `-stacked`, plus a `data-layout` attribute. This is what drives field-level CSS.
2. **Fields render in the order listed in `fieldLayout`**, not in metadata order.
3. **Each field has its own wrapper**, own label, own value container, and own pencil indicator.
4. **The `identity` container and the `pricing` container are siblings** under the root.


## How this differs from the other modes

| Mode | Field set comes from | DOM declares |
|---|---|---|
| `auto` | metadata (`fields`/`excludeFields`) | Optional enhancement targets (`#id`) |
| `existing` | metadata | Every field's element (`#id`) |
| `generate` | metadata | Nothing (empty root) |
| `targeted` | **`fieldLayout`** | Container grouping (`data-editor-target`) |

`targeted` is the only mode where the **field set and grouping** are component-declared rather than metadata-derived. Metadata is used only to resolve each field's editor and value.


## Loading behavior

`targeted` uses the same internal loading lifecycle as `auto`, `existing`, and `generate`. When `endpoint` is provided, DataEditor fetches the record and metadata before rendering:

```
mount()
   │
   ▼
_canRead()?
   │
   ▼
endpoint + fieldMode in ['auto','existing','generate','targeted']?
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
_renderFields() → targeted branch
   │
   ▼
_generateTargets() → creates field wrappers in each data-editor-target
   │
   ▼
_renderTargetedFields() → resolves and renders each generated target
```

You do not need to fetch or supply metadata yourself. The same constructor options that work for `auto` work here.

## Field filtering

Both `fields` and `excludeFields` apply in `targeted` mode, but they operate at different points:

- **`excludeFields`** — removed from the metadata set before `fieldLayout` is consulted. An excluded field listed in `fieldLayout` is silently skipped.
- **`fields`** — if provided, it filters the metadata set first. Then `fieldLayout` narrows further. A field must appear in both to render.

For most cases, use `excludeFields` to hide system fields and `fieldLayout` to group the rest.


## Layout

The `layout` option (`'inline'` or `'stacked'`) applies to each field wrapper, same as the other modes:

- **`inline`** — label, value, and pencil on one row.
- **`stacked`** — label above; value and pencil on a row beneath.

DataEditor applies the layout class to the `data-editor-target` containers, and the field-level CSS keys off it. No target-specific CSS is needed — the same rules that drive `auto` and `generate` apply here.

Below 600px viewport width, both layouts collapse to stacked. This is a library-level responsive rule.


## Verification

After mount, run in the console:

**Confirm the target containers received their layout class:**

```js
[...document.querySelectorAll('[data-editor-target]')].map(c => ({
  target: c.dataset.editorTarget,
  layout: c.dataset.layout,
  cls: c.className,
  fields: [...c.querySelectorAll('.smq-data-editor-field')]
    .map(w => w.dataset.field)
}));
```

Expected:

```
[
  { target: 'identity', layout: 'inline', cls: 'smq-data-editor-layout-inline',
    fields: ['name', 'sku', 'category'] },
  { target: 'pricing', layout: 'inline', cls: 'smq-data-editor-layout-inline',
    fields: ['price', 'stock', 'active'] }
]
```

**Confirm each field has its own wrapper, label, value, and indicator:**

```js
[...document.querySelectorAll('.smq-data-editor-field')].map(w => ({
  field: w.dataset.field,
  hasLabel: !!w.querySelector('.smq-data-editor-label'),
  hasValue: !!w.querySelector('.smq-data-editable'),
  hasIndicator: !!w.querySelector('.smq-data-editor-indicator')
}));
```

Expected: all `true`.


## Pitfalls

**1. `fieldLayout` keys must match `data-editor-target` values.**

If the layout declares `identity` but the HTML has `data-editor-target="Identity"` (capital I), the lookup fails. DataEditor logs:

```
[DataEditor] Target container not found: identity
```

and skips the group.

**2. Fields not in `fieldLayout` are not rendered.**

Even if a field is in metadata and not excluded, if it isn't listed in any `fieldLayout` group, it doesn't appear. This is different from the other modes, where the metadata is the source of truth. In targeted mode, `fieldLayout` is the source of truth.

**3. Excluded fields are skipped silently.**

If `fieldLayout` lists `id` and `excludeFields` contains `id`, the field is dropped without warning. The two lists interact, and exclusion wins.

**4. Unknown fields produce a warning but don't break the layout.**

If `fieldLayout` lists a field not present in metadata, `_resolveFieldTarget()` logs:

```
[DataEditor] Field "xyz" not found in metadata.
```

The other fields in the group still render.

**5. The `data-editor-target` element must exist before mount.**

DataEditor does not create the target containers. If you declare `identity` in `fieldLayout` but the HTML has no `<div data-editor-target="identity">`, the group is skipped.

**6. `fieldLayout` is ignored outside `targeted` mode.**

Setting `fieldLayout` with `fieldMode: 'auto'` has no effect. If you want grouping in another mode, either use `targeted` or arrange the fields with `auto`'s `id` matching.

**7. Field order within a group is determined by `fieldLayout`, not metadata.**

The array order is authoritative. This is a feature — it lets you arrange fields independently of the backend's field emission order.

## Related

- [Auto Mode Overview](../auto/AutoFieldMode.md)
- [Auto Mode with Existing Markup](../auto/AutoWithMarkup.md)
- [Excluding Fields in Auto Mode](../auto/ExcludeFields.md)
- [Existing Mode](../existing/ExistingMode.md)
- [Generate Mode](../generate/GenerateFieldMode.md)

## Summary

- `targeted` mode renders fields into **named containers** you declare.
- `fieldLayout` declares **what fields go where**.
- `data-editor-target` declares **where each group renders**.
- DataEditor generates the field wrappers, resolves metadata, and wires up editing.
- The `layout` option (`inline` / `stacked`) applies to each generated field, same as the other modes.
- Loading uses the same lifecycle as `auto`, `existing`, and `generate` — `endpoint` is enough.
- Fields not listed in `fieldLayout` do not render, regardless of metadata.

