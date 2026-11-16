import { CacheProvider } from "@emotion/react";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme.js";

export default function AppProviders({ cache, children }) {
  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            ":root": { colorScheme: "light" },
            body: {
              background:
                "radial-gradient(circle at 5% 0%, #e6fffa 0, rgba(230,255,250,0) 35%), radial-gradient(circle at 95% 0%, #fff7ed 0, rgba(255,247,237,0) 30%), #f6f8fb",
            },
          }}
        />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
