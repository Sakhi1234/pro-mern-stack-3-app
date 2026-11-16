import { createTheme } from "@mui/material/styles";

export default createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f766e" },
    secondary: { main: "#f59e0b" },
    background: { default: "#f6f8fb", paper: "#ffffff" },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: [
      "Manrope",
      "Inter",
      "Segoe UI",
      "Roboto",
      "Arial",
      "sans-serif",
    ].join(","),
    h6: { fontWeight: 700, letterSpacing: -0.2 },
  },
});
