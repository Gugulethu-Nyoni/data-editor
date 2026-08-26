import BaseEditor from '../BaseEditor.js';

export default class IntEditor extends BaseEditor {
  render() {
    const input = document.createElement('input');
    input.type = 'number';
    input.step = this.metadata.step ?? '1';

    if (this.metadata.minimum != null) {
      input.min = this.metadata.minimum;
    }

    if (this.metadata.maximum != null) {
      input.max = this.metadata.maximum;
    }

    input.value = this.value ?? '';

    input.addEventListener('input', () => {
      input.value === ''
        ? this.commit(null)
        : this.commit(Number.parseInt(input.value, 10));
    });

    this.element = input;
    return input;
  }
}
