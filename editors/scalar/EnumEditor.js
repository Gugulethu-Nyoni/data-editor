import BaseEditor from '../BaseEditor.js';

export default class EnumEditor extends BaseEditor {
  render() {
    const select = document.createElement('select');

    for (const option of this.metadata.options || []) {
      const element = document.createElement('option');

      if (typeof option === 'object') {
        element.value = option.value;
        element.textContent =
          option.label ?? option.value;
      } else {
        element.value = option;
        element.textContent = option;
      }

      select.appendChild(element);
    }

    if (this.value != null) {
      select.value = this.value;
    }

    select.addEventListener('change', () => {
      this.commit(select.value);
    });

    this.element = select;
    return select;
  }
}
