import { useEffect, useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import IssueFilter from '../components/IssueFilter.jsx';
import withToast from '../utils/withToast.jsx';
import { apiFetch, toQuery } from '../utils/restFetch.js';

const statuses = ['New', 'Assigned', 'Fixed', 'Closed'];

function IssueReport({ showError }) {
  const location = useLocation();
  const [stats, setStats] = useState(null);

  function loadData() {
    const params = new URLSearchParams(location.search);
    const vars = {};
    if (params.get('status')) vars.status = params.get('status');

    const effortMin = parseInt(params.get('effortMin'), 10);
    if (!Number.isNaN(effortMin)) vars.effortMin = effortMin;
    const effortMax = parseInt(params.get('effortMax'), 10);
    if (!Number.isNaN(effortMax)) vars.effortMax = effortMax;

    apiFetch(`/issue-counts${toQuery(vars)}`, { method: 'GET' }, showError)
      .then((data) => {
        if (data) setStats(data.issueCounts);
      });
  }

  useEffect(() => { loadData(); }, [location.search]);

  if (stats == null) return null;

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2.5, mt: 1, borderRadius: 3, boxShadow: '0 8px 24px rgba(2, 8, 20, 0.05)' }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Filter Report</Typography>
        <IssueFilter urlBase="/report" />
      </Paper>
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, borderRadius: 3, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& .MuiTableCell-root': { backgroundColor: 'rgba(15, 118, 110, 0.06)', fontWeight: 700 } }}>
              <TableCell />
              {statuses.map((status) => <TableCell key={status}>{status}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map((counts) => (
              <TableRow key={counts.owner}>
                <TableCell>{counts.owner}</TableCell>
                {statuses.map((status) => <TableCell key={status}>{counts[status]}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default withToast(IssueReport);
