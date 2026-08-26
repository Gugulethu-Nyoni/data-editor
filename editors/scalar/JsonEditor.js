import BaseEditor from '../BaseEditor.js';

export default class JsonEditor extends BaseEditor {
  render() {
    const textarea = document.createElement('textarea');

    textarea.rows = this.metadata.rows || 8;
    textarea.spellcheck = false;

    textarea.value =
      this.value == null
        ? ''
        : JSON.stringify(this.value, null, 2);

    textarea.addEventListener('change', () => {
      const raw = textarea.value.trim();

      if (!raw) {
        this.commit(null);
        return;
      }

      try {
        this.commit(JSON.parse(raw));
      } catch {
        // Leave invalid JSON in editor.
      }
    });

    this.element = textarea;
    return textarea;
  }
}
