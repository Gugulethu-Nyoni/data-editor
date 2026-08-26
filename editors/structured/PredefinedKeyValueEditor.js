import BaseEditor from '../BaseEditor.js';

export default class PredefinedKeyValueEditor extends BaseEditor {
  render() {
    const container = document.createElement('div');

    container.className =
      'smq-data-editor-key-value';

    const values =
      this.value &&
      typeof this.value === 'object'
        ? { ...this.value }
        : {};

    const keys =
      this.metadata.structure?.keys || {};

    Object.entries(keys).forEach(
      ([key, spec]) => {
        const row =
          document.createElement('div');

        row.className =
          'smq-data-editor-key-value-row';

        const label =
          document.createElement('label');

        label.textContent = key;

        const input =
          document.createElement('input');

        input.type =
          spec.editor || 'text';

        input.value =
          values[key] ?? '';

        const commit = () => {
          if (
            input.value === '' &&
            spec.nullable !== false
          ) {
            delete values[key];
          } else {
            values[key] = input.value;
          }

          this.commit({ ...values });
        };

        input.addEventListener(
          'change',
          commit
        );

        input.addEventListener(
          'blur',
          commit
        );

        row.append(label, input);
        container.appendChild(row);
      }
    );

    this.element = container;

    return container;
  }
}
