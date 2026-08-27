import { useState } from 'react';
import { TextField } from '@mui/material';
import { formatDateForDisplay, formatDateForInput, parseDateInput } from '../utils/DateUtils.js';

export default function DateInput({ value, onChange, onValidityChange, ...props }) {
  const [localValue, setLocalValue] = useState(formatDateForInput(value));
  const [focused, setFocused] = useState(false);
  const [valid, setValid] = useState(true);

  function handleBlur(e) {
    const dateValue = parseDateInput(localValue);
    const isValid = localValue === '' || dateValue != null;
    if (onValidityChange) onValidityChange(e, isValid);
    setFocused(false);
    setValid(isValid);
    if (isValid) onChange(e, dateValue);
  }

  const displayValue = focused || !valid ? localValue : formatDateForDisplay(value);

  return (
    <TextField
      {...props}
      size="small"
      fullWidth
      value={displayValue}
      placeholder={focused ? 'yyyy-mm-dd' : ''}
      error={!valid}
      onFocus={() => {
        setLocalValue(formatDateForInput(value));
        setFocused(true);
      }}
      onBlur={handleBlur}
      onChange={(e) => {
        if (/^[\d-]*$/.test(e.target.value)) setLocalValue(e.target.value);
      }}
    />
  );
}
