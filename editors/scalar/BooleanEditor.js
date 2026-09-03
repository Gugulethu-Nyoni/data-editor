import BaseEditor from '../BaseEditor.js';

export default class BooleanEditor extends BaseEditor {
  render() {
    const input = document.createElement('input');

    input.type = 'checkbox';
    input.checked = Boolean(this.value);

    input.addEventListener('change', () => {
      this.commit(input.checked);

      this.submit();
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
