import BaseEditor from '../BaseEditor.js';

export default class BytesEditor extends BaseEditor {
  render() {
    const input = document.createElement('input');

    input.type = 'text';
    input.value =
      this.value == null ? '' : String(this.value);

    input.addEventListener('input', () => {
      this.commit(input.value);
    });

    this.element = input;
    return input;
  }
}
