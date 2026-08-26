export default class MetadataResolver {
  constructor({
    metadata = {},
    registry = null
  } = {}) {
    this.metadata = metadata || {};
    this.registry = registry;
  }

  setMetadata(metadata) {
    this.metadata = metadata || {};
    return this;
  }

  resolve(model, recordId, field) {
    const fieldMetadata =
      this.metadata.fields?.[field];

    if (fieldMetadata) {
      return {
        kind: 'field',
        model:
          fieldMetadata.model || model,
        recordId:
          fieldMetadata.recordId || recordId,
        field,
        metadata: fieldMetadata,
        editor:
          this.resolveFieldEditor(fieldMetadata)
      };
    }

    const relationMetadata =
      this.metadata.relations?.[field];

    if (relationMetadata) {
      return {
        kind: 'relation',
        model:
          relationMetadata.model || model,
        recordId:
          relationMetadata.recordId || recordId,
        field,
        metadata: relationMetadata,
        editor: null
      };
    }

    return null;
  }

  resolveFieldEditor(metadata) {
    if (!metadata) {
      return null;
    }

    /*
     * Explicit editor always wins.
     *
     * This allows metadata such as:
     *
     * editor: 'textarea'
     * editor: 'number'
     * editor: 'key-value'
     */
    if (metadata.editor) {
      return {
        name: metadata.editor,
        structure:
          metadata.structure || null
      };
    }

    /*
     * Structured metadata can determine the editor.
     */
    const structure =
      metadata.structure?.type;

    if (structure === 'comma-separated-values') {
      return {
        name: 'comma-separated',
        structure: metadata.structure
      };
    }

    if (structure === 'key-value') {
      return {
        name: 'key-value',
        structure: metadata.structure
      };
    }

    if (structure === 'custom-key-value') {
      return {
        name: 'custom-key-value',
        structure: metadata.structure
      };
    }

    /*
     * Fallback from TypeCaster semantic type.
     */
    return {
      name: this._editorForType(
        metadata.type
      ),
      structure: null
    };
  }

  _editorForType(type) {
    const mapping = {
      String: 'text',
      Int: 'int',
      BigInt: 'bigint',
      Float: 'float',
      Decimal: 'decimal',
      Boolean: 'boolean',
      DateTime: 'datetime',
      Json: 'json',
      Bytes: 'bytes',
      Enum: 'enum'
    };

    return mapping[type] || null;
  }
}
