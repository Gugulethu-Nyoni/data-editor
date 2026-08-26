export default class BaseEditor {
  constructor({
    value = null,
    metadata = {},
    onCommit = () => {}
  } = {}) {
    this.value = value;
    this.metadata = metadata || {};
    this.onCommit = onCommit;
    this.element = null;
  }

  commit(value) {
    this.value = value;
    this.onCommit(value);
  }

  focus() {
    this.element?.focus?.();
  }

  getValue() {
    return this.value;
  }

  setValue(value) {
    this.value = value;
  }

  render() {
    throw new Error(
      `${this.constructor.name}.render() must be implemented.`
    );
  }
}
