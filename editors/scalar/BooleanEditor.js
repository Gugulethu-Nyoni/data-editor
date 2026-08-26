import BaseEditor from '../BaseEditor.js';

export default class BooleanEditor extends BaseEditor {
  render() {
    const input = document.createElement('input');

    input.type = 'checkbox';
    input.checked = Boolean(this.value);

    input.addEventListener('change', () => {
      this.commit(input.checked);
    });

    this.element = input;
    return input;
  }
}
