export default class BaseEditor {

  constructor({

    value = null,

    metadata = {},

    registry = null,

    onCommit = () => {},

    onCancel = () => {}

  } = {}) {

    this.value = value;
    this.originalValue = value;

    this.metadata =
      metadata || {};

    this.registry =
      registry;

    this.onCommit =
      onCommit;

    this.onCancel =
      onCancel;

    this.element =
      null;

    this.committed =
      false;

  }


  commit(value) {

    if (this.committed) {

      return;

    }

    this.value =

      value;

  }


  submit() {

    if (this.committed) {

      return false;

    }

    if (!this.validateNative()) {

      return false;

    }

    this.committed =

      true;

    this.onCommit(

      this.value

    );

    return true;

  }


  validateNative() {

    const element =
      this.element;

    if (!element) {
      return true;
    }

    const controls =
      element.matches?.(
        'input, textarea, select'
      )
        ? [element]
        : [
            ...(
              element.querySelectorAll?.(
                'input, textarea, select'
              ) || []
            )
          ];

    for (const control of controls) {

      if (!control.checkValidity()) {

        control.reportValidity();

        return false;

      }

    }

    return true;

  }

  hasChanged(value) {

    if (value === this.originalValue) {

      return false;

    }

    if (
      value == null &&
      this.originalValue == null
    ) {

      return false;

    }

    if (
      typeof value === 'object' &&
      typeof this.originalValue === 'object' &&
      value !== null &&
      this.originalValue !== null
    ) {

      try {

        return JSON.stringify(value) !==
          JSON.stringify(this.originalValue);

      } catch {

        return true;

      }

    }

    return true;

  }

  cancel() {

    if (this.committed) {

      return;

    }

    this.committed =
      true;

    this.value =
      this.originalValue;

    this.onCancel(
      this.originalValue
    );

  }


  focus() {

    this.element?.focus?.();

  }


  getValue() {

    return this.value;

  }


  setValue(value) {

    this.value =
      value;

  }


  getHelpText() {

    return 'Enter to save · Esc to cancel';

  }


  render() {

    throw new Error(

      `${this.constructor.name}.render() must be implemented.`

    );

  }

}
