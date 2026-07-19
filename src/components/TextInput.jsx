import { useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import { formatTextValue, parseTextValue } from '../utils/InputUtils.js';

export default function TextInput({ value, onChange, multiline = false, rows, ...props }) {
  const [localValue, setLocalValue] = useState(formatTextValue(value));

  useEffect(() => setLocalValue(formatTextValue(value)), [value]);

  return (
    <TextField
      {...props}
      size="small"
      fullWidth
      multiline={multiline}
      rows={rows}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={(e) => onChange(e, parseTextValue(localValue))}
    />
  );
}
