# `excludeFields` in Auto Mode

A focused guide to the `excludeFields` option as it behaves under `fieldMode: 'auto'`.

## What it does

`excludeFields` is a **denylist**. Any field name in the array is removed from the set of fields DataEditor considers for rendering.

In Auto mode, that means:

- The field is never enhanced if it exists in the DOM.
- The field is never generated into the container.
- The field is never bound, never gets an edit indicator, and is not part of the rendered surface.

Excluded fields remain in the fetched record and metadata. They just don't render.


## The Auto mode pipeline, with `excludeFields`

```
metadata.fields         ← full set, from the endpoint
        ↓
fields (allowlist)      ← applied only if you supplied `fields`
        ↓
excludeFields (denylist)← removes names from the surviving set
        ↓
fieldEntries            ← what Auto mode will actually render
        ↓
for each entry:
    if DOM element with matching id exists
        → _enhanceExistingField()
    else
        → _generateField()
```

`excludeFields` sits between the allowlist (if any) and the existing-vs-generated decision. Everything downstream operates on the filtered set. Auto mode never sees an excluded field.


## Minimal example

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
        fieldMode: 'auto',
        excludeFields: excludeFields
    }).mount();

})

@end


@style

#data-editor {
    width: 100%;
}

@end


@html

<div id="data-editor"></div>
```

With a `Product` model whose metadata lists `id`, `name`, `description`, `sku`, `price`, `stock`, `active`, `category`, `createdAt`, `updatedAt`, this renders:

```
name, description, sku, price, stock, active, category
```

`id`, `createdAt`, and `updatedAt` are absent.


## How Auto mode treats excluded fields

The exclusion happens **before** Auto mode runs. So the existing-vs-generated decision is never made for excluded fields.

Two consequences:

**1. An excluded field that has a matching DOM element is left alone.**

If your markup contains:

```html
<span id="createdAt"></span>
```

and `createdAt` is in `excludeFields`, DataEditor does not enhance it. The element stays as authored — no `smq-data-editable` class, no data attributes, no click handler.

**2. An excluded field is never generated.**

Auto mode does not create a container entry for it. There is no `.smq-data-editor-field[data-field="createdAt"]` in the rendered output.

Both behaviors are correct — the intent of exclusion is "leave this field out of the editor entirely."


## Precedence with `fields`

When both are supplied:

```
metadata.fields
      ↓
   fields        ← allowlist: keep only these names
      ↓
 excludeFields   ← denylist: remove these names
      ↓
   render
```

Example:

```js
fields: ['name', 'description', 'price', 'sku'],
excludeFields: ['description']
```

Renders: `name`, `price`, `sku`.

`description` survives the allowlist, then gets removed by the denylist. The two options compose cleanly.

**Only `excludeFields` (no `fields`):**

```js
excludeFields: ['id', 'createdAt', 'updatedAt']
```

Renders: every metadata field except those three.

**Only `fields` (no `excludeFields`):**

```js
fields: ['name', 'price', 'sku']
```

Renders: exactly those three. `excludeFields` is a no-op.

**Neither:**

Renders: everything in `metadata.fields`.


## When to reach for `excludeFields` instead of `fields`

The choice is about which list is shorter and more stable.

| Scenario | Better choice | Why |
|---|---|---|
| Hide `id`, `createdAt`, `updatedAt` from a 12-field model | `excludeFields` | 3 names to maintain, vs. 9 |
| Show only `name` and `price` from a 12-field model | `fields` | 2 names to maintain, vs. 10 |
| Model gains fields over time | `excludeFields` | New fields appear automatically |
| Model rarely changes, form is fixed | Either | Both are stable |
| Form is a summary view | `fields` | Explicit about what's shown |

The rule of thumb: **list the smaller side.**


## Verifying the exclusion

### Confirm the rendered set

```js
[...document.querySelectorAll('#data-editor .smq-data-editor-field')]
  .map(el => el.dataset.field);
```

Returns the field names that actually rendered.

### Confirm excluded fields are absent

```js
const excluded = ['id', 'createdAt', 'updatedAt'];

[...document.querySelectorAll('#data-editor .smq-data-editor-field')]
  .map(el => el.dataset.field)
  .filter(f => excluded.includes(f));
```

Expected: `[]`.

### Confirm the count matches expectations

If `metadata.fields` has 10 entries and you exclude 3, expect **7** rendered fields. If the count differs:

- **Fewer than expected** → some metadata field names don't match what you passed. Check casing and exact spelling.
- **More than expected** → an excluded name is misspelled, or the field appears under a different name in `metadata.fields` than in your schema.


## Behavior rules

| Rule | Detail |
|---|---|
| **Denylist only** | `excludeFields` removes fields. It never adds them. |
| **Silent drops** | A name not present in `metadata.fields` is ignored without warning. |
| **Empty array = no-op** | `excludeFields: []` behaves as if the option were absent. |
| **Non-array ignored** | A non-array value is treated as absent. |
| **Applied after `fields`** | If both are supplied, the allowlist runs first. |
| **Render-only** | Does not affect what is fetched or what is sent on create. |
| **Ignored in `targeted` mode** | In `fieldMode: 'targeted'`, the DOM is authoritative and neither `fields` nor `excludeFields` is consulted. |


## Interaction with Auto mode's two branches

Auto mode decides per field: **enhance** if a matching DOM element exists, **generate** if not.

Because `excludeFields` filters `fieldEntries` before that decision, both branches inherit the exclusion for free:

| Field state | Effect of exclusion |
|---|---|
| Exists in DOM, in metadata, **not** excluded | Auto enhances it |
| Exists in DOM, in metadata, **excluded** | Auto ignores it — element untouched |
| Missing from DOM, in metadata, **not** excluded | Auto generates it |
| Missing from DOM, in metadata, **excluded** | Auto ignores it — nothing generated |

No special-casing is required. The exclusion is upstream of both branches.


## Common patterns

### Hide system fields

```js
excludeFields: ['id', 'createdAt', 'updatedAt', 'deletedAt']
```

### Hide a field the user shouldn't touch

```js
excludeFields: ['internalNotes', 'reviewedBy']
```

Use this when the field should not be visible in the editor at all. To show it read-only instead, use `editable: false` on the field's metadata, or `permissions.canUpdate: false`.

### Hide types that need special handling

```js
excludeFields: ['metadata', 'children', 'contacts']
```

Useful when relation fields or JSON blobs aren't ready for inline editing, but you still want the rest of the record editable.

### Progressive rollout

Start with a conservative exclude list, narrow it over time:

```js
// Week 1
excludeFields: ['id', 'createdAt', 'updatedAt', 'children', 'contacts']

// Week 2 — relation support ready
excludeFields: ['id', 'createdAt', 'updatedAt']
```

The render surface grows predictably, and no markup changes are needed.


## Gotchas

**Metadata names must match exactly.** If the backend emits `created_at` but you pass `createdAt`, the exclusion silently does nothing. Check the actual keys:

```js
console.log(Object.keys(response.metadata.fields));
```

**Excluded fields still arrive in the fetched record.** The `record` object contains all fields the API returned, including excluded ones. `excludeFields` is presentation-only.

**Excluded fields can still be sent on create.** When creating a new record, DataEditor sends the local `record` object — which includes excluded fields if they were seeded from a fetch. If you need to prevent that, filter them out before mount or handle it in the backend.

**The option has no effect in `targeted` mode.** If you're using `fieldMode: 'targeted'`, control visibility by removing the `[data-editor-field]` elements from the markup.

**Case matters.** `ExcludeFields`, `exclude_fields`, and `excludeField` are all wrong. The option name is exactly `excludeFields`.


## Summary

- `excludeFields` is a denylist for the metadata-driven field set.
- Under Auto mode, it filters fields before the enhance-or-generate decision, so both branches inherit the exclusion.
- It composes with `fields`: allowlist first, then denylist.
- It does not apply in `targeted` mode.
- It is a render-time concern only — nothing about fetching or persistence changes.

For a model where you're hiding a handful of fields, `excludeFields` is the right tool. For a summary view where you're showing a handful, use `fields`.


