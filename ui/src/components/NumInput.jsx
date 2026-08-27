import { useState } from 'react';
import { TextField } from '@mui/material';
import { formatNumberValue, parseNumberValue } from '../utils/InputUtils.js';

export default function NumInput({ value, onChange, ...props }) {
  const [localValue, setLocalValue] = useState(formatNumberValue(value));

  return (
    <TextField
      {...props}
      size="small"
      fullWidth
      value={localValue}
      onChange={(e) => {
        if (/^\d*$/.test(e.target.value)) setLocalValue(e.target.value);
      }}
      onBlur={(e) => onChange(e, parseNumberValue(localValue))}
    />
  );
}
