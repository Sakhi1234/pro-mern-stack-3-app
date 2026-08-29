import { useEffect } from "react";
import { Alert, Snackbar } from "@mui/material";

export default function Toast({ showing, severity, onDismiss, children }) {
  useEffect(() => {
    if (!showing) return undefined;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [showing, onDismiss]);

  return (
    <Snackbar
      open={showing}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Alert severity={severity} onClose={onDismiss} sx={{ width: "100%" }}>
        {children}
      </Alert>
    </Snackbar>
  );
}
