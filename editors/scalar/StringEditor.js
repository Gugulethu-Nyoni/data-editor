import BaseEditor from '../BaseEditor.js';

export default class StringEditor extends BaseEditor {

  render() {

    const input =
      document.createElement('input');

    // Type from metadata
    input.type =
      this.metadata.inputType || 'text';

    input.value =
      this.value ?? '';

    if (
      this.metadata.placeholder
    ) {

      input.placeholder =
        this.metadata.placeholder;

    }

    // Validation attributes
    if (this.metadata.required) {
      input.required = true;
    }

    if (
      this.metadata.minLength != null
    ) {
      input.minLength =
        Number(this.metadata.minLength);
    }

    if (
      this.metadata.maxLength != null
    ) {
      input.maxLength =
        Number(this.metadata.maxLength);
    }

    if (
      this.metadata.pattern
    ) {
      input.pattern = this.metadata.pattern;
    }

    const commit = () => {

      this.commit(
        input.value
      );

    };

    const cancel = () => {

      this.cancel();

    };

    input.addEventListener(
      'keydown',
      (event) => {

        if (
          event.key === 'Enter'
        ) {

          event.preventDefault();

          commit();
          this.submit();

        }

        if (
          event.key === 'Escape'
        ) {

          event.preventDefault();

          cancel();

        }

      }
    );

    this.element =
      input;

    return input;

  }

}