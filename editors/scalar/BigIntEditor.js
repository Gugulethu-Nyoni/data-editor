import BaseEditor from '../BaseEditor.js';

export default class BigIntEditor extends BaseEditor {
  render() {
    const input = document.createElement('input');

    input.type = 'text';
    input.inputMode = 'numeric';
    input.value =
      this.value == null ? '' : String(this.value);

    input.addEventListener('change', () => {
      if (input.value.trim() === '') {
        this.commit(null);
        return;
      }

      try {
        this.commit(BigInt(input.value.trim()));
      } catch {
        // Invalid value remains in the editor.
      }
    });

    this.element = input;
    return input;
  }
}
