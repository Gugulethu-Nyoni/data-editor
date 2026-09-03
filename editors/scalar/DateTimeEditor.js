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

    const commit = () => {

      if (!input.value) {

        this.commit(null);

        return;

      }

      const date =
        new Date(input.value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return;

      }

      this.commit(
        date.toISOString()
      );

    };

    const cancel = () => {

      this.cancel();

    };

    input.addEventListener(
      'change',
      commit
    );

    /*
     * TEMPORARY DIAGNOSTIC:
     * Do not commit on blur.
     *
     * Native datetime-local controls can use focus/blur
     * while interacting with the browser's native picker.
     * This test isolates whether blur is closing the editor
     * before the native picker can operate normally.
     */


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

    this.element = input;

    return input;
  }

}
