# DataEditor — Auto Field Mode

## Overview

The `auto` field mode provides a hybrid, metadata-driven approach to rendering fields in `DataEditor`.

It allows a component to provide custom field markup where required while allowing `DataEditor` to automatically generate any fields that have not been provided.

This makes `auto` the recommended default when a resource should be rendered from TypeCaster metadata without requiring every field to be manually defined in the component.

```javascript
fieldMode: 'auto'
```


## Basic Usage

A typical Semantq component using `auto` mode can remain very small:

```semantq
@script

import { DataEditor } from '@semantq/data-editor';
import { Notification } from '@semantq/ql';
import AppConfig from '/public/auth/js/config.js';

const model = 'Product';
const endpoint = '/Product/Products';
const recordId = new URLSearchParams(window.location.search).get('rid');

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
        fieldMode: 'auto'
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

The component does not need to define individual fields.

`DataEditor` obtains the field definitions from the supplied metadata and determines how each field should be rendered.



# How Auto Mode Works

When `fieldMode` is set to `auto`, `DataEditor` evaluates each field defined by the metadata.

For every field, it follows this process:

```text
Metadata field
      │
      ▼
Does a matching DOM element exist?
      │
      ├── YES ──► Enhance existing element
      │
      └── NO ───► Generate field automatically
```

Therefore, `auto` combines the behaviour of the existing and generated field strategies.



# Empty Container

The simplest implementation is an empty container:

```html
<div id="data-editor"></div>
```

When no field elements exist inside the container, `DataEditor` generates the fields automatically.

For example, if the metadata contains:

```text
name
description
price
active
```

the editor will generate the corresponding fields.

Conceptually:

```text
#data-editor
      │
      ├── name
      ├── description
      ├── price
      └── active
```

No individual field markup is required in the component.



# Existing Fields

Auto mode can also work with markup that already exists.

If a field corresponding to a metadata field is already present in the DOM, `DataEditor` can enhance that element rather than generating another field for it.

This allows a component to control the presentation of selected fields while leaving the remaining fields to automatic generation.

Conceptually:

```text
Metadata
   │
   ├── name ──────────► existing DOM element → enhance
   │
   ├── description ───► no DOM element → generate
   │
   ├── price ─────────► no DOM element → generate
   │
   └── active ────────► existing DOM element → enhance
```

This is the primary reason to use `auto` rather than `generate`.



# Generated Fields

When a metadata field has no corresponding DOM element, `DataEditor` generates the field automatically.

The generated field is based on the metadata supplied by the TypeCaster/DataEditor integration.

The component therefore does not need to know the complete database schema.

For example:

```text
TypeCaster metadata
        │
        ▼
DataEditor
        │
        ├── String
        ├── Int
        ├── Decimal
        ├── Boolean
        ├── DateTime
        ├── String[]
        └── JSON
```

The appropriate registered editor is then used for each field.



# TypeCaster Integration

`auto` mode is particularly useful with TypeCaster because the component does not need to manually describe the resource's fields.

The responsibility is divided between the two systems:

```text
TypeCaster
    │
    │ Field and type metadata
    ▼
DataEditor
    │
    │ Rendering and editing
    ▼
Editor Registry
    │
    │ Appropriate field editor
    ▼
User Interface
```

TypeCaster remains responsible for describing the data.

DataEditor remains responsible for presenting and editing it.

This separation allows the same DataEditor component pattern to be reused across different resources.



# Resource Pattern

A resource editor can therefore follow the same structure for different models.

For example:

```javascript
const model = 'Product';
const endpoint = '/Product/Products';
```

The DataEditor configuration remains unchanged:

```javascript
new DataEditor({
    root: document.getElementById('data-editor'),
    model: model,
    endpoint: fullEndpoint,
    recordId: recordId,
    baseUrl: AppConfig.BASE_URL,
    layout: 'inline', // or stacked
    fieldMode: 'auto'
}).mount();
```

Another resource can use the same pattern:

```javascript
const model = 'Resident';
const endpoint = '/Resident/Residents';
```

The component does not need to be rewritten around the individual fields.



# Auto Mode and `fields`

The `fields` option can be used when only a subset of the metadata fields should be rendered.

For example:

```javascript
fields: ['name', 'description', 'price']
```

with:

```javascript
fieldMode: 'auto'
```

means that DataEditor works with the selected fields rather than automatically rendering every available field.

The same existing-versus-generated decision is then applied to those fields.



# Auto Mode and Layout

`fieldMode` controls **field discovery and rendering strategy**.

`layout` controls **how the resulting fields are presented**.

For example:

```javascript
fieldMode: 'auto',
layout: 'inline'
```

means:

```text
AUTO
  ↓
discover / generate / enhance fields
  ↓
INLINE
  ↓
apply inline field layout (title and value are inline)
```

The two options therefore serve different purposes.



# When to Use Auto Mode

Use `auto` when:

* fields should normally be generated from metadata;
* some fields may require custom markup;
* the component should remain small;
* TypeCaster provides the field metadata;
* the resource schema may change over time;
* the same editor pattern should work across multiple resources.

For a standard TypeCaster-backed resource editor, `auto` is generally the most flexible option.



# Auto Mode Compared With Other Modes

| Mode       | Behaviour                                                                  |
| - | -- |
| `existing` | Only enhances fields already present in the DOM                            |
| `generate` | Generates all fields from metadata and ignores existing field markup       |
| `auto`     | Enhances existing fields and generates missing fields                      |
| `targeted` | Resolves explicitly targeted DOM elements using `data-editor-*` attributes |

The key distinction is:

```text
existing  → existing markup only

generate  → generated markup only

auto      → existing + generated

targeted  → explicitly targeted elements
```



# Recommended Default

For a normal TypeCaster-backed resource editor:

```javascript
fieldMode: 'auto'
```

is the recommended starting point.

Combined with an empty root:

```html
<div id="data-editor"></div>
```

it provides a fully metadata-driven editor without requiring the component author to manually define every field.

If specific fields later require custom markup, those fields can be introduced into the component while the remaining fields continue to be generated automatically.



# Design Principle

The purpose of `auto` mode is to keep the component concerned with **resource configuration**, rather than field implementation.

The component specifies:

```text
Which model?
Which endpoint?
Which record?
Which layout?
```

TypeCaster/DataEditor determine:

```text
Which fields?
Which types?
Which editors?
How are they rendered?
```

This produces a reusable pattern:

```text
Semantq Component
       │
       │ model + endpoint + record
       ▼
    DataEditor
       │
       ▼
 TypeCaster Metadata
       │
       ▼
 Automatic Field Rendering
```

The result is a small, predictable Semantq component with the field complexity handled by the DataEditor/TypeCaster system.
