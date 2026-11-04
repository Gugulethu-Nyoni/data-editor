export function parseTableValue(value) {
  if (value == null) {
    return { title: '', headers: [], rows: [], unsupported: false };
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { unsupported: true };
  }
  const keys = Object.keys(value);
  if (keys.length === 0) {
    return { title: '', headers: [], rows: [], unsupported: false };
  }
  if (keys.length > 1) {
    return { unsupported: true };
  }
  const title = keys[0];
  const columnsObj = value[title];
  if (!columnsObj || typeof columnsObj !== 'object' || Array.isArray(columnsObj)) {
    return { unsupported: true };
  }
  const headers = Object.keys(columnsObj);
  if (headers.length === 0) {
    return { title, headers: [], rows: [], unsupported: false };
  }
  for (const h of headers) {
    if (!Array.isArray(columnsObj[h])) {
      return { unsupported: true };
    }
  }
  let rowCount = 0;
  for (const h of headers) {
    if (columnsObj[h].length > rowCount) rowCount = columnsObj[h].length;
  }
  const rows = [];
  for (let i = 0; i < rowCount; i++) {
    const row = headers.map(h => {
      const cell = columnsObj[h][i];
      return cell == null ? '' : String(cell);
    });
    rows.push(row);
  }
  return { title, headers, rows, unsupported: false };
}

export function serializeTableValue(title, headers, rows) {
  const columns = {};
  headers.forEach((header, colIdx) => {
    columns[header] = rows.map(row => row[colIdx] ?? '');
  });
  return { [title]: columns };
}
