import BaseEditor from '../BaseEditor.js';

export default class DateTimeEditor extends BaseEditor {
  render() {
    const input = document.createElement('input');

    input.type =
      this.metadata.inputType ||
      'datetime-local';

    if (this.value) {
      const date = new Date(this.value);

      if (!Number.isNaN(date.getTime())) {
        const local = new Date(
          date.getTime() -
          date.getTimezoneOffset() * 60000
        );

        input.value = local
          .toISOString()
          .slice(0, 16);
      }
    }

    input.addEventListener('change', () => {
      if (!input.value) {
        this.commit(null);
        return;
      }

      const date = new Date(input.value);

      if (!Number.isNaN(date.getTime())) {
        this.commit(date.toISOString());
      }
    });

    this.element = input;
    return input;
  }
}
