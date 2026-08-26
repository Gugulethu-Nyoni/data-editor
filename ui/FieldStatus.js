export function showFieldStatus(
  field,
  status,
  message = ''
) {
  field
    .querySelector(
      '.smq-data-editor-status'
    )
    ?.remove();

  const statusElement =
    document.createElement('span');

  statusElement.className =
    `smq-data-editor-status smq-data-editor-status-${status}`;

  statusElement.textContent =
    status === 'saved'
      ? '✓ Saved'
      : status === 'saving'
        ? 'Saving...'
        : message || 'Unable to save';

  field.appendChild(statusElement);

  return statusElement;
}
