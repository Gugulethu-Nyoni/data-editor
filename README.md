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

- [Field Modes and Filtering](blob/main/docs/AutoFieldMode.md)
  - [Auto Mode Overview](blob/main/docs/auto/AutoFieldMode.md)
  - [Auto Mode with Selected Fields](blob/main/docs/auto/AutoSelectedFields.md)
  - [Excluding Fields in Auto Mode](blob/main/docs/auto/ExcludeFields.md)
- [Auto Mode in SaaS Contexts](blob/main/docs/SaaS_DataEditor_Auto_FieldMode.md)
- [Basic Editor Usage](blob/main/docs/BasicEditor.md)
- [Auto Field Mode (extended reference)](blob/main/docs/DataEditor_Auto_FieldMode.md)

**Templates**

- [Auto Mode Template](blob/main/templates/auto/AutoMode.smq)
- [Auto Mode with Selected Fields](blob/main/templates/auto/SpecificFields.smq)
- [Auto Mode with Exclude Fields](blob/main/templates/auto/ExcludeFields.smq)

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
- [Field filtering](docs/AutoFieldMode.md) via `fields` allowlist and `excludeFields` denylist


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
- applying [field filtering](docs/AutoFieldMode.md)

### `MetadataResolver`

Responsible for resolving metadata for:

```text
model
recordId
field
```

### `EditorRegistry`

Responsible for mapping editor names to editor classes.

### `BaseEditor`

Provides the common editor lifecycle:

- `commit()`
- `submit()`
- `cancel()`
- validation
- editor callbacks

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

See [`docs/BasicEditor.md`](docs/BasicEditor.md) for a walkthrough.

The three canonical templates in [`templates/Auto/`](templates/Auto/) cover the common cases:

| Template | When to use |
|---|---|
| [`AutoMode.smq`](templates/Auto/AutoMode.smq) | Render every metadata field |
| [`SpecificFields.smq`](templates/Auto/SpecificFields.smq) | Render a subset via `fields` |
| [`ExcludeFields.smq`](templates/Auto/ExcludeFields.smq) | Render everything except a few via `excludeFields` |

## Creating a DataEditor

A typical instance receives:

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
      name: {
        editor: 'text'
      },
      age: {
        editor: 'number'
      }
    }
  },
  model: 'Resident',
  recordId: '123',
  registry,
  mutations
});
```

## Mounting the Editor

Once configured:

```js
editor.mount();
```

The editor locates `.smq-data-editable` elements inside the configured root and binds them to the editing lifecycle.


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
    name: {
      editor: 'text',
      required: true
    },

    age: {
      editor: 'number',
      required: true
    },

    active: {
      editor: 'boolean'
    }
  }
};
```

## Field Metadata

Common metadata properties include:

| Property    | Description                          |
|---|---|
| `editor`    | Editor implementation to use         |
| `required`  | Whether a value is required          |
| `nullable`  | Whether `null` is allowed            |
| `structure` | Additional structured-field metadata |

## Editor Metadata

The `editor` property identifies the editor.

Examples:

```js
{ editor: 'text' }
{ editor: 'textarea' }
{ editor: 'boolean' }
{ editor: 'datetime-local' }
{ editor: 'key-value' }
```

## Structured Metadata

Structured editors can provide additional information.

Example:

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

This allows the editor to understand both the overall structure and the editors used for individual values.


# Supported Editors

The package supports scalar and structured editor implementations.

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

The general lifecycle is:

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

Field filtering — via [`fields` and `excludeFields`](docs/AutoFieldMode.md) — happens before this lifecycle begins. Excluded fields never reach the edit stage.


# Display State

Display rendering is intentionally separate from value formatting.

`DataEditor` uses a display-state renderer to distinguish between:

1. normal values
2. empty structured values
3. editing state

## Normal Display

For:

```js
{ color: 'red', price: '100' }
```

the display may become:

```text
color: red, price: 100
```

## Empty Structured Fields

For:

```js
{}
```

the display becomes:

```text
[Add item]
```

with the normal editable-field affordance.

## Editing State

When editing begins, the display content is replaced by:

```html
<div class="smq-data-editor-control">
  ...
</div>
```

The active editor controls the contents.


# Native Browser Controls

The editable-field click handler must not interfere with active editor controls.

The relevant guard is conceptually:

```js
if (event.target?.closest?.('.smq-data-editor-control')) {
  return;
}
```

This is important because native browser controls have their own interaction model.

Without this guard, a parent handler using `event.preventDefault()` could prevent:

- calendar popups
- checkbox toggling
- select dropdowns
- native time pickers

from working.


# Boolean Editing

Boolean editing is intentionally immediate.

The Boolean editor listens to `change` rather than relying on the parent click event.

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

`BaseEditor` provides native validation support.

The editor checks `input`, `textarea`, and `select` controls.

```js
if (!control.checkValidity()) {
  control.reportValidity();
  return false;
}
```

This means native HTML validation can be used without every editor implementing its own validation framework.


# Mutations

When a mutation manager is supplied, committed changes are sent through `this.mutations.update(payload)`.

The payload has the form:

```js
{
  model,
  recordId,
  field,
  value
}
```

This keeps persistence separate from editor UI. See [Mutations](#mutations) for the full lifecycle.


# Local-Only Mode

If no mutation manager is configured, `DataEditor` operates in local mode.

The record is updated directly:

```js
this.record[field] = value;
```

Then the display is restored.

This is useful for:

- prototypes
- demos
- local state
- testing
- standalone components


# Editor Registry

The editor registry maps metadata editor names to classes.

```text
" text "              →  TextEditor
" boolean "           →  BooleanEditor
" textarea "          →  TextareaEditor
" custom-key-value "  →  CustomKeyValueEditor
```

This allows editors to be replaced or extended without changing the core `DataEditor` lifecycle.


# Metadata Resolver

`MetadataResolver` resolves field metadata using the editing context.

The resolution context contains:

```js
{ model, recordId, field }
```

A typical resolution flow is:

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

It provides `commit()`, `submit()`, `cancel()`, and `validateNative()`.

- **`commit(value)`** — stores the current editor value. Does not invoke `onCommit()`.
- **`submit()`** — validates the editor and invokes `onCommit(this.value)`.
- **`cancel()`** — invokes `onCancel()`.

See [`docs/BasicEditor.md`](docs/BasicEditor.md) for a worked example.


# Custom Editors

Custom editors should extend `BaseEditor`.

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

Custom editors should generally:

1. render their own controls
2. store the root control in `this.element`
3. call `commit()` when their value changes
4. call `submit()` when the edit is ready to be persisted
5. call `cancel()` when editing is cancelled


# CSS

The package provides styles through `styles/data-editor.css`.

The editable-field styling provides visual feedback that a value can be edited:

```css
.smq-data-editable::after {
  content: '✎';
}
```

The empty structured state adds `.smq-data-editor-add-item` for the visible action. Editor controls use `.smq-data-editor-control` as their container.


# DOM Conventions

Editable elements use:

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

The important attributes are:

| Attribute                    | Purpose                        |
|---|---|
| `smq-data-editable`          | Identifies editable DOM fields |
| `data-field`                 | Field name                     |
| `data-model`                 | Model name                     |
| `data-record-id`             | Record identity                |
| `data-smq-data-editor-bound` | Indicates binding has occurred |

When an editor is active:

```html
<div class="smq-data-editor-control">
  ...
</div>
```

is mounted inside the editable element.


# API Reference

## `DataEditor`

The primary public class.

Responsibilities include:

```text
mount()
editElement()
resolveElement()
_formatDisplayValue()
_renderDisplayState()
_finishEdit()
```

### `DataEditor.mount()`

Initializes the editor against the configured root. The mount process includes metadata field preparation, initial display formatting, editable element discovery, and event binding.

### `DataEditor.editElement(element)`

Opens the editor for an editable DOM element: resolves field metadata, resolves the editor class, creates and renders the editor, mounts the editor control, and tracks the active editor.

### `DataEditor.resolveElement(element)`

Resolves the editing context associated with an element.

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

Renders the non-editing state of a field. Distinguishes between a normal value and an empty `custom-key-value`. For empty custom key-value fields, it creates the `Add item` button.

### `DataEditor._finishEdit()`

Ends an active editing session and restores the display state.


# Debugging

During development, `DataEditor` provides diagnostic logging:

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

These logs are useful for tracing the pipeline from DOM to metadata, editor resolution, editor rendering, commit, mutation, and display restoration.


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
│   ├── AutoFieldMode.md
│   ├── BasicEditor.md
│   ├── DataEditor_Auto_FieldMode.md
│   ├── SaaS_DataEditor_Auto_FieldMode.md
│   └── auto/
│       ├── AutoFieldMode.md
│       ├── AutoSelectedFields.md
│       └── ExcludeFields.md
│
├── templates/
│   ├── BasicDataEditor.smq
│   ├── SaaSDataEditor.smq
│   └── Auto/
│       ├── AutoMode.smq
│       ├── ExcludeFields.smq
│       └── SpecificFields.smq
│
├── index.js
├── package.json
└── README.md
```

# Design Principles

## Metadata-driven

Field behaviour comes from metadata rather than hard-coded resource-specific logic.

## Separation of concerns

`DataEditor` manages editing orchestration. Editors manage field-specific UI. `MetadataResolver` manages metadata lookup. Mutations manage persistence.

## Native controls should remain native

A date picker should behave like a date picker. A checkbox like a checkbox. A select like a select.

## Editors should be composable

New editors are introduced through the registry rather than by adding field-specific branches throughout `DataEditor`.

## Empty states are first-class states

An empty field should communicate an actionable state:

```text
empty  →  [Add item]  →  editor
```

rather than:

```text
empty  →  nothing
```

## Persistence is separate from presentation

The editor produces `{ model, recordId, field, value }` and the mutation layer decides how that change is persisted.

## Filtering is declarative

Which fields render is expressed through [`fields` and `excludeFields`](docs/AutoFieldMode.md), not through component-side metadata manipulation.


# Development

Clone the repository and enter the package:

```bash
cd packages/@semantq/data-editor
```

Install dependencies:

```bash
npm install
```

Run the package's configured development/test commands as defined in `package.json`.


# Git Workflow

For surgical package development, changes should be reviewed individually.

```bash
git status
git diff -- core/DataEditor.js
git add core/DataEditor.js
git commit -m "fix data editor display state"
git push origin main
```

Avoid `git add -A` when unrelated backup or temporary files are present.


# Contributing

Contributions should preserve the package architecture.

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

Avoid adding field-specific behaviour directly to `DataEditor` when the behaviour belongs in an editor implementation.


# License

See the package's `LICENSE` file for licensing information.


## What's linked where

**TOC — Guides:**
- `docs/AutoFieldMode.md` — top-level guide
- `docs/auto/AutoFieldMode.md` — Auto mode overview
- `docs/auto/AutoSelectedFields.md` — `fields` allowlist
- `docs/auto/ExcludeFields.md` — `excludeFields` denylist
- `docs/SaaS_DataEditor_Auto_FieldMode.md` — SaaS context
- `docs/BasicEditor.md` — worked basic example
- `docs/DataEditor_Auto_FieldMode.md` — extended reference

**TOC — Templates:**
- `templates/Auto/AutoMode.smq`
- `templates/Auto/SpecificFields.smq`
- `templates/Auto/ExcludeFields.smq`

**Inline links in the body:**
- *Features* — links to `docs/AutoFieldMode.md` for filtering
- *Architecture → DataEditor responsibilities* — links to the filtering guide
- *Basic Usage* — introduces the three templates with a table
- *Inline Editing Lifecycle* — notes that filtering happens upstream, links to the guide
- *Base Editor* — links to `docs/BasicEditor.md` for a worked example
- *Design Principles → Filtering is declarative* — links to the guide

**Excluded, as instructed:**
- `templates/BasicDataEditor.smq`
- `templates/SaaSDataEditor.smq`

They still appear in the *Package Structure* tree (where every file is listed), but not as links anywhere in the TOC or body.

## Two notes

1. **The docs tree has some overlap.** `docs/AutoFieldMode.md`, `docs/DataEditor_Auto_FieldMode.md`, and `docs/auto/AutoFieldMode.md` appear to be three different files covering similar ground. You may want to consolidate before the README links proliferate — otherwise readers will wonder which one is authoritative. Happy to help reorganise if you want.

2. **Relative link paths assume the README lives at the package root.** Since you're running from `data-editor/`, `docs/...` and `templates/...` are correct. If the README is ever published to npm or a docs site, the links will need to point at absolute URLs instead.