import BaseEditor from '../BaseEditor.js';

export default class NumberEditor extends BaseEditor {

  render() {

    const input =
      document.createElement('input');

    input.type =
      'number';

    input.step =
      this.metadata.step ??
      'any';

    input.value =
      this.value ?? '';

    if (
      this.metadata.minimum != null
    ) {

      input.min =
        this.metadata.minimum;

    }

    if (
      this.metadata.maximum != null
    ) {

      input.max =
        this.metadata.maximum;

    }

    const commit = () => {

      if (
        input.value === ''
      ) {

        this.commit(null);

        return;

      }

      const value =
        Number(
          input.value
        );

      if (
        Number.isNaN(value)
      ) {

        return;

      }

      console.log(
        '[NumberEditor] Commit:',
        value
      );

      this.commit(value);

    };

    const cancel = () => {

      console.log(
        '[NumberEditor] Cancel.'
      );

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
