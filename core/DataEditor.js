import MetadataResolver from './MetadataResolver.js';
import MutationManager from './MutationManager.js';
import createDefaultRegistry from './createDefaultRegistry.js';
import { Notification } from '@semantq/ql';
import { showFieldStatus } from '../ui/FieldStatus.js';

export default class DataEditor {
  constructor({
    root = document,
    metadata = {},
    api = null,
    registry = null,
    themeColor = null,
    editable = true,
    deletable = false,
    model = null,
    recordId = null,
    record = null,
    permissions = null,
    fieldMode = 'auto',
    layout = 'stacked',
    fields = null,
    onUpdated = () => {},
    onDeleted = () => {},
    onError = () => {}
  } = {}) {
    this.root = root;
    this.metadata = metadata || {};

    console.log('[DataEditor] Initial metadata:', this.metadata);

    this.api = api;
    this.registry = registry || createDefaultRegistry();
    this.themeColor = themeColor;
    this.editable = editable;
    this.deletable = deletable;
    this.model = model;
    this.recordId = recordId;
    this.record = record || {};
    this.permissions = permissions;
    this.fieldMode = fieldMode;
    this.layout = layout;
    this.fields = fields;

    // Normalize fieldMode — add 'targeted' to valid modes
    const validFieldModes = ['existing', 'generate', 'auto', 'targeted'];
    if (!validFieldModes.includes(this.fieldMode)) {
      console.warn(
        `[DataEditor] Invalid fieldMode "${this.fieldMode}", falling back to "auto".`
      );
      this.fieldMode = 'auto';
    }

    // Normalize layout
    const validLayouts = ['stacked', 'inline'];
    if (!validLayouts.includes(this.layout)) {
      console.warn(
        `[DataEditor] Invalid layout "${this.layout}", falling back to "stacked".`
      );
      this.layout = 'stacked';
    }

    console.log('[DataEditor] Initial record:', this.record);

    this.onUpdated = onUpdated;
    this.onDeleted = onDeleted;
    this.onError = onError;

    this.metadataResolver = new MetadataResolver({
      metadata: this.metadata,
      registry: this.registry
    });

    this.mutations = api
      ? new MutationManager({
          api,
          onUpdated: (event) => {
            this._handleUpdateSuccess(event);
          },
          onDeleted: (event) => {
            this._handleDeleteSuccess(event);
          },
          onError: (error, payload) => {
            this._handleMutationError(error, payload);
          }
        })
      : null;

    this.boundElements = new Set();
    this.activeEditors = new Map();
  }

 mount() {
  console.log('[DataEditor] mount()');

  if (!this._canRead()) {
    console.log('[DataEditor] canRead: false — not rendering data.');
    return this;
  }

  this._applyTheme();
  this._renderFields();

  // Apply layout to ALL containers (auto/generate and targeted modes)
  const containers = this.root.querySelectorAll(
    '.smq-data-editor-fields, [data-editor-container]'
  );
  for (const container of containers) {
    this._applyLayout(container);
  }

  this._renderEditIndicators();
  this._renderMetadataFields();
  this._formatInitialDisplay();
  this._bindEditableElements();

  if (this._canDelete()) {
    this._renderDeleteControl();
  }

  return this;
}



  _canRead() {
    if (this.permissions?.canRead === false) return false;
    return true;
  }

  _canUpdate() {
    if (!this._canRead()) return false;
    if (this.editable === false) return false;
    if (this.permissions?.canUpdate === false) return false;
    return true;
  }

  _canDelete() {
    if (!this._canRead()) return false;
    if (this.deletable === false) return false;
    if (this.permissions?.canDelete === false) return false;
    return true;
  }

  _canEditField(field, fieldMetadata) {
    if (!this._canUpdate()) return false;
    if (fieldMetadata?.editable === false) return false;
    if (fieldMetadata?.permissions?.canUpdate === false) return false;
    return true;
  }

  /*
   * ---------------------------------------------------------
   * Field Discovery
   * ---------------------------------------------------------
   */

  _findFieldElement(field) {
    if (!field) return null;
    return this.root.querySelector(`#${CSS.escape(field)}`);
  }

  _discoverFields() {
    return Object.keys(this.metadata.fields || {});
  }

  /*
   * ---------------------------------------------------------
   * Targeted Mode: Discovery & Resolution
   * ---------------------------------------------------------
   */

  _discoverTargets() {
    const targets = [];
    const elements = this.root.querySelectorAll('[data-editor-field]');

    for (const el of elements) {
      const resolved = this._resolveFieldTarget(el);
      if (resolved) {
        targets.push({
          element: el,
          ...resolved
        });
      }
    }

    return targets;
  }

  _resolveFieldTarget(element) {
  const model =
    element.dataset.editorModel ||
    element.dataset.model;

  const fieldName =
    element.dataset.editorFieldName ||
    element.dataset.field;

  const relation =
    element.dataset.editorRelation;

  const recordId =
    element.dataset.editorRecordId ||
    element.dataset.recordId;

  if (!model || !fieldName) {
    console.warn('[DataEditor] Missing required attributes on field target:', element);
    return null;
  }

  // ─── RELATION FIELD ───────────────────────────────
  if (relation) {
    const relationMeta = this.metadata.relations?.[relation];
    if (relationMeta) {
      const fieldMeta = relationMeta.fields?.[fieldName];
      if (fieldMeta) {
        let value = null;

        if (relationMeta.isList === true) {
          const relationData = Array.isArray(this.record[relation])
            ? this.record[relation]
            : [];
          const item = relationData.find(r => String(r.id) === String(recordId));
          value = item ? item[fieldName] : null;
        } else {
          const relationData = this.record[relation];
          if (
            relationData &&
            typeof relationData === 'object' &&
            !Array.isArray(relationData)
          ) {
            value = relationData[fieldName] ?? null;
          }
        }

        return {
          kind: 'relation',
          model,
          recordId,
          fieldName,
          relation,
          isNew: this._isNewRecord(recordId),
          metadata: fieldMeta,
          value,
          relationMetadata: relationMeta,
          editor: this.metadataResolver.resolveFieldEditor(fieldMeta)
        };
      }
    }
    console.warn(`[DataEditor] Relation "${relation}" or field "${fieldName}" not found.`);
    return null;
  }

  // ─── CORE FIELD ────────────────────────────────────
  const fieldMeta = this.metadata.fields?.[fieldName];
  if (fieldMeta) {
    return {
      kind: 'field',
      model,
      recordId,
      fieldName,
      isNew: this._isNewRecord(recordId),
      metadata: fieldMeta,
      value: this.record[fieldName],
      editor: this.metadataResolver.resolveFieldEditor(fieldMeta)
    };
  }

  console.warn(`[DataEditor] Field "${fieldName}" not found in metadata.`);
  return null;
}

  /*
   * ---------------------------------------------------------
   * Field Enhancement & Generation
   * ---------------------------------------------------------
   */

  _enhanceExistingField(element, field, fieldMetadata) {
    if (!element || !field) return;

    // Preserve developer markup — find or create value target
    let valueTarget = element.querySelector('.smq-data-editor-value-target');
    if (!valueTarget && element.children.length === 0) {
      valueTarget = element;
    }
    if (!valueTarget) {
      valueTarget = document.createElement('span');
      valueTarget.className = 'smq-data-editor-value-target';
      element.appendChild(valueTarget);
    }

    // Set formatted value
    const value = this.record[field];
    valueTarget.textContent = this._formatDisplayValue(value, fieldMetadata);

    // Add DataEditor behavior
    element.classList.add('smq-data-editable');
    element.dataset.field = field;
    element.dataset.model = this.model || '';
    if (this.recordId) {
      element.dataset.recordId = this.recordId;
    } else {
      delete element.dataset.recordId;
    }

    if (this._canEditField(field, fieldMetadata)) {
      element.dataset.editable = 'true';
    }

    return element;
  }

  _createFieldContainer() {
    const container = document.createElement('div');
    container.className = 'smq-data-editor-fields';
    container.dataset.layout = this.layout || 'stacked';
    return container;
  }

  _generateField(field, fieldMetadata) {
    if (!field || !fieldMetadata) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'smq-data-editor-field';
    wrapper.dataset.field = field;

    const label = document.createElement('span');
    label.className = 'smq-data-editor-label';
    label.textContent = field;

    const valueContainer = document.createElement('div');
    valueContainer.className = 'smq-data-editor-value';

    const element = document.createElement('span');
    element.id = field;
    element.classList.add('smq-data-editable');
    element.dataset.field = field;
    element.dataset.model = this.model || '';
    if (this.recordId) {
      element.dataset.recordId = this.recordId;
    } else {
      delete element.dataset.recordId;
    }

    const value = this.record[field];
    element.textContent = this._formatDisplayValue(value, fieldMetadata);

    if (this._canEditField(field, fieldMetadata)) {
      element.dataset.editable = 'true';
    }

    valueContainer.appendChild(element);
    wrapper.appendChild(label);
    wrapper.appendChild(valueContainer);

    return wrapper;
  }

  /*
   * ---------------------------------------------------------
   * Main Field Renderer
   * ---------------------------------------------------------
   */

  _renderFields() {
    // ─── TARGETED MODE ────────────────────────────
    // Component owns DOM. DataEditor only discovers and activates targets.
    if (this.fieldMode === 'targeted') {
      this._renderTargetedFields();
      return;
    }

    // ─── LEGACY MODES ─────────────────────────────
    // auto, generate, existing — unchanged behavior

    const fields = this.metadata.fields || {};

    let fieldEntries;

    if (
      this.fields &&
      Array.isArray(this.fields) &&
      this.fields.length > 0
    ) {
      fieldEntries = this.fields
        .filter(field => fields[field])
        .map(field => [field, fields[field]]);
    } else {
      fieldEntries = Object.entries(fields);
    }

    if (this.fieldMode === 'existing') {
      for (const [field, fieldMetadata] of fieldEntries) {
        const existing = this._findFieldElement(field);
        if (existing) {
          this._enhanceExistingField(existing, field, fieldMetadata);
        } else {
          console.warn(`[DataEditor] Field "${field}" not found (mode: existing).`);
        }
      }
      return;
    }

    // For 'generate' and 'auto' modes, get or create container
    let container = this.root.querySelector('.smq-data-editor-fields');
    let needsContainer = this.fieldMode === 'generate';

    if (this.fieldMode === 'auto') {
      for (const [field] of fieldEntries) {
        if (!this._findFieldElement(field)) {
          needsContainer = true;
          break;
        }
      }
    }

    if (needsContainer && !container) {
      container = this._createFieldContainer();
      this.root.appendChild(container);
    }

    for (const [field, fieldMetadata] of fieldEntries) {
      const existing = this._findFieldElement(field);

      if (this.fieldMode === 'generate') {
        // Idempotent: check if already generated
        const existingGenerated = container?.querySelector(
          `.smq-data-editor-field[data-field="${CSS.escape(field)}"]`
        );
        if (!existingGenerated) {
          const generated = this._generateField(field, fieldMetadata);
          if (generated && container) {
            container.appendChild(generated);
          }
        }
      } else if (this.fieldMode === 'auto') {
        if (existing) {
          this._enhanceExistingField(existing, field, fieldMetadata);
        } else if (container) {
          // Idempotent: check if already generated
          const existingGenerated = container.querySelector(
            `.smq-data-editor-field[data-field="${CSS.escape(field)}"]`
          );
          if (!existingGenerated) {
            const generated = this._generateField(field, fieldMetadata);
            if (generated) {
              container.appendChild(generated);
            }
          }
        }
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * Targeted Mode: Render Fields
   * ---------------------------------------------------------
   */

  _renderTargetedFields() {
    const targets = this._discoverTargets();

    for (const target of targets) {
      const { element, fieldName, metadata, value, kind, model, recordId, isNew } = target;

      // Format and set display value
      const formatted = this._formatDisplayValue(value, metadata);

      if (element.children.length === 0) {
        element.textContent = formatted;
      } else {
        let targetEl = element.querySelector('.smq-data-editor-value-target');
        if (!targetEl) {
          targetEl = document.createElement('span');
          targetEl.className = 'smq-data-editor-value-target';
          element.appendChild(targetEl);
        }
        targetEl.textContent = formatted;
      }

      // Check if editable
      const canEdit = this._canEditField(fieldName, metadata);
      if (canEdit) {
        element.classList.add('smq-data-editable');
        element.dataset.field = fieldName;
        element.dataset.model = model;

        // 🔥 Set record-id with sentinel for new records
        if (isNew) {
          element.dataset.recordId = 'new-record';
          element.dataset.editorRecordId = 'new-record';
        } else if (recordId) {
          element.dataset.recordId = recordId;
          element.dataset.editorRecordId = recordId;
        } else {
          delete element.dataset.recordId;
          delete element.dataset.editorRecordId;
        }

        // Store relation info for commit
        if (kind === 'relation') {
          element.dataset.editorRelation = target.relation;
        }

        // Mark as editable for binding
        element.dataset.editable = 'true';
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * Layout
   * ---------------------------------------------------------
   */

  _applyLayout(container) {
    if (!container) return;

    container.classList.remove(
      'smq-data-editor-layout-stacked',
      'smq-data-editor-layout-inline'
    );

    const layoutClass =
      this.layout === 'inline'
        ? 'smq-data-editor-layout-inline'
        : 'smq-data-editor-layout-stacked';

    container.classList.add(layoutClass);
    container.dataset.layout = this.layout || 'stacked';
  }

  /*
   * ---------------------------------------------------------
   * Edit Indicator (Pencil)
   * ---------------------------------------------------------
   */

  _renderEditIndicators() {
    if (!this._canUpdate()) return;

    let elements;

    // Targeted mode: use discovered targets
    if (this.fieldMode === 'targeted') {
      const targets = this._discoverTargets();
      elements = targets
        .filter(t => t.element.classList.contains('smq-data-editable'))
        .map(t => t.element);
    } else {
      elements = this.root.querySelectorAll?.('.smq-data-editable') || [];
    }

    for (const element of elements) {
      const field = element.dataset.field;
      if (!field) continue;

      const fieldMetadata = this.metadata.fields?.[field] || {};
      if (!this._canEditField(field, fieldMetadata)) continue;

      // Check if indicator already exists
      if (element.parentElement?.querySelector('.smq-data-editor-indicator')) {
        continue;
      }

      const indicator = document.createElement('button');
      indicator.type = 'button';
      indicator.className = 'smq-data-editor-indicator';
      indicator.textContent = '✎';
      indicator.setAttribute('aria-label', `Edit ${field}`);

      // Use the captured element directly
      indicator.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (this._canEditField(field, fieldMetadata)) {
          this.editElement(element);
        }
      });

      const parent = element.parentElement || element;
      parent.appendChild(indicator);
    }
  }

  /*
   * ---------------------------------------------------------
   * Delete Control
   * ---------------------------------------------------------
   */

  _renderDeleteControl() {
    if (!this._canDelete()) return;

    if (this.root.querySelector('.smq-data-editor-delete')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'smq-data-editor-delete';
    button.textContent = 'Delete';

    button.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this record?')) {
        this._handleDelete();
      }
    });

    this.root.appendChild(button);
  }

  _handleDelete() {
    if (!this._canDelete()) return;
    if (!this.mutations) {
      console.warn('[DataEditor] Delete not available (no mutation manager).');
      return;
    }

    this.mutations.delete({
      model: this.model,
      recordId: this.recordId
    });
  }

  /*
   * ---------------------------------------------------------
   * Metadata fields
   * ---------------------------------------------------------
   */

  _renderMetadataFields() {
    const elements =
      this.root.querySelectorAll?.('[data-metadata-field]') || [];

    console.log('[DataEditor] Metadata placeholders:', elements.length);

    elements.forEach((element) => {
      const field = element.dataset.metadataField || element.dataset.field;

      if (!field) {
        return;
      }

      const fieldMetadata = this.metadata.fields?.[field];

      console.log('[DataEditor] Preparing metadata field:', {
        field,
        metadata: fieldMetadata,
        value: this.record[field]
      });

      if (!fieldMetadata) {
        console.warn(`[DataEditor] No metadata found for field "${field}".`);
        return;
      }

      element.classList.add('smq-data-editable');

      element.dataset.model = this.model || fieldMetadata.model || '';
      const recordId = this.recordId || fieldMetadata.recordId;

      if (recordId) {
        element.dataset.recordId = recordId;
      } else {
        delete element.dataset.recordId;
      }
      element.dataset.field = field;

      const value = this.record[field];

      const displayMetadata =
        this.metadata.fields?.[element.dataset.field] || {};

      if (field === 'attributes') {
        console.log('[DataEditor] ATTRIBUTES RENDER TRACE:', {
          element,
          field,
          recordValue: value,
          fieldMetadata,
          displayMetadata,
          formatted: this._formatDisplayValue(value, displayMetadata)
        });
      }

      console.log('[DataEditor] Initial display:', {
        field,
        value,
        displayMetadata,
        formatted: this._formatDisplayValue(value, displayMetadata)
      });

      element.textContent = this._formatDisplayValue(value, displayMetadata);

      console.log('[DataEditor] Metadata field ready:', {
        field,
        model: element.dataset.model,
        recordId: element.dataset.recordId,
        editor: fieldMetadata.editor,
        value
      });
    });
  }

  /*
   * ---------------------------------------------------------
   * Editable fields
   * ---------------------------------------------------------
   */

  _formatInitialDisplay() {
    const elements =
      this.root.querySelectorAll?.('.smq-data-editable') || [];

    console.log('[DataEditor] Formatting initial display:', elements.length);

    elements.forEach((element) => {
      const field = element.dataset.field;

      if (!field) {
        return;
      }

      const metadata = this.metadata.fields?.[field] || {};
      const value = this._getFieldValue(element);

      this._renderDisplayState(element, value, metadata);

      console.log('[DataEditor] Initial display formatted:', {
        field,
        value,
        formatted: element.textContent
      });
    });
  }

  _renderDisplayState(element, value, metadata = {}) {
    element.replaceChildren();

    const isCustomKeyValue =
      metadata.editor === 'custom-key-value' ||
      metadata.structure?.type === 'custom-key-value';

    const isEmpty =
      value == null ||
      (typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0);

    if (isCustomKeyValue && isEmpty) {
      const button = document.createElement('button');

      button.className = 'smq-data-editor-add-item';
      button.type = 'button';
      button.textContent = 'Add item';

      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        this.editElement(element);
      });

      element.appendChild(button);

      return;
    }

    element.textContent = this._formatDisplayValue(value, metadata);
  }

  _bindEditableElements() {
    if (!this.editable) {
      console.log('[DataEditor] Editing disabled.');
      return;
    }

    let elements;

    // Targeted mode: use discovered targets
    if (this.fieldMode === 'targeted') {
      const targets = this._discoverTargets();
      elements = targets
        .filter(t => t.element.classList.contains('smq-data-editable'))
        .map(t => t.element);
    } else {
      elements = this.root.querySelectorAll?.('.smq-data-editable') || [];
    }

    console.log('[DataEditor] Editable elements:', elements.length);

    elements.forEach((element) => {
      if (this.boundElements.has(element)) {
        return;
      }

      this.boundElements.add(element);
      element.dataset.smqDataEditorBound = 'true';

      console.log('[DataEditor] Binding click:', {
        field: element.dataset.field,
        value: element.textContent
      });

      element.addEventListener('click', (event) => {
        // Allow active editor controls to handle their own clicks.
        // This is required for native controls such as:
        // datetime-local, date, time, select, checkbox, etc.
        if (event.target?.closest?.('.smq-data-editor-control')) {
          return;
        }

        // Check if field is editable
        const field = element.dataset.field;
        const fieldMetadata = this.metadata.fields?.[field] || {};
        if (!this._canEditField(field, fieldMetadata)) {
          console.log('[DataEditor] Field not editable:', field);
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        console.log('[DataEditor] Editable field clicked:', {
          field: element.dataset.field,
          model: element.dataset.model,
          recordId: element.dataset.recordId,
          value: element.textContent
        });

        this.editElement(element);
      });
    });
  }

  resolveElement(element) {
    if (!element) {
      return null;
    }

    const field =
      element.dataset.field ||
      element.dataset.editorFieldName;

    const model =
      element.dataset.model ||
      element.dataset.editorModel;

    const recordId =
      element.dataset.recordId ||
      element.dataset.editorRecordId ||
      null;

    const relation =
      element.dataset.editorRelation;

    if (!model || !field) {
      return null;
    }

    // Relation fields are resolved from relation metadata.
    // A missing recordId or "new-record" means the relation item is new,
    // not that the field metadata is missing.
    if (relation) {
      const relationMeta =
        this.metadata.relations?.[relation];

      if (!relationMeta) {
        return null;
      }

      const fieldMeta =
        relationMeta.fields?.[field];

      if (!fieldMeta) {
        return null;
      }

      return {
        kind: 'relation',
        model,
        relation,
        field,
        recordId,
        isNew: this._isNewRecord(recordId),
        metadata: fieldMeta,
        relationMetadata: relationMeta,
        editor: this.metadataResolver.resolveFieldEditor(fieldMeta)
      };
    }

    // Normal Resident field.
    const fieldMeta =
      this.metadata.fields?.[field];

    if (!fieldMeta) {
      return null;
    }

    return {
      kind: 'field',
      model,
      field,
      recordId,
      isNew: this._isNewRecord(recordId),
      metadata: fieldMeta,
      editor: this.metadataResolver.resolveFieldEditor(fieldMeta)
    };
  }

  /*
   * ---------------------------------------------------------
   * Editor lifecycle
   * ---------------------------------------------------------
   */

  editElement(element) {
    if (!element) {
      return;
    }

    const field = element.dataset.field;

    if (!field) {
      console.warn('[DataEditor] Cannot edit element without field.');
      return;
    }

    if (this.activeEditors.has(element)) {
      console.log('[DataEditor] Editor already active:', field);
      return;
    }

    const resolved = this.resolveElement(element);

    console.log('[DataEditor] Resolved element:', resolved);

    if (!resolved) {
      console.warn('[DataEditor] Could not resolve metadata:', field);
      return;
    }

    const EditorClass = this.registry.resolve(resolved.editor?.name);

    if (!EditorClass) {
      console.error(
        '[DataEditor] No editor registered:',
        resolved.editor?.name
      );
      return;
    }

    const resolvedValue = this._getFieldValue(element);
    const currentValue =
      resolvedValue !== undefined && resolvedValue !== null
        ? resolvedValue
        : element.textContent;
    const originalValue = currentValue;

    console.log('[DataEditor] Creating editor:', {
      field,
      editor: resolved.editor?.name,
      value: currentValue
    });

    const editor = new EditorClass({
      value: currentValue,
      metadata: resolved.metadata,
      registry: this.registry,
      onCommit: (value) => {
        console.log('[DataEditor] Editor committed:', {
          field,
          value
        });

        this._commitElement(element, value, originalValue);
      },
      onCancel: () => {
        console.log('[DataEditor] Editor cancelled:', {
          field,
          value: originalValue
        });

        this._finishEdit(element, originalValue);
      }
    });

    const editorElement = editor.render();

    if (!editorElement) {
      console.error('[DataEditor] Editor returned no DOM element.');
      return;
    }

    const editorContainer = document.createElement('div');
    editorContainer.className = 'smq-data-editor-control';
    editorContainer.appendChild(editorElement);

    const helpText = editor.getHelpText?.();
    if (helpText) {
      const help = document.createElement('div');
      help.className = 'smq-data-editor-help';
      help.textContent = helpText;
      editorContainer.appendChild(help);
    }

    element.replaceChildren(editorContainer);
    element.classList.add('smq-data-editor-active');

    this.activeEditors.set(element, editor);

    console.log('[DataEditor] Editor mounted:', {
      field,
      editor: resolved.editor?.name
    });

    editor.focus?.();
  }

  /*
   * ---------------------------------------------------------
   * Mutation lifecycle
   * ---------------------------------------------------------
   */

  _valuesEqual(value, originalValue, metadata = {}) {
    if (value === originalValue) {
      return true;
    }

    if (value == null && originalValue == null) {
      return true;
    }

    if (metadata.type === 'DateTime') {
      const valueTime = value == null ? null : new Date(value).getTime();
      const originalTime =
        originalValue == null ? null : new Date(originalValue).getTime();

      if (!Number.isNaN(valueTime) && !Number.isNaN(originalTime)) {
        return valueTime === originalTime;
      }
    }

    if (
      typeof value === 'object' &&
      typeof originalValue === 'object' &&
      value !== null &&
      originalValue !== null
    ) {
      try {
        return JSON.stringify(value) === JSON.stringify(originalValue);
      } catch {
        return false;
      }
    }

    return false;
  }

  _isNewRecord(recordId) {
    return !recordId || recordId === 'new-record';
  }

  _getFieldValue(element) {
    const resolved = this._resolveFieldTarget(element);
    return resolved?.value;
  }



  
  async _commitElement(element, value, originalValue) {
    // Use the element's own identity directly — NO inference
    const model = element.dataset.model || element.dataset.editorModel;
    const recordId = element.dataset.recordId || element.dataset.editorRecordId || null;
    const field = element.dataset.field || element.dataset.editorFieldName;
    const relation = element.dataset.editorRelation || null;
    const isNew = this._isNewRecord(recordId);
    const relationMeta = relation ? this.metadata.relations?.[relation] : null;

    console.log('[DataEditor] Commit:', {
      model,
      recordId,
      field,
      value,
      relation,
      isNew,
      isList: relationMeta?.isList
    });

    // ─── UPDATE LOCAL STATE ───────────────────────────────
    if (relation && !isNew && recordId) {
      if (relationMeta?.isList === true) {
        // To-many: find in array
        const relationData = this.record[relation] || [];
        const itemIndex = relationData.findIndex(r => r.id === recordId);
        if (itemIndex !== -1) {
          relationData[itemIndex][field] = value;
        } else {
          const newItem = { id: recordId, [field]: value };
          if (!this.record[relation]) this.record[relation] = [];
          this.record[relation].push(newItem);
        }
      } else {
        // To-one: direct object
        const relationData = this.record[relation];
        if (relationData && typeof relationData === 'object' && !Array.isArray(relationData)) {
          relationData[field] = value;
        } else {
          this.record[relation] = { id: recordId, [field]: value };
        }
      }
    } else if (relation && isNew) {
      // New relation item — add to local state (temporary)
      const newItem = { [field]: value };
      
      if (relationMeta?.isList === true) {
        // To-many: push to array
        if (!this.record[relation]) this.record[relation] = [];
        this.record[relation].push(newItem);
      } else {
        // To-one: assign directly
        this.record[relation] = newItem;
      }
    } else {
      // Core field
      this.record[field] = value;
    }

    // ─── BUILD PAYLOAD ──────────────────────────────────────
    const metadata =
      relationMeta?.fields?.[field] ||
      this.metadata.fields?.[field] ||
      {};
    const unchanged = this._valuesEqual(value, originalValue, metadata);

    if (unchanged) {
      console.log('[DataEditor] Value unchanged. Skipping update.');
      this._finishEdit(element, originalValue);
      return;
    }

    // ─── SEND TO API ────────────────────────────────────────
    if (!this.mutations) {
      this._finishEdit(element, value);
      return;
    }

    try {
      if (isNew && relation) {
        // ─── CREATE NEW RELATION ──────────────────────────
        const createData = {
          [field]: value
        };

        // Get foreign key from relation metadata
        if (relationMeta && relationMeta.foreignKey) {
          createData[relationMeta.foreignKey] = this.recordId;
        } else {
          // Fallback: derive from parent model name
          const parentModel = this.model || model;
          const fkField = `${parentModel.toLowerCase()}Id`;
          if (this.recordId) {
            createData[fkField] = this.recordId;
          }
        }

        const createPayload = {
          model,
          data: createData
        };

        console.log('[DataEditor] Creating new relation record:', createPayload);

        const result = await this.mutations.create(createPayload);

        // Replace the temporary item with the created record (with real ID)
        if (result && result.id) {
          if (relationMeta?.isList === true) {
            const relationData = this.record[relation] || [];
            const tempIndex = relationData.findIndex(r => !r.id && r[field] === value);
            if (tempIndex !== -1) {
              this.record[relation][tempIndex] = result;
            } else {
              this.record[relation].push(result);
            }
          } else {
            this.record[relation] = result;
          }

          // Update the DOM element's record ID
          if (element) {
            element.dataset.recordId = result.id;
            element.dataset.editorRecordId = result.id;
          }

          // Propagate ID to ALL fields in the same record group
          const group = element.closest('[data-editor-record-group]');
          if (group) {
            // Update the group's identity
            group.dataset.editorRecordGroup = `${relation}:${result.id}`;

            // Update every field belonging to this record
            const targets = group.querySelectorAll('[data-editor-field]');
            targets.forEach((el) => {
              el.dataset.recordId = result.id;
              el.dataset.editorRecordId = result.id;
            });
          }
        }

        this._finishEdit(element, value);
        this._notifySuccess(field);

      } else if (isNew && !relation) {
        // ─── CREATE NEW CORE RECORD ──────────────────────
        // Build create data from existing record state + the edited field
        const createData = {
          ...this.record,
          [field]: value
        };

        // Remove any internal/transient fields
        delete createData.id;
        delete createData.metadata;
        delete createData._status;
        delete createData._ok;

        const createPayload = {
          model,
          data: createData
        };

        console.log('[DataEditor] Creating new record:', createPayload);

        const result = await this.mutations.create(createPayload);

        if (result && result.id) {
          // CRITICAL: Transition from CREATE to EXISTING
          this.recordId = result.id;

          // Update local state with the new record
          this.record = {
            ...result,
            metadata: this.record.metadata
          };

          // CRITICAL: Update BOTH types of targets
          const targets = this.root.querySelectorAll(
            '[data-editor-field], .smq-data-editable'
          );

          for (const el of targets) {
            if (
              el.dataset.recordId === 'new-record' ||
              el.dataset.editorRecordId === 'new-record'
            ) {
              el.dataset.recordId = result.id;
              el.dataset.editorRecordId = result.id;
            }
          }
        }

        this._finishEdit(element, value);
        this._notifySuccess(field);

      } else {
        // ─── UPDATE EXISTING RECORD ────────────────────────
        const payload = {
          model,
          recordId,
          field,
          value
        };

        console.log('[DataEditor] Updating:', payload);

        await this.mutations.update(payload);
        this._finishEdit(element, value);
      }
    } catch (error) {
      console.error('[DataEditor] Mutation rejected:', error);

      // ─── ROLLBACK ─────────────────────────────────────────
      if (relation && !isNew && recordId) {
        if (relationMeta?.isList === true) {
          const relationData = this.record[relation] || [];
          const itemIndex = relationData.findIndex(r => r.id === recordId);
          if (itemIndex !== -1) {
            relationData[itemIndex][field] = originalValue;
          }
        } else {
          const relationData = this.record[relation];
          if (relationData && typeof relationData === 'object' && !Array.isArray(relationData)) {
            relationData[field] = originalValue;
          }
        }
      } else if (relation && isNew) {
        if (relationMeta?.isList === true) {
          const relationData = this.record[relation] || [];
          if (relationData.length > 0) {
            const tempIndex = relationData.findIndex(r => !r.id && r[field] === value);
            if (tempIndex !== -1) {
              relationData.splice(tempIndex, 1);
            } else {
              relationData.pop();
            }
          }
        } else {
          // To-one: set to null
          this.record[relation] = null;
        }
      } else {
        this.record[field] = originalValue;
      }

      throw error;
    }
  }
  

  _handleUpdateSuccess(event = {}) {
    const { model, recordId, field, value, response } = event;

    const payload = {
      model,
      recordId,
      field,
      value
    };

    console.log('[DataEditor] Update successful:', {
      model,
      recordId,
      field,
      value,
      response
    });

    const element =
      this._findEditableElement(
        model,
        recordId,
        field
      );

    const relation =
      element?.dataset.editorRelation || null;

    if (relation) {
      const relationMeta = this.metadata.relations?.[relation];

      const relationRecordId =
        element.dataset.editorRelationRecordId ||
        recordId;

      if (relationMeta?.isList === true) {
        // To-many relation: local state is an array.
        const relationData = Array.isArray(this.record[relation])
          ? this.record[relation]
          : [];

        const itemIndex = relationData.findIndex(
          item => String(item.id) === String(relationRecordId)
        );

        if (itemIndex !== -1) {
          relationData[itemIndex][field] = value;
        } else {
          console.warn(
            `[DataEditor] Relation item not found during success handling: ${relation} ${relationRecordId}`
          );
        }
      } else {
        // To-one relation: local state is a single object.
        const relationData = this.record[relation];

        if (
          relationData &&
          typeof relationData === 'object' &&
          !Array.isArray(relationData)
        ) {
          relationData[field] = value;
        } else {
          console.warn(
            `[DataEditor] To-one relation not found during success handling: ${relation}`
          );
        }
      }
    } else if (field) {
      this.record[field] = value;
    }

    if (element) {
      this._finishEdit(element, value);
      showFieldStatus(element, 'saved');
    }

    this._notifySuccess(field);
    this.onUpdated(response, payload);
  }



  /*
   * ---------------------------------------------------------
   * Delete success
   * ---------------------------------------------------------
   */


  _handleDeleteSuccess(event = {}) {
    const { model, recordId, response } = event;

    const payload = {
      model,
      recordId
    };

    console.log('[DataEditor] Delete successful:', {
      response,
      payload
    });

    this._notifySuccess(null, 'Record deleted successfully.');
    this.onDeleted(response, payload);
  }

  /*
   * ---------------------------------------------------------
   * Mutation error
   * ---------------------------------------------------------
   */

  _handleMutationError(error, payload) {
    console.error('[DataEditor] Mutation failed:', {
      error,
      payload
    });

    this._notifyError(error);
    this.onError(error, payload);
  }

  /*
   * ---------------------------------------------------------
   * Notifications
   * ---------------------------------------------------------
   */

  _notifySuccess(field = null, message = null) {
    const text =
      message ||
      (field
        ? `${this._formatFieldName(field)} updated successfully.`
        : 'Operation completed successfully.');

    Notification.show({
      type: 'success',
      message: text,
      duration: 3000,
      themeColor: this.themeColor || undefined
    });
  }

  _notifyError(error) {
    let message = 'Unable to save your changes.';

    if (error?.message) {
      message = error.message;
    }

    Notification.show({
      type: 'error',
      message,
      duration: 3000,
      themeColor: this.themeColor || undefined
    });
  }

  _formatFieldName(field) {
    if (!field) {
      return 'Field';
    }

    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (character) => character.toUpperCase());
  }

  /*
   * ---------------------------------------------------------
   * Locate active DOM field
   * ---------------------------------------------------------
   */

  _findEditableElement(model, recordId, field) {
    const elements = this.root.querySelectorAll?.('.smq-data-editable') || [];

    for (const element of elements) {
      if (
        element.dataset.model === model &&
        element.dataset.recordId === recordId &&
        element.dataset.field === field
      ) {
        return element;
      }
    }

    return null;
  }

  _formatDisplayValue(value, fieldMetadata = {}) {
    if (value == null) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.join(',');
    }

    if (
      fieldMetadata?.editor === 'custom-key-value' ||
      fieldMetadata?.structure?.type === 'custom-key-value'
    ) {
      return Object.entries(value)
        .map(([key, itemValue]) => `${key}: ${itemValue ?? ''}`)
        .join(', ');
    }

    if (fieldMetadata?.editor === 'key-value') {
      const fields = fieldMetadata.structure?.fields || {};
      const values =
        value && typeof value === 'object' && !Array.isArray(value)
          ? value
          : {};

      return Object.keys(fields)
        .map((key) => `${key}: ${values[key] ?? ''}`)
        .join(', ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /*
   * ---------------------------------------------------------
   * Finish editing
   * ---------------------------------------------------------
   */

  _finishEdit(element, value) {
    this.activeEditors.delete(element);
    element.classList.remove('smq-data-editor-active');

    const field = element.dataset.field;

    this._renderDisplayState(
      element,
      value,
      this.metadata.fields?.[element.dataset.field] || {}
    );

    console.log('[DataEditor] Field display restored:', {
      field: element.dataset.field,
      value
    });
  }

  /*
   * ---------------------------------------------------------
   * Theme
   * ---------------------------------------------------------
   */

  _applyTheme() {
    if (!this.themeColor || !this.root) {
      return;
    }

    const target =
      this.root.documentElement ||
      this.root.querySelector?.(':root') ||
      document.documentElement;

    target.style.setProperty('--smq-data-editor-accent', this.themeColor);
    target.style.setProperty(
      '--smq-data-editor-accent-hover',
      this._lightenColor(this.themeColor, -10)
    );
    target.style.setProperty(
      '--smq-data-editor-focus',
      this._toRgba(this.themeColor, 0.16)
    );
  }

  _lightenColor(hex, amount) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
      return hex;
    }

    const value = parseInt(hex.slice(1), 16);

    const clamp = (number) =>
      Math.max(0, Math.min(255, number));

    const r = clamp((value >> 16) + amount);
    const g = clamp(((value >> 8) & 255) + amount);
    const b = clamp((value & 255) + amount);

    return `#${[r, g, b]
      .map((channel) => channel.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  _toRgba(hex, alpha) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
      return `color-mix(in srgb, ${hex} ${alpha * 100}%, transparent)`;
    }

    const value = parseInt(hex.slice(1), 16);

    const r = value >> 16;
    const g = (value >> 8) & 255;
    const b = value & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /*
   * ---------------------------------------------------------
   * Destroy
   * ---------------------------------------------------------
   */

  destroy() {
    this.boundElements.forEach((element) => {
      delete element.dataset.smqDataEditorBound;
    });

    this.boundElements.clear();
    this.activeEditors.clear();
  }
}