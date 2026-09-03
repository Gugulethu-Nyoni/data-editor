export default class EditorRegistry {
  constructor() {
    this.editors = new Map();
  }

  register(name, EditorClass) {
    if (!name || typeof EditorClass !== 'function') {
      throw new TypeError(
        'Editor name and class are required.'
      );
    }

    this.editors.set(name, EditorClass);
    return this;
  }

  registerMany(editors = {}) {
    Object.entries(editors).forEach(
      ([name, EditorClass]) => {
        this.register(name, EditorClass);
      }
    );

    return this;
  }

  resolve(name) {
    const editor =
      this.editors.get(name) || null;

    console.log(
      '[EditorRegistry] resolve():',
      name,
      editor
    );

    return editor;
  }

  has(name) {
    return this.editors.has(name);
  }

  list() {
    return [...this.editors.keys()];
  }
}
