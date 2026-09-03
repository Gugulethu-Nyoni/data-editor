import BaseEditor from '../BaseEditor.js';

export default class CommaSeparatedEditor extends BaseEditor {
  render() {
    const textarea = document.createElement('textarea');

    textarea.rows = this.metadata.rows || 3;

    const values = Array.isArray(this.value)
      ? this.value
      : [];

    textarea.value = values.join(', ');

    const commit = () => {
      const item = this.metadata.structure?.item || {};
      const raw = textarea.value.trim();

      if (!raw) {
        this.commit([]);
        return;
      }

      const values = raw
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)
        .map(value => {
          if (item.editor === 'number') {
            return Number(value);
          }

          return value;
        });

      this.commit(values);
    };

    textarea.addEventListener('keydown', (event) => {
      if (
        event.key === 'Enter' &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();

        commit();
        this.submit();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        this.cancel();
      }
    });

    this.element = textarea;

    return textarea;
  }
}
