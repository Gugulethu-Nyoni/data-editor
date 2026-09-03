import BaseEditor from '../BaseEditor.js';

export default class CustomKeyValueEditor extends BaseEditor {

  render() {

    const container =
      document.createElement('div');

    container.className =
      'smq-data-editor-custom-key-value';

    const rows =
      document.createElement('div');

    rows.className =
      'smq-data-editor-custom-key-value-rows';

    const structure =
      this.metadata.structure || {};

    const keySpec =
      structure.key || {};

    const valueSpec =
      structure.value || {};

    console.log(
      '[CustomKeyValueEditor] render value:',
      this.value,
      'entries:',
      this.value &&
      typeof this.value === 'object' &&
      !Array.isArray(this.value)
        ? Object.entries(this.value)
        : []
    );

    const values =
      this.value &&
      typeof this.value === 'object' &&
      !Array.isArray(this.value)
        ? Object.entries(this.value).map(
            ([key, value]) => ({
              key,
              value
            })
          )
        : [];

    // ---------------------------------------------------------
    // Empty-state editor
    // ---------------------------------------------------------
    // When there is no existing data, open the editor with
    // one empty key/value row ready for input. The existing
    // Add item button remains available for additional rows.
    // ---------------------------------------------------------

    if (values.length === 0) {
      values.push({
        key: '',
        value: ''
      });
    }

    const serialize = () => {

      const result = {};

      values.forEach(
        (entry) => {

          if (
            String(entry.key).trim() !== ''
          ) {

            result[entry.key] =
              entry.value;

          }

        }
      );

      this.value =
        result;

    };

    const addRow = (entry) => {

      const row =
        document.createElement('div');

      row.className =
        'smq-data-editor-custom-key-value-row';

      const key =
        document.createElement('input');

      const value =
        document.createElement('input');

      const remove =
        document.createElement('button');

      key.type =
        keySpec.inputType ||
        keySpec.editor ||
        'text';

      value.type =
        valueSpec.inputType ||
        valueSpec.editor ||
        'text';

      key.placeholder =
        keySpec.placeholder ||
        'Key';

      value.placeholder =
        valueSpec.placeholder ||
        'Value';

      key.value =
        entry.key ?? '';

      value.value =
        entry.value ?? '';

      remove.type =
        'button';

      remove.textContent =
        'Remove';

      const update = () => {

        entry.key =
          key.value;

        entry.value =
          value.value;

        serialize();

      };

      key.addEventListener(
        'input',
        update
      );

      value.addEventListener(
        'input',
        update
      );

      key.addEventListener(
        'change',
        update
      );

      value.addEventListener(
        'change',
        update
      );

      const submit = (event) => {

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

      };

      key.addEventListener(
        'keydown',
        submit
      );

      value.addEventListener(
        'keydown',
        submit
      );

      remove.addEventListener(
        'click',
        () => {

          const index =
            values.indexOf(entry);

          if (index !== -1) {

            values.splice(
              index,
              1
            );

          }

          row.remove();

          serialize();

        }
      );

      row.append(
        key,
        value,
        remove
      );

      rows.appendChild(
        row
      );

    };

    values.forEach(
      addRow
    );

    const add =
      document.createElement('button');

    add.type =
      'button';

    add.textContent =
      'Add item';

    add.addEventListener(
      'click',
      () => {

        const entry = {
          key: '',
          value: ''
        };

        values.push(
          entry
        );

        addRow(
          entry
        );

      }
    );

    container.append(
      rows,
      add
    );

    this.element =
      container;

    return container;

  }

}