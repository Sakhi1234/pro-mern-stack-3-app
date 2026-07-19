import { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { apiFetch } from '../utils/restFetch.js';

export default function About() {
  const [apiAbout, setApiAbout] = useState(null);

  useEffect(() => {
    apiFetch('/about')
      .then((data) => {
      setApiAbout(data?.about || '');
      });
  }, []);

  return (
    <Paper variant="outlined" sx={{ p: 4, mt: 4, borderRadius: 3, textAlign: 'center', boxShadow: '0 8px 24px rgba(2, 8, 20, 0.05)' }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Issue Tracker</Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>Version 0.9</Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>{apiAbout}</Typography>
      <Box sx={{ mt: 2, color: 'text.secondary' }}>Built with React, MUI, REST API, and MongoDB.</Box>
    </Paper>
  );
}
