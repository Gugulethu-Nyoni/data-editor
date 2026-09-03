# @semantq/data-editor

A metadata-driven, inline data editor for Semantq applications.

`@semantq/data-editor` turns rendered data into editable fields using field metadata and a registry of editor components. It provides a consistent editing lifecycle for scalar values, structured values, native browser controls, validation, mutation, and display restoration.

The package is designed around a simple principle:

> **The data and metadata determine how a field is displayed and edited.**

Instead of writing field-specific edit logic for every resource, applications provide the record, metadata, and mutation mechanism. `DataEditor` resolves the appropriate editor automatically.



## Table of Contents

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
  - [Text](#text)
  - [Textarea](#textarea)
  - [Boolean](#boolean)
  - [Date and DateTime](#date-and-datetime)
  - [Structured Editors](#structured-editors)
  - [Custom Key-Value](#custom-key-value)
- [Inline Editing Lifecycle](#inline-editing-lifecycle)
- [Display State](#display-state)
  - [Normal Display](#normal-display)
  - [Empty Structured Fields](#empty-structured-fields)
  - [Editing State](#editing-state)
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
  - [`DataEditor`](#dataeditor)
  - [`BaseEditor`](#baseeditor)
  - [`MetadataResolver`](#metadataresolver)
- [Debugging](#debugging)
- [Package Structure](#package-structure)
- [Design Principles](#design-principles)
- [Development](#development)
- [Git Workflow](#git-workflow)
- [Contributing](#contributing)
- [License](#license)



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
````

`DataEditor` enhances the element and associates it with:

* a model
* a record ID
* a field
* field metadata
* an editor implementation
* an optional mutation mechanism

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

* Metadata-driven inline editing
* Editor registry architecture
* Scalar field editors
* Native browser input support
* Boolean checkbox editing
* Date and datetime editing
* Textarea editing
* Structured data editing
* Custom key-value editing
* Empty-state handling
* Built-in native validation
* Mutation integration
* Local-only editing mode
* Commit/cancel lifecycle
* Display restoration after editing
* Field-level success/error notifications
* Custom editor extensibility
* Model and record identity preserved through editing
* CSS-based editable-field affordances



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

* locating editable fields
* attaching field identity
* resolving metadata
* resolving editors
* mounting editors
* handling commits
* handling mutations
* restoring display state
* handling empty display states

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

* `commit()`
* `submit()`
* `cancel()`
* validation
* editor callbacks

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

The editor locates:

```html
.smq-data-editable
```

elements inside the configured root and binds them to the editing lifecycle.



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
| -- |  |
| `editor`    | Editor implementation to use         |
| `required`  | Whether a value is required          |
| `nullable`  | Whether `null` is allowed            |
| `structure` | Additional structured-field metadata |



## Editor Metadata

The `editor` property identifies the editor.

Examples:

```js
{
  editor: 'text'
}
```

```js
{
  editor: 'textarea'
}
```

```js
{
  editor: 'boolean'
}
```

```js
{
  editor: 'datetime-local'
}
```

```js
{
  editor: 'key-value'
}
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
    key: {
      editor: 'text'
    },
    value: {
      editor: 'text'
    }
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


# Text

Text fields use a standard text input.

Example metadata:

```js
{
  editor: 'text'
}
```

The value is edited using a native:

```html
<input type="text">
```



# Textarea

Long-form text uses `TextareaEditor`.

Example:

```js
{
  editor: 'textarea'
}
```

The editor uses:

```html
<textarea></textarea>
```

Textarea editing supports the common editor lifecycle and native validation.



# Boolean

Boolean values use a native checkbox.

Example:

```js
{
  editor: 'boolean'
}
```

The checkbox is initialized from the current value:

```js
input.checked = Boolean(this.value);
```

Boolean changes are committed immediately.

```js
input.addEventListener('change', () => {
  this.commit(input.checked);
  this.submit();
});
```

Therefore:

```text
unchecked → checked
```

commits:

```js
true
```

and:

```text
checked → unchecked
```

commits:

```js
false
```

This is intentional because checkbox interaction represents a complete value change.



# Date and DateTime

Native browser date controls can be used for date/time fields.

Examples:

```html
<input type="date">
```

and:

```html
<input type="datetime-local">
```

The package deliberately allows native controls to receive their own browser events.

For example, clicking the native calendar button must not be intercepted by the parent editable-field handler.

The editable-field click handler therefore ignores events originating inside:

```css
.smq-data-editor-control
```

This allows native controls such as:

* date
* datetime-local
* time
* select
* checkbox
* file

to operate normally.



# Structured Editors

Structured values require editors capable of representing more than one primitive value.

Examples include:

```text
key-value objects
nested structures
custom structured fields
```

Structured editors are resolved through the same editor registry architecture.



# Custom Key-Value

`CustomKeyValueEditor` provides an editor for object-like key-value data.

Example value:

```js
{
  color: 'red',
  price: '100'
}
```

The editor displays:

```text
Key        Value       Remove
color      red         Remove
price      100         Remove

[Add item]
```

Each row contains:

* key input
* value input
* remove button

The editor also provides:

```text
Add item
```

for dynamically adding rows.



# Empty Structured Fields

An important part of the display lifecycle is the empty state.

For a custom key-value field with no data:

```js
{}
```

the display state becomes:

```html
<span class="smq-data-editable">
  <button
    class="smq-data-editor-add-item"
    type="button"
  >
    Add item
  </button>
</span>
```

This prevents an empty field from appearing as if it were non-editable.

The user sees:

```text
[Add item] ✎
```

instead of:

```text
✎
```



## One-Click Empty-State Editing

When the user clicks:

```text
[Add item]
```

the editor opens directly with an empty key-value row.

The user does **not** need to click another "Add item" button.

Conceptually:

```text
Display
[Add item]
    │
    ▼
Editor
┌───────────────────────────┐
│ Key     Value     Remove  │
│ [___]   [___]     Remove  │
│                           │
│ [Add item]                │
└───────────────────────────┘
```

The first row is automatically created when the structured value is empty.



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



# Display State

Display rendering is intentionally separate from value formatting.

`DataEditor` uses a display-state renderer to distinguish between:

1. normal values
2. empty structured values
3. editing state



## Normal Display

For:

```js
{
  color: 'red',
  price: '100'
}
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
if (
  event.target?.closest?.(
    '.smq-data-editor-control'
  )
) {
  return;
}
```

This is important because native browser controls have their own interaction model.

Without this guard, a parent handler using:

```js
event.preventDefault();
```

could prevent:

* calendar popups
* checkbox toggling
* select dropdowns
* native time pickers

from working.



# Boolean Editing

Boolean editing is intentionally immediate.

The Boolean editor listens to:

```js
change
```

rather than relying on the parent click event.

The flow is:

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

Unchecking follows the same path with:

```js
false
```

This ensures that both transitions are persisted.



# Validation

`BaseEditor` provides native validation support.

The editor checks:

```js
input
textarea
select
```

controls.

Conceptually:

```js
if (!control.checkValidity()) {
  control.reportValidity();
  return false;
}
```

This means native HTML validation can be used without every editor implementing its own validation framework.



# Mutations

When a mutation manager is supplied, committed changes are sent through:

```js
this.mutations.update(payload)
```

The payload has the form:

```js
{
  model,
  recordId,
  field,
  value
}
```

Example:

```js
{
  model: 'TypeCasterDemo',
  recordId: 'cmt9w8c2000004t1ri8p7v94u',
  field: 'attributes',
  value: {
    color: 'red',
    price: '100'
  }
}
```

This keeps persistence separate from editor UI.



# Local-Only Mode

If no mutation manager is configured, `DataEditor` operates in local mode.

The record is updated directly:

```js
this.record[field] = value;
```

Then the display is restored.

This is useful for:

* prototypes
* demos
* local state
* testing
* standalone components



# Editor Registry

The editor registry maps metadata editor names to classes.

Conceptually:

```text
" text "
   ↓
TextEditor

" boolean "
   ↓
BooleanEditor

" textarea "
   ↓
TextareaEditor

" custom-key-value "
   ↓
CustomKeyValueEditor
```

This allows editors to be replaced or extended without changing the core `DataEditor` lifecycle.



# Metadata Resolver

`MetadataResolver` resolves field metadata using the editing context.

The resolution context contains:

```js
{
  model,
  recordId,
  field
}
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

This separates metadata lookup from editor selection.



# Base Editor

`BaseEditor` is the common superclass for editor implementations.

It provides:

```text
commit()
submit()
cancel()
validateNative()
```

### `commit()`

Stores the current editor value:

```js
this.value = value;
```

It does not itself invoke `onCommit()`.

### `submit()`

Validates the editor and invokes:

```js
this.onCommit(this.value);
```

### `cancel()`

Invokes:

```js
this.onCancel();
```

This distinction is important for editor implementations.

For example, a Boolean editor that needs immediate persistence should call:

```js
this.commit(input.checked);
this.submit();
```



# Custom Editors

Custom editors should extend `BaseEditor`.

Example:

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

The package provides styles through:

```text
styles/data-editor.css
```

The editable-field styling provides visual feedback that a value can be edited.

For example, an editable element may display a pencil affordance:

```css
.smq-data-editable::after {
  content: '✎';
}
```

The empty structured state adds:

```css
.smq-data-editor-add-item
```

for the visible action.

Editor controls use:

```css
.smq-data-editor-control
```

as their container.



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
| - |  |
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



## `DataEditor.mount()`

Initializes the editor against the configured root.

The mount process includes:

1. metadata field preparation
2. initial display formatting
3. editable element discovery
4. event binding



## `DataEditor.editElement(element)`

Opens the editor for an editable DOM element.

It:

1. resolves field metadata
2. resolves the editor class
3. creates the editor
4. renders the editor
5. mounts the editor control
6. tracks the active editor



## `DataEditor.resolveElement(element)`

Resolves the editing context associated with an element.

The resulting context includes information such as:

```js
{
  kind: 'field',
  model,
  recordId,
  field,
  metadata
}
```



## `DataEditor._renderDisplayState()`

Renders the non-editing state of a field.

It distinguishes between:

```text
normal value
empty custom-key-value
```

For empty custom key-value fields, it creates the:

```text
Add item
```

button.



## `DataEditor._finishEdit()`

Ends an active editing session and restores the display state.

The method:

* removes the active editor
* removes the active CSS state
* renders the resulting value
* restores the editable display



# Debugging

During development, `DataEditor` provides diagnostic logging.

Examples include:

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

These logs are useful for tracing:

```text
DOM
 ↓
metadata
 ↓
editor resolution
 ↓
editor rendering
 ↓
commit
 ↓
mutation
 ↓
display restoration
```



# Package Structure

The package follows a layered structure similar to:

```text
@semantq/data-editor/
│
├── core/
│   ├── DataEditor.js
│   └── MetadataResolver.js
│
├── editors/
│   ├── BaseEditor.js
│   │
│   ├── scalar/
│   │   ├── BooleanEditor.js
│   │   ├── TextEditor.js
│   │   └── TextareaEditor.js
│   │
│   └── structured/
│       └── CustomKeyValueEditor.js
│
├── styles/
│   └── data-editor.css
│
├── package.json
└── README.md
```

The exact file set may evolve as additional editor types are introduced.



# Design Principles

## Metadata-driven

Field behaviour comes from metadata rather than hard-coded resource-specific logic.



## Separation of concerns

`DataEditor` manages editing orchestration.

Editors manage field-specific UI.

`MetadataResolver` manages metadata lookup.

Mutations manage persistence.



## Native controls should remain native

The package should not interfere with browser-native controls unnecessarily.

A date picker should behave like a date picker.

A checkbox should behave like a checkbox.

A select should behave like a select.



## Editors should be composable

New editors should be introduced through the registry rather than by adding field-specific branches throughout `DataEditor`.



## Empty states are first-class states

An empty field should communicate an actionable state.

For structured data:

```text
empty
 ↓
[Add item]
 ↓
editor
```

rather than:

```text
empty
 ↓
nothing
```



## Persistence is separate from presentation

The editor does not need to know how the record is stored.

It produces:

```js
{
  model,
  recordId,
  field,
  value
}
```

and the mutation layer decides how that change is persisted.



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

Check the working tree:

```bash
git status
```

Inspect a specific file:

```bash
git diff -- core/DataEditor.js
```

Stage only the intended file:

```bash
git add core/DataEditor.js
```

Commit:

```bash
git commit -m "fix data editor display state"
```

Push:

```bash
git push origin main
```

Avoid:

```bash
git add -A
```

when unrelated backup or temporary files are present.



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


This README positions `@semantq/data-editor` as a **metadata-driven editing framework component**, rather than merely documenting the current files. It also documents the important architectural decisions we just established around **native controls, Boolean immediate commits, empty structured states, and the editor lifecycle**.
