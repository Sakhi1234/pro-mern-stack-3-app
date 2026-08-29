import { useState } from "react";
import { TextField } from "@mui/material";
import {
  formatNumberValue,
  isIntegerText,
  parseNumberValue,
} from "../utils/InputUtils.js";

export default function NumInput({ value, onChange, ...props }) {
  const [localValue, setLocalValue] = useState(formatNumberValue(value));

  return (
    <TextField
      {...props}
      size="small"
      fullWidth
      value={localValue}
      onChange={(e) => {
        if (isIntegerText(e.target.value)) setLocalValue(e.target.value);
      }}
      onBlur={(e) => onChange(e, parseNumberValue(localValue))}
    />
  );
}
