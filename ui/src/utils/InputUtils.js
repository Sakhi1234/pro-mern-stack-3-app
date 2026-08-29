const INTEGER_TEXT_PATTERN = /^\d*$/;

export function isIntegerText(value) {
  return INTEGER_TEXT_PATTERN.test(value);
}

export function formatNumberValue(numberValue) {
  return numberValue != null ? numberValue.toString() : "";
}

export function parseNumberValue(textValue) {
  const parsedNumber = parseInt(textValue, 10);
  return Number.isNaN(parsedNumber) ? null : parsedNumber;
}

export function formatTextValue(text) {
  return text != null ? text : "";
}

export function parseTextValue(text) {
  return text.trim().length === 0 ? null : text;
}
