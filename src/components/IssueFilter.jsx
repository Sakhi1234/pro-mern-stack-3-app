import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

export default function IssueFilter({ urlBase }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [effortMin, setEffortMin] = useState('');
  const [effortMax, setEffortMax] = useState('');
  const [changed, setChanged] = useState(false);

  const hasActiveFilters = Boolean(status || effortMin || effortMax);

  function syncFromSearch() {
    const params = new URLSearchParams(location.search);
    setStatus(params.get('status') || '');
    setEffortMin(params.get('effortMin') || '');
    setEffortMax(params.get('effortMax') || '');
    setChanged(false);
  }

  useEffect(() => {
    syncFromSearch();
  }, [location.search]);

  function applyFilter() {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (effortMin) params.set('effortMin', effortMin);
    if (effortMax) params.set('effortMax', effortMax);
    const search = params.toString() ? `?${params.toString()}` : '';
    navigate({ pathname: urlBase, search });
  }

  function resetFilter() {
    setStatus('');
    setEffortMin('');
    setEffortMax('');
    setChanged(false);
    navigate({ pathname: urlBase, search: '' });
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setChanged(true); }} sx={{ minWidth: 170 }}>
        <MenuItem value="">(All)</MenuItem>
        <MenuItem value="New">New</MenuItem>
        <MenuItem value="Assigned">Assigned</MenuItem>
        <MenuItem value="Fixed">Fixed</MenuItem>
        <MenuItem value="Closed">Closed</MenuItem>
      </TextField>
      <TextField size="small" label="Effort Min (days)" value={effortMin} onChange={(e) => { if (/^\d*$/.test(e.target.value)) { setEffortMin(e.target.value); setChanged(true); } }} sx={{ minWidth: 150 }} />
      <TextField size="small" label="Effort Max (days)" value={effortMax} onChange={(e) => { if (/^\d*$/.test(e.target.value)) { setEffortMax(e.target.value); setChanged(true); } }} sx={{ minWidth: 150 }} />
      <Button variant="contained" onClick={applyFilter} sx={{ textTransform: 'none', borderRadius: 2.5, px: 2.2 }}>Apply</Button>
      <Button variant="outlined" disabled={!changed && !hasActiveFilters} onClick={resetFilter} sx={{ textTransform: 'none', borderRadius: 2.5 }}>Reset</Button>
    </Box>
  );
}
