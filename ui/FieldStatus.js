export function showFieldStatus(
  field,
  status,
  message = ''
) {
  if (!field) {
    return null;
  }

  field
    .querySelector(
      ':scope > .smq-data-editor-status'
    )
    ?.remove();

  const statusElement =
    document.createElement('span');

  statusElement.className =
    `smq-data-editor-status smq-data-editor-status-${status}`;

  statusElement.setAttribute(
    'role',
    'status'
  );

  statusElement.setAttribute(
    'aria-live',
    'polite'
  );

  if (status === 'saving') {
    statusElement.textContent =
      'Saving...';
  } else if (status === 'saved') {
    statusElement.textContent =
      '✓ Saved';
  } else {
    statusElement.textContent =
      message || 'Unable to save';
  }

  field.appendChild(
    statusElement
  );

  return statusElement;
}
