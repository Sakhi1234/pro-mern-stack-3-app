import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import App from './App.jsx';
import './index.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f766e' },
    secondary: { main: '#f59e0b' },
    background: { default: '#f6f8fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: ['Manrope', 'Inter', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h6: { fontWeight: 700, letterSpacing: -0.2 },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{
        ':root': {
          colorScheme: 'light',
        },
        body: {
          background: 'radial-gradient(circle at 5% 0%, #e6fffa 0, rgba(230,255,250,0) 35%), radial-gradient(circle at 95% 0%, #fff7ed 0, rgba(255,247,237,0) 30%), #f6f8fb',
        },
      }}
      />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
