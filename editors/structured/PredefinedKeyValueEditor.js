import BaseEditor from '../BaseEditor.js';

export default class PredefinedKeyValueEditor extends BaseEditor {

  render() {

    const container =
      document.createElement('div');

    container.className =
      'smq-data-editor-key-value';

    const values =
      this.value &&
      typeof this.value === 'object' &&
      !Array.isArray(this.value)
        ? { ...this.value }
        : {};

    const fields =
      this.metadata.structure?.fields || {};

    Object.entries(fields).forEach(
      ([key, spec]) => {

        const row =
          document.createElement('div');

        row.className =
          'smq-data-editor-key-value-row';

        const label =
          document.createElement('label');

        label.textContent =
          key;

        const input =
          document.createElement('input');

        input.type =
          spec.inputType ||
          spec.editor ||
          'text';

        input.value =
          values[key] ?? '';

        if (spec.placeholder) {

          input.placeholder =
            spec.placeholder;

        }

        const update = () => {

          if (
            input.value === '' &&
            spec.nullable !== false
          ) {

            delete values[key];

          } else {

            values[key] =
              input.value;

          }

          this.value =
            { ...values };

        };

        input.addEventListener(
          'input',
          update
        );

        input.addEventListener(
          'change',
          update
        );

        input.addEventListener(
          'keydown',
          (event) => {

            if (
              event.key === 'Enter'
            ) {

              event.preventDefault();

              update();

              this.submit();

            }

            if (
              event.key === 'Escape'
            ) {

              event.preventDefault();

              this.cancel();

            }

          }
        );

        row.append(
          label,
          input
        );

        container.appendChild(
          row
        );

      }
    );

    this.element =
      container;

    return container;

  }

}