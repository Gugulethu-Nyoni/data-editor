# @semantq/data-editor

A metadata-driven, inline data editor for Semantq applications.

`@semantq/data-editor` turns rendered data into editable fields using field metadata and a registry of editor components. It provides a consistent editing lifecycle for scalar values, structured values, native browser controls, validation, mutation, and display restoration.

The package is designed around a simple principle:

> **The data and metadata determine how a field is displayed and edited.**

Instead of writing field-specific forms, input logic, CRUD operations, and editing behaviour for every resource, applications provide the record, its TypeCaster-generated metadata, and the API endpoint. **TypeCaster describes what the data is; DataEditor determines how that data is presented and edited.**

Together, TypeCaster and DataEditor take care of much of the work normally required to build resource management interfaces. TypeCaster supplies the schema-driven metadata — including field types, structures, constraints, and relationships — while DataEditor uses that metadata to automatically construct appropriate editing interfaces and handle the underlying data lifecycle.

This means an application does not need to manually build a separate form or write bespoke CRUD logic for each resource. DataEditor can load an existing record, determine the appropriate input for each field, create a new record when one does not yet exist, edit and validate values, and execute the corresponding create, update, and delete operations through the configured API.

The application therefore remains responsible for defining **what resource it is working with and where its data lives**, while TypeCaster and DataEditor handle much of the repetitive work of **understanding, rendering, editing, and persisting that data**.


## Table of Contents

**Reference**

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
  - [Creating a DataEditor](#creating-a-dataeditor)
  - [Mounting the Editor](#mounting-the-editor)
- [Metadata](#metadata)
  - [Field Metadata](#field-metadata)
  - [Editor Metadata](#editor-metadata)
  - [Structured Metadata](#structured-metadata)
- [Supported Editors](#supported-editors)
- [Inline Editing Lifecycle](#inline-editing-lifecycle)
- [Display State](#display-state)
- [Native Browser Controls](#native-browser-controls)
- [Boolean Editing](#boolean-editing)
- [Validation](#validation)
- [Mutations](#mutations)
- [Local-Only Mode](#local-only-mode)
- [Editor Registry](#editor-registry)
- [Metadata Resolver](#metadata-resolver)
- [Base Editor](#base-editor)
- [Custom Editors](#custom-editors)
- [CSS](#css)
- [DOM Conventions](#dom-conventions)
- [API Reference](#api-reference)
- [Debugging](#debugging)
- [Package Structure](#package-structure)
- [Design Principles](#design-principles)
- [Development](#development)
- [Git Workflow](#git-workflow)
- [Contributing](#contributing)
- [License](#license)

**Guides**

- [Auto Mode Overview](docs/auto/AutoFieldMode.md)
- [Auto Mode with Selected Fields](docs/auto/AutoSelectedFields.md)
- [Excluding Fields in Auto Mode](docs/auto/ExcludeFields.md)
- [Auto Mode with Existing Markup](docs/auto/AutoWithMarkup.md)
- [Existing Mode](docs/existing/ExistingMode.md)
- [Generate Mode](docs/generate/GenerateFieldMode.md)
- [Targeted Mode](docs/targeted/TargetedMode.md)
- [Permissions in SaaS Contexts](docs/SaaS/AutoModePermissions.md)

**Templates**

- [Auto Mode Template](templates/auto/AutoMode.smq)
- [Auto Mode with Selected Fields](templates/auto/SpecificFields.smq)
- [Auto Mode with Exclude Fields](templates/auto/ExcludeFields.smq)
- [Auto Mode with Existing Markup](templates/auto/AutoModeWithMarkup.smq)
- [Existing Mode Template](templates/existing/ExistingMode.smq)
- [Generate Mode Template](templates/generate/GenerateMode.smq)
- [Targeted Mode Template](templates/targeted/TargetedMode.smq)
- [SaaS Auto Mode with Permissions](templates/SaaS/AutoModeSaaS.smq)


# @semantq/data-editor

A metadata-driven, inline data editor for Semantq applications.

`@semantq/data-editor` turns rendered data into editable fields using field metadata and a registry of editor components. It provides a consistent editing lifecycle for scalar values, structured values, native browser controls, validation, mutation, and display restoration.

The package is designed around a simple principle:

> **The data and metadata determine how a field is displayed and edited.**

Instead of writing field-specific edit logic for every resource, applications provide the record, metadata, and mutation mechanism. `DataEditor` resolves the appropriate editor automatically.


## Table of Contents

**Reference**

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Metadata](#metadata)
- [Supported Editors](#supported-editors)
- [Inline Editing Lifecycle](#inline-editing-lifecycle)
- [Display State](#display-state)
- [Native Browser Controls](#native-browser-controls)
- [Boolean Editing](#boolean-editing)
- [Validation](#validation)
- [Mutations](#mutations)
- [Local-Only Mode](#local-only-mode)
- [Editor Registry](#editor-registry)
- [Metadata Resolver](#metadata-resolver)
- [Base Editor](#base-editor)
- [Custom Editors](#custom-editors)
- [CSS](#css)
- [DOM Conventions](#dom-conventions)
- [API Reference](#api-reference)
- [Debugging](#debugging)
- [Package Structure](#package-structure)
- [Design Principles](#design-principles)
- [Development](#development)
- [Git Workflow](#git-workflow)
- [Contributing](#contributing)
- [License](#license)

**Guides**

- [Auto Mode Overview](docs/auto/AutoFieldMode.md)
- [Auto Mode with Selected Fields](docs/auto/AutoSelectedFields.md)
- [Excluding Fields in Auto Mode](docs/auto/ExcludeFields.md)
- [Auto Mode with Existing Markup](docs/auto/AutoWithMarkup.md)
- [Existing Mode](docs/existing/ExistingMode.md)
- [Generate Mode](docs/generate/GenerateFieldMode.md)
- [Targeted Mode](docs/targeted/TargetedMode.md)
- [Permissions in SaaS Contexts](docs/SaaS/AutoModePermissions.md)

**Templates**

- [Auto Mode Template](templates/auto/AutoMode.smq)
- [Auto Mode with Selected Fields](templates/auto/SpecificFields.smq)
- [Auto Mode with Exclude Fields](templates/auto/ExcludeFields.smq)
- [Auto Mode with Existing Markup](templates/auto/AutoModeWithMarkup.smq)
- [Existing Mode Template](templates/existing/ExistingMode.smq)
- [Generate Mode Template](templates/generate/GenerateMode.smq)
- [Targeted Mode Template](templates/targeted/TargetedMode.smq)
- [SaaS Auto Mode with Permissions](templates/SaaS/AutoModeSaaS.smq)


# Overview

`@semantq/data-editor` provides inline editing for data rendered in a Semantq application.

A typical data view might contain:

```html
<span
  class="smq-data-editable"
  data-field="name"
>
  Musad
</span>
```

`DataEditor` enhances the element and associates it with:

- a model
- a record ID
- a field
- field metadata
- an editor implementation
- an optional mutation mechanism

The user can then click the displayed value and edit it without leaving the current view.

Conceptually:

```text
Rendered DOM
     │
     ▼
DataEditor
     │
     ├── MetadataResolver
     │       │
     │       ▼
     │   Field metadata
     │
     ├── EditorRegistry
     │       │
     │       ▼
     │   Editor class
     │
     ▼
Editor UI
     │
     ▼
User input
     │
     ▼
BaseEditor
     │
     ▼
DataEditor._commitElement()
     │
     ├── Local update
     │
     └── Mutation update
     │
     ▼
Display restored
```

# Features

- Metadata-driven inline editing
- Editor registry architecture
- Scalar field editors
- Native browser input support
- Boolean checkbox editing
- Date and datetime editing
- Textarea editing
- Structured data editing
- Custom key-value editing
- Empty-state handling
- Built-in native validation
- Mutation integration
- Local-only editing mode
- Commit/cancel lifecycle
- Display restoration after editing
- Field-level success/error notifications
- Custom editor extensibility
- Model and record identity preserved through editing
- CSS-based editable-field affordances
- [Field filtering](docs/auto/AutoFieldMode.md) via `fields` allowlist and `excludeFields` denylist
- [Permission-aware rendering](docs/SaaS/AutoModePermissions.md) for SaaS contexts


# Architecture

The package is composed of several cooperating layers.

```text
┌───────────────────────────────┐
│          DataEditor           │
│                               │
│ Rendering + editing lifecycle │
└───────────────┬───────────────┘
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
MetadataResolver    EditorRegistry
       │                 │
       ▼                 ▼
 Field metadata      Editor class
                           │
                           ▼
                    ┌─────────────┐
                    │ BaseEditor  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
            Text        Boolean      Structured
```

## Main responsibilities

### `DataEditor`

Responsible for:

- locating editable fields
- attaching field identity
- resolving metadata
- resolving editors
- mounting editors
- handling commits
- handling mutations
- restoring display state
- handling empty display states
- applying [field filtering](docs/auto/AutoFieldMode.md)
- applying [permission gates](docs/SaaS/AutoModePermissions.md)

### `MetadataResolver`

Responsible for resolving metadata for `model`, `recordId`, and `field`.

### `EditorRegistry`

Responsible for mapping editor names to editor classes.

### `BaseEditor`

Provides the common editor lifecycle: `commit()`, `submit()`, `cancel()`, validation, and editor callbacks.

### Individual Editors

Implement field-specific UI behaviour.


# Installation

Install the package through your Semantq project/package setup.

For a workspace installation:

```bash
npm install @semantq/data-editor
```

Or, when working inside the Semantq monorepo, reference the workspace package according to the project's workspace configuration.


# Basic Usage

The canonical templates in [`templates/auto/`](templates/auto/) cover the common cases:

| Template | When to use |
|---|---|
| [`AutoMode.smq`](templates/auto/AutoMode.smq) | Render every metadata field |
| [`SpecificFields.smq`](templates/auto/SpecificFields.smq) | Render a subset via `fields` |
| [`ExcludeFields.smq`](templates/auto/ExcludeFields.smq) | Render everything except a few via `excludeFields` |
| [`AutoModeWithMarkup.smq`](templates/auto/AutoModeWithMarkup.smq) | Enhance authored markup, generate the rest |

For other rendering strategies see [`templates/existing/`](templates/existing/), [`templates/generate/`](templates/generate/), and [`templates/targeted/`](templates/targeted/).

For permission-driven components see [`templates/SaaS/AutoModeSaaS.smq`](templates/SaaS/AutoModeSaaS.smq).

## Creating a DataEditor

```js
const editor = new DataEditor({
  root,
  record,
  metadata,
  model,
  recordId,
  registry,
  mutations,
  editable: true
});
```

Example:

```js
const editor = new DataEditor({
  root: document.querySelector('#record'),
  record: {
    id: '123',
    name: 'Musad',
    age: 26
  },
  metadata: {
    fields: {
      name: { editor: 'text' },
      age:  { editor: 'number' }
    }
  },
  model: 'Resident',
  recordId: '123',
  registry,
  mutations
});
```

## Mounting the Editor

```js
editor.mount();
```

The editor locates editable elements inside the configured root and binds them to the editing lifecycle. Depending on the `fieldMode`, it either enhances existing markup, generates fields from metadata, or both.

See the [Auto Mode Overview](docs/auto/AutoFieldMode.md) for the recommended default.


# Metadata

Metadata determines how fields are edited.

A field can define:

```js
{
  editor: 'text',
  required: true,
  nullable: false
}
```

Example:

```js
const metadata = {
  fields: {
    name:   { editor: 'text',   required: true },
    age:    { editor: 'number', required: true },
    active: { editor: 'boolean' }
  }
};
```

## Field Metadata

| Property    | Description                          |
|---|---|
| `editor`    | Editor implementation to use         |
| `required`  | Whether a value is required          |
| `nullable`  | Whether `null` is allowed            |
| `structure` | Additional structured-field metadata |

## Editor Metadata

Examples:

```js
{ editor: 'text' }
{ editor: 'textarea' }
{ editor: 'boolean' }
{ editor: 'datetime-local' }
{ editor: 'key-value' }
```

## Structured Metadata

```js
{
  editor: 'key-value',
  required: false,
  nullable: true,
  structure: {
    type: 'custom-key-value',
    key: { editor: 'text' },
    value: { editor: 'text' }
  }
}
```


# Supported Editors

Typical editors include:

```text
TextEditor
TextareaEditor
BooleanEditor
DateEditor
DatetimeEditor
NumberEditor
CustomKeyValueEditor
```

The exact available editor set depends on the package version.


# Inline Editing Lifecycle

```text
User clicks field
       │
       ▼
resolveElement()
       │
       ▼
MetadataResolver
       │
       ▼
EditorRegistry
       │
       ▼
Editor instantiated
       │
       ▼
editor.render()
       │
       ▼
Editor mounted
       │
       ▼
User changes value
       │
       ▼
commit()
       │
       ▼
submit()
       │
       ▼
DataEditor._commitElement()
       │
       ├───────────────┐
       ▼               ▼
Local mode       Mutation mode
       │               │
       └───────┬───────┘
               ▼
        _finishEdit()
               │
               ▼
       Display restored
```

Field filtering — via [`fields` and `excludeFields`](docs/auto/AutoFieldMode.md) — happens before this lifecycle begins. Excluded fields never reach the edit stage.

Permission gates — via [`permissions`](docs/SaaS/AutoModePermissions.md) — are checked during binding. Denied fields never become clickable.


# Display State

Display rendering is intentionally separate from value formatting. `DataEditor` distinguishes between:

1. normal values
2. empty structured values
3. editing state

## Normal Display

For:

```js
{ color: 'red', price: '100' }
```

the display becomes:

```text
color: red, price: 100
```

## Empty Structured Fields

For `{}`, the display becomes:

```text
[Add item]
```

with the normal editable-field affordance.

## Editing State

```html
<div class="smq-data-editor-control">
  ...
</div>
```

# Native Browser Controls

The editable-field click handler must not interfere with active editor controls.

```js
if (event.target?.closest?.('.smq-data-editor-control')) {
  return;
}
```

Without this guard, `event.preventDefault()` could block calendar popups, checkbox toggling, select dropdowns, and native time pickers.

# Boolean Editing

Boolean editing is immediate. The Boolean editor listens to `change`:

```text
User checks checkbox
        ↓
Browser toggles checkbox
        ↓
change event
        ↓
commit(true)
        ↓
submit()
        ↓
onCommit(true)
        ↓
DataEditor
```

Unchecking follows the same path with `false`.

# Validation

`BaseEditor` provides native validation support for `input`, `textarea`, and `select`:

```js
if (!control.checkValidity()) {
  control.reportValidity();
  return false;
}
```

# Mutations

When a mutation manager is supplied, committed changes are sent through `this.mutations.update(payload)`:

```js
{
  model,
  recordId,
  field,
  value
}
```

Persistence is separate from editor UI.


# Local-Only Mode

If no mutation manager is configured, `DataEditor` operates in local mode:

```js
this.record[field] = value;
```

Useful for prototypes, demos, local state, testing, and standalone components.


# Editor Registry

```text
" text "              →  TextEditor
" boolean "           →  BooleanEditor
" textarea "          →  TextareaEditor
" custom-key-value "  →  CustomKeyValueEditor
```

Editors can be replaced or extended without changing the `DataEditor` lifecycle.


# Metadata Resolver

Resolution context:

```js
{ model, recordId, field }
```

```text
DataEditor
    │
    ▼
resolveElement()
    │
    ▼
MetadataResolver.resolve()
    │
    ▼
Field metadata
    │
    ▼
EditorRegistry.resolve()
```


# Base Editor

`BaseEditor` is the common superclass for editor implementations.

- **`commit(value)`** — stores the current editor value. Does not invoke `onCommit()`.
- **`submit()`** — validates and invokes `onCommit(this.value)`.
- **`cancel()`** — invokes `onCancel()`.


# Custom Editors

Custom editors extend `BaseEditor`:

```js
import BaseEditor from '../BaseEditor.js';

export default class CustomEditor extends BaseEditor {

  render() {
    const input = document.createElement('input');

    input.type = 'text';
    input.value = this.value ?? '';

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.commit(input.value);
        this.submit();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        this.cancel();
      }
    });

    this.element = input;
    return input;
  }
}
```

Custom editors should:

1. render their own controls
2. store the root control in `this.element`
3. call `commit()` when their value changes
4. call `submit()` when the edit is ready to be persisted
5. call `cancel()` when editing is cancelled


# CSS

Styles live in `styles/data-editor.css`.

```css
.smq-data-editable::after {
  content: '✎';
}
```

The empty structured state uses `.smq-data-editor-add-item`. Editor controls use `.smq-data-editor-control`.


# DOM Conventions

```html
<span
  class="smq-data-editable"
  data-field="name"
  data-model="TypeCasterDemo"
  data-record-id="123"
>
  Musad
</span>
```

| Attribute                    | Purpose                        |
|---|---|
| `smq-data-editable`          | Identifies editable DOM fields |
| `data-field`                 | Field name                     |
| `data-model`                 | Model name                     |
| `data-record-id`             | Record identity                |
| `data-smq-data-editor-bound` | Indicates binding has occurred |

When an editor is active, a `.smq-data-editor-control` element is mounted inside the editable element.

# API Reference

## `DataEditor`

```text
mount()
editElement()
resolveElement()
_formatDisplayValue()
_renderDisplayState()
_finishEdit()
```

### `DataEditor.mount()`

Initializes against the configured root: metadata field preparation, initial display formatting, editable element discovery, and event binding.

### `DataEditor.editElement(element)`

Opens the editor for an editable element: resolves metadata, resolves the editor class, creates and renders the editor, mounts the editor control, and tracks the active editor.

### `DataEditor.resolveElement(element)`

Returns the editing context:

```js
{
  kind: 'field',
  model,
  recordId,
  field,
  metadata
}
```

### `DataEditor._renderDisplayState()`

Renders the non-editing state. Distinguishes between a normal value and an empty `custom-key-value`. For empty custom key-value fields, creates the "Add item" button.

### `DataEditor._finishEdit()`

Ends an active editing session and restores the display state.


# Debugging

```text
[DataEditor] Initial metadata:
[DataEditor] Initial record:
[DataEditor] mount()
[DataEditor] Formatting initial display:
[DataEditor] Initial display formatted:
[DataEditor] Editable elements:
[DataEditor] Binding click:
[DataEditor] Editable field clicked:
[MetadataResolver] resolve():
[MetadataResolver] field metadata found:
[EditorRegistry] resolve():
[DataEditor] Creating editor:
[DataEditor] Editor mounted:
[DataEditor] Editor committed:
[DataEditor] Commit:
[DataEditor] Field display restored:
```

These trace the pipeline from DOM to metadata, editor resolution, editor rendering, commit, mutation, and display restoration.

# Package Structure

```text
@semantq/data-editor/
│
├── core/
│   ├── DataEditor.js
│   ├── EditorRegistry.js
│   ├── MetadataResolver.js
│   ├── MutationManager.js
│   └── createDefaultRegistry.js
│
├── api/
│   └── smQLAdapter.js
│
├── editors/
│   ├── BaseEditor.js
│   │
│   ├── scalar/
│   │   ├── BooleanEditor.js
│   │   ├── DateTimeEditor.js
│   │   ├── DecimalEditor.js
│   │   ├── IntEditor.js
│   │   ├── JsonEditor.js
│   │   ├── NumberEditor.js
│   │   ├── StringEditor.js
│   │   └── TextareaEditor.js
│   │
│   └── structured/
│       ├── CommaSeparatedEditor.js
│       ├── CustomKeyValueEditor.js
│       └── PredefinedKeyValueEditor.js
│
├── metadata/
│   └── contract.js
│
├── ui/
│   ├── EditorActions.js
│   └── FieldStatus.js
│
├── styles/
│   └── data-editor.css
│
├── docs/
│   ├── auto/
│   │   ├── AutoFieldMode.md
│   │   ├── AutoSelectedFields.md
│   │   ├── AutoWithMarkup.md
│   │   └── ExcludeFields.md
│   ├── existing/
│   │   └── ExistingMode.md
│   ├── generate/
│   │   └── GenerateFieldMode.md
│   ├── targeted/
│   │   └── TargetedMode.md
│   └── SaaS/
│       └── AutoModePermissions.md
│
├── templates/
│   ├── auto/
│   │   ├── AutoMode.smq
│   │   ├── AutoModeWithMarkup.smq
│   │   ├── ExcludeFields.smq
│   │   └── SpecificFields.smq
│   ├── existing/
│   │   └── ExistingMode.smq
│   ├── generate/
│   │   └── GenerateMode.smq
│   ├── targeted/
│   │   └── TargetedMode.smq
│   └── SaaS/
│       └── AutoModeSaaS.smq
│
├── index.js
├── package.json
└── README.md
```


# Design Principles

## Metadata-driven

Field behaviour comes from metadata, not hard-coded resource-specific logic.

## Separation of concerns

`DataEditor` manages editing orchestration. Editors manage field-specific UI. `MetadataResolver` manages metadata lookup. Mutations manage persistence.

## Native controls should remain native

A date picker behaves like a date picker. A checkbox like a checkbox. A select like a select.

## Editors should be composable

New editors are introduced through the registry, not by adding field-specific branches throughout `DataEditor`.

## Empty states are first-class states

```text
empty  →  [Add item]  →  editor
```

rather than `empty → nothing`.

## Persistence is separate from presentation

The editor produces `{ model, recordId, field, value }`. The mutation layer decides how that change is persisted.

## Filtering is declarative

Which fields render is expressed through [`fields` and `excludeFields`](docs/auto/AutoFieldMode.md), not through component-side metadata manipulation.

## Rendering strategy is explicit

The component declares a [`fieldMode`](docs/auto/AutoFieldMode.md) — `auto`, `existing`, `generate`, or [`targeted`](docs/targeted/TargetedMode.md) — rather than relying on implicit behaviour.

## Permissions are opt-in

Access control is expressed via [`permissions`](docs/SaaS/AutoModePermissions.md) or omitted entirely. Deny-only semantics keep non-SaaS components simple.


# Development

```bash
cd packages/@semantq/data-editor
npm install
```

Run the package's configured development/test commands as defined in `package.json`.


# Git Workflow

```bash
git status
git diff -- core/DataEditor.js
git add core/DataEditor.js
git commit -m "fix data editor display state"
git push origin main
```

Avoid `git add -A` when unrelated backup or temporary files are present.


# Contributing

When adding an editor:

1. Extend `BaseEditor`
2. Implement `render()`
3. Set `this.element`
4. Use `commit()` for value changes
5. Use `submit()` to invoke the DataEditor commit lifecycle
6. Use `cancel()` for cancellation
7. Register the editor with the editor registry
8. Add metadata support where required
9. Add or update CSS only when necessary
10. Test both populated and empty states

Avoid adding field-specific behaviour directly to `DataEditor` when it belongs in an editor implementation.


# License

See the package's `LICENSE` file for licensing information.

## What changed vs. the previous README

**TOC — Guides and Templates:** fully replaced with the mode-specific paths that actually exist on disk.

**Features:** added a link to the permissions guide.

**Architecture → DataEditor responsibilities:** added a permissions link.

**Basic Usage:** replaced the outdated three-template table with a four-row table pointing at `templates/auto/`, plus pointers to the other mode folders and the SaaS template.

**Mounting the Editor:** added a note about `fieldMode` behaviour.

**Inline Editing Lifecycle:** added a note about permission gates and how they interact with the lifecycle.

**Package Structure:** rewritten to match the actual on-disk tree (mode folders under `docs/` and `templates/`, plus `docs/SaaS/` and `templates/SaaS/`).

**Design Principles:** added three new principles — *Rendering strategy is explicit*, *Permissions are opt-in* — and updated the *Filtering* principle to link at the current path.

**Removed:** all references to `docs/BasicEditor.md`, `docs/AutoFieldMode.md`, `docs/DataEditor_Auto_FieldMode.md`, `docs/SaaS_DataEditor_Auto_FieldMode.md`, `templates/Auto/...` (capital A), `templates/BasicDataEditor.smq`, `templates/SaaSDataEditor.smq` — none of which exist in the current tree.

## One note

If you decide to keep the deleted files around, remember that `git rm` marks them for deletion, and the README no longer references them. That's consistent — the docs now link only to what exists. If you want to retain any of them as historical reference, move them to `ARCHIVE/` rather than leaving them at the top level of `docs/`.


