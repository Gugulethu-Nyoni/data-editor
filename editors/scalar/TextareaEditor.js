import BaseEditor from '../BaseEditor.js';

export default class TextareaEditor extends BaseEditor {

  render() {

    const textarea =
      document.createElement('textarea');

    textarea.value =
      this.value == null
        ? ''
        : String(this.value);

    if (
      this.metadata.placeholder
    ) {

      textarea.placeholder =
        this.metadata.placeholder;

    }

    if (
      this.metadata.maxLength != null
    ) {

      textarea.maxLength =
        Number(
          this.metadata.maxLength
        );

    }

    const commit = () => {

      this.commit(
        textarea.value
      );

    };

    const cancel = () => {

      this.cancel();

    };

    textarea.addEventListener(
      'keydown',
      (event) => {

        if (
          event.key === 'Enter' &&
          (event.ctrlKey || event.metaKey)
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
      textarea;

    return textarea;

  }

  getHelpText() {

    return 'Ctrl/Cmd+Enter to save · Esc to cancel';

  }

}
