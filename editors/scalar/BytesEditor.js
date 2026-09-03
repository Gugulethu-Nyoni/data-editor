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


    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.submit();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        this.cancel();
      }
    });

    this.element = input;
    return input;
  }
}
