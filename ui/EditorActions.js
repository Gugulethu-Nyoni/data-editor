export default class EditorActions {
  constructor({
    onEdit = () => {},
    onDelete = () => {}
  } = {}) {
    this.onEdit = onEdit;
    this.onDelete = onDelete;
  }

  render() {
    const container =
      document.createElement('span');

    container.className =
      'smq-data-editor-actions';

    const edit =
      document.createElement('button');

    const remove =
      document.createElement('button');

    edit.type = 'button';
    remove.type = 'button';

    edit.textContent = 'Edit';
    remove.textContent = 'Delete';

    edit.addEventListener(
      'click',
      () => this.onEdit()
    );

    remove.addEventListener(
      'click',
      () => this.onDelete()
    );

    container.append(edit, remove);

    return container;
  }
}
