# DataEditor — Permissions

## Overview

DataEditor accepts a `permissions` object that gates what a user can see and do. The object is **deny-only**: absence means permitted, and `false` means denied.

```js
permissions: {
  canRead:   true,
  canCreate: true,
  canUpdate: user.role !== 'viewer',
  canDelete: user.role === 'admin'
}
```

Permissions can be expressed at four levels — global, per-field, and via master switches (`editable`, `deletable`). The most specific denial wins.

In a SaaS context, permissions usually come from the authenticated user's capability list — for example, `user.features` in Semantq's auth system.


## Non-SaaS vs SaaS contexts

**Non-SaaS** — permissions are optional. Omit them entirely:

```js
new DataEditor({
  root: document.getElementById('data-editor'),
  model: 'Product',
  endpoint: `/Product/Products/${recordId}`,
  recordId,
  baseUrl: AppConfig.BASE_URL,
  layout: 'inline',
  fieldMode: 'auto'
}).mount();
```

Result: read and update permitted, delete denied (because `deletable` defaults to `false`).

**SaaS** — pass the capability-derived permissions:

```js
const userFeatures = user?.features || [];

new DataEditor({
  root: document.getElementById('data-editor'),
  model: 'Product',
  endpoint: `/Product/Products/${recordId}`,
  recordId,
  baseUrl: AppConfig.BASE_URL,
  layout: 'inline',
  fieldMode: 'auto',
  permissions: {
    canRead:   userFeatures.includes('product_read'),
    canCreate: userFeatures.includes('product_create'),
    canUpdate: userFeatures.includes('product_update'),
    canDelete: userFeatures.includes('product_delete')
  },
  editable: userFeatures.includes('product_update'),
  deletable: userFeatures.includes('product_delete')
}).mount();
```

The same component serves both contexts because the permission object is deny-only. Absence = allowed. A missing `permissions` object means nothing is denied.


## The component — SaaS example

```semantq
@script

import { DataEditor } from '@semantq/data-editor';
import { Notification } from '@semantq/ql';
import { isAuthenticated, user } from '/public/auth/js/auth.js';
import AppConfig from '/public/auth/js/config.js';

const model = 'Product';
const endpoint = '/Product/Products';
const recordId = new URLSearchParams(window.location.search).get('rid');

const excludeFields = [
    'id',
    'createdAt',
    'updatedAt'
];

const userFeatures = user?.features || [];

const canRead   = userFeatures.includes('product_read');
const canCreate = userFeatures.includes('product_create');
const canUpdate = userFeatures.includes('product_update');
const canDelete = userFeatures.includes('product_delete');

$onMount(() => {

    if (!isAuthenticated) {
        console.log('[Product] User is not authenticated.');
        return;
    }

    if (!recordId) {
        Notification.show({
            type: 'warning',
            message: 'A record ID is required to edit this resource.'
        });
        return;
    }

    if (!canRead) {
        Notification.show({
            type: 'warning',
            message: 'You do not have permission to view this resource.'
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
        excludeFields: excludeFields,
        permissions: {
            canRead: canRead,
            canCreate: canCreate,
            canUpdate: canUpdate,
            canDelete: canDelete
        },
        editable: canUpdate,
        deletable: canDelete
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

## What each permission gates

| Permission | Effect when `false` |
|---|---|
| `canRead` | DataEditor does not render. `mount()` returns immediately. |
| `canCreate` | Reserved. Accepted but not currently consulted by the create path. See *Gaps*. |
| `canUpdate` | Edit indicators disappear. Field clicks do nothing. |
| `canDelete` | Delete button does not render. |

Additionally:

- **`editable: false`** — master switch that kills editing independent of `permissions`.
- **`deletable: true`** — required to make the delete button appear, regardless of `permissions.canDelete`.

The delete interaction:

| `deletable` | `permissions.canDelete` | Delete button |
|---|---|---|
| `false` (default) | any | no |
| `true` | omitted | yes |
| `true` | `false` | no |
| `true` | `true` | yes |

So delete requires **both** `deletable: true` and a non-denied `canDelete`.


## Deriving capabilities from `user.features`

Semantq's auth exposes `user.features` as an array of capability strings. The convention is `<resource>_<action>`:

```
product_read
product_create
product_update
product_delete
```

For a resource named `Product`:

```js
const slug = model.toLowerCase();

const canRead   = userFeatures.includes(`${slug}_read`);
const canCreate = userFeatures.includes(`${slug}_create`);
const canUpdate = userFeatures.includes(`${slug}_update`);
const canDelete = userFeatures.includes(`${slug}_delete`);
```

This generalises into a helper:

```js
function capabilitiesFor(model, features) {
  const slug = model.toLowerCase();
  return {
    canRead:   features.includes(`${slug}_read`),
    canCreate: features.includes(`${slug}_create`),
    canUpdate: features.includes(`${slug}_update`),
    canDelete: features.includes(`${slug}_delete`)
  };
}
```

Then:

```js
const permissions = capabilitiesFor(model, user?.features || []);

new DataEditor({
  // ...
  permissions,
  editable: permissions.canUpdate,
  deletable: permissions.canDelete
}).mount();
```

## Field-level permissions

A backend can mark individual fields as read-only via metadata:

```js
metadata: {
  fields: {
    name:    { editor: 'text' },
    balance: { editor: 'number', editable: false },
    role:    { editor: 'enum', permissions: { canUpdate: false } }
  }
}
```

DataEditor honours both:

- `metadata.fields.<name>.editable === false` → field is read-only
- `metadata.fields.<name>.permissions.canUpdate === false` → same effect

If your backend derives this from the authenticated user, the component does not need to do anything — the metadata already encodes the decision.


## Master switches vs permissions

Two ways to gate editing:

| Approach | Use when |
|---|---|
| `editable: false` | You want read-only rendering regardless of user role. |
| `permissions.canUpdate: false` | You want permission-driven editing. |

They compose: `_canUpdate()` returns `false` if **either** is set to deny. The most restrictive wins.

Similarly for delete:

| Approach | Use when |
|---|---|
| `deletable: false` (the default) | You never want a delete button. |
| `deletable: true` + `permissions.canDelete: false` | You want the delete button gated on role. |


## Common patterns

### Read-only admin view

```js
permissions: { canRead: true },
editable: false
```

### Editor role — no delete

```js
permissions: {
  canRead: true,
  canUpdate: true,
  canDelete: false
},
editable: true,
deletable: false
```

### Admin — full access

```js
permissions: {
  canRead: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true
},
editable: true,
deletable: true
```

### Viewer — nothing

```js
permissions: {
  canRead: true,
  canUpdate: false,
  canDelete: false
},
editable: false
```

### Unauthenticated — nothing

Return from the mount handler before constructing DataEditor. Or construct with `permissions: { canRead: false }` and let DataEditor skip the render.

### Hybrid — create but not edit

```js
permissions: {
  canRead: true,
  canCreate: true,
  canUpdate: false,
  canDelete: false
}
```

Note the gap — see *Gaps*.


## Gaps

**1. `canCreate` is not honoured by the current DataEditor.**

The permission object accepts it, but `_canUpdate()` is the only gate consulted in `_commitElement()`. A user with `canCreate: true, canUpdate: false` cannot create records inline — the create path is reached only through editable fields, and `canUpdate: false` blocks edits first.

For a genuinely create-only role, the current workaround is to gate the resource externally — render a read-only DataEditor and provide a separate create form.

**2. Per-field `permissions.canCreate` is not supported.**

Only `canUpdate` is checked at the field level.

**3. Delete requires `deletable: true` even in a permissions-driven context.**

The master switch is not inferred from `permissions.canDelete`. Both must be set for the button to appear. This is intentional (delete is destructive, so the default is deny), but it means the two options must stay in sync.


## Verification

After mount, confirm the permission state was applied.

**Editing disabled (viewer role):**

```js
document.querySelectorAll('.smq-data-editor-indicator').length;
```

Expected: `0`.

**Editing enabled:**

```js
document.querySelectorAll('.smq-data-editor-indicator').length;
```

Expected: equal to the number of non-excluded, editable fields.

**Delete button (admin role):**

```js
document.querySelector('.smq-data-editor-delete');
```

Expected: a `<button>` element. In a viewer role, `null`.

**canRead false — no render:**

```js
document.querySelectorAll('.smq-data-editor-field, .smq-data-editable').length;
```

Expected: `0`.


## Related

- [Auto Mode Overview](auto/AutoFieldMode.md)
- [Existing Mode](existing/ExistingMode.md)
- [Generate Mode](generate/GenerateFieldMode.md)
- [Targeted Mode](targeted/TargetedMode.md)

## Summary

- `permissions` is a deny-only object: `{ canRead, canCreate, canUpdate, canDelete }`.
- Absence = permitted. Only `false` denies.
- Delete requires **both** `deletable: true` and `permissions.canDelete !== false`.
- Non-SaaS components can omit `permissions` entirely and rely on defaults.
- SaaS components derive permissions from `user.features` using the `<resource>_<action>` convention.
- Field-level read-only is set via metadata (`editable: false` or `permissions.canUpdate: false`).
- The component stays thin — permission logic lives outside DataEditor; DataEditor only consumes the resulting booleans.