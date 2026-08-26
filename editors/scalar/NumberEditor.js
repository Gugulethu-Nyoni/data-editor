import BaseEditor from '../BaseEditor.js';

export default class NumberEditor extends BaseEditor {
  render() {
    const input = document.createElement('input');

    input.type = 'number';
    input.step = this.metadata.step ?? 'any';
    input.value = this.value ?? '';

    if (this.metadata.minimum != null) {
      input.min = this.metadata.minimum;
    }

    if (this.metadata.maximum != null) {
      input.max = this.metadata.maximum;
    }

    input.addEventListener('input', () => {
      input.value === ''
        ? this.commit(null)
        : this.commit(Number(input.value));
    });

    this.element = input;
    return input;
  }
}
