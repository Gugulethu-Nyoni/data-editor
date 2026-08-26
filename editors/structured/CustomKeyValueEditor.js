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

    const values =
      this.value &&
      typeof this.value === 'object'
        ? Object.entries(this.value)
            .map(([key, value]) => ({
              key,
              value
            }))
        : [];

    const serialize = () => {
      const result = {};

      values.forEach(entry => {
        if (entry.key.trim() !== '') {
          result[entry.key] = entry.value;
        }
      });

      this.commit(result);
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

      key.type = 'text';
      value.type = 'text';

      key.placeholder = 'Key';
      value.placeholder = 'Value';

      key.value = entry.key;
      value.value = entry.value ?? '';

      remove.type = 'button';
      remove.textContent = 'Remove';

      const commit = () => {
        entry.key = key.value;
        entry.value = value.value;
        serialize();
      };

      key.addEventListener(
        'change',
        commit
      );

      value.addEventListener(
        'change',
        commit
      );

      key.addEventListener(
        'blur',
        commit
      );

      value.addEventListener(
        'blur',
        commit
      );

      remove.addEventListener(
        'click',
        () => {
          const index =
            values.indexOf(entry);

          if (index !== -1) {
            values.splice(index, 1);
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

      rows.appendChild(row);
    };

    values.forEach(addRow);

    const add =
      document.createElement('button');

    add.type = 'button';
    add.textContent = 'Add item';

    add.addEventListener(
      'click',
      () => {
        const entry = {
          key: '',
          value: ''
        };

        values.push(entry);
        addRow(entry);
      }
    );

    container.append(rows, add);

    this.element = container;

    return container;
  }
}
