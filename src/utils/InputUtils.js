export function formatNumberValue(num) {
  return num != null ? num.toString() : '';
}

export function parseNumberValue(str) {
  const val = parseInt(str, 10);
  return Number.isNaN(val) ? null : val;
}

export function formatTextValue(text) {
  return text != null ? text : '';
}

export function parseTextValue(text) {
  return text.trim().length === 0 ? null : text;
}
