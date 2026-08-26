import BaseEditor from '../BaseEditor.js';

export default class StringEditor extends BaseEditor {
  render() {
    const input = document.createElement('input');

    input.type = this.metadata.inputType || 'text';
    input.value = this.value ?? '';

    if (this.metadata.placeholder) {
      input.placeholder = this.metadata.placeholder;
    }

    if (this.metadata.maxLength != null) {
      input.maxLength = Number(this.metadata.maxLength);
    }

    input.addEventListener('input', () => {
      this.commit(input.value);
    });

    this.element = input;
    return input;
  }
}
