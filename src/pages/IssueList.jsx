import { useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Pagination, Typography } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import IssueFilter from '../components/IssueFilter.jsx';
import IssueTable from '../components/IssueTable.jsx';
import IssueDetail from '../components/IssueDetail.jsx';
import { apiFetch, toQuery } from '../utils/restFetch.js';
import withToast from '../utils/withToast.jsx';
import UserContext from '../context/UserContext.js';

const SECTION_SIZE = 5;

function IssueList({ showError, showSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();
  const paramsRoute = useParams();
  const user = useContext(UserContext);
  const isIssueDetailRoute = paramsRoute.id != null;
  const [issues, setIssues] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  function loadData() {
    setLoading(true);
    const params = new URLSearchParams(location.search);
    const vars = {};
    if (params.get('status')) vars.status = params.get('status');

    const effortMin = parseInt(params.get('effortMin'), 10);
    if (!Number.isNaN(effortMin)) vars.effortMin = effortMin;
    const effortMax = parseInt(params.get('effortMax'), 10);
    if (!Number.isNaN(effortMax)) vars.effortMax = effortMax;

    const idInt = parseInt(paramsRoute.id, 10);
    if (!Number.isNaN(idInt)) {
      vars.selectedId = idInt;
    }

    let page = parseInt(params.get('page'), 10);
    if (Number.isNaN(page)) page = 1;
    vars.page = page;

    apiFetch(`/issues${toQuery(vars)}`, { method: 'GET' }, showError)
      .then((data) => {
        if (data) {
          setIssues(data.issueList.issues);
          setSelectedIssue(data.issue || null);
          setPages(data.issueList.pages || 1);
        }
        setLoading(false);
      });
  }

  useEffect(() => { loadData(); }, [location.search, paramsRoute.id]);

  function closeIssue(index) {
    apiFetch(`/issues/${issues[index].id}`, {
      method: 'PATCH',
      body: JSON.stringify({ changes: { status: 'Closed' } }),
    }, showError)
      .then((data) => {
        if (data) {
          const newList = [...issues];
          newList[index] = data.issueUpdate;
          setIssues(newList);
        } else {
          loadData();
        }
      });
  }

  function restoreIssue(id) {
    apiFetch(`/issues/${id}/restore`, { method: 'POST' }, showError)
      .then((data) => {
        if (data?.issueRestore) {
          showSuccess(`Issue ${id} restored successfully.`);
          loadData();
        }
      });
  }

  function deleteIssue(index) {
    const id = issues[index].id;
    apiFetch(`/issues/${id}`, { method: 'DELETE' }, showError)
      .then((data) => {
        if (data?.issueDelete) {
          const newList = [...issues];
          if (location.pathname === `/issues/${id}`) navigate(`/issues${location.search}`);
          newList.splice(index, 1);
          setIssues(newList);
          showSuccess(<span>{`Deleted issue ${id} successfully. `}<Button onClick={() => restoreIssue(id)}>UNDO</Button></span>);
        } else {
          loadData();
        }
      });
  }

  if (issues == null || loading) {
    return (
      <Box sx={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={34} />
      </Box>
    );
  }

  const params = new URLSearchParams(location.search);
  let page = parseInt(params.get('page'), 10);
  if (Number.isNaN(page)) page = 1;
  const startPage = Math.floor((page - 1) / SECTION_SIZE) * SECTION_SIZE + 1;
  const endPage = startPage + SECTION_SIZE - 1;

  return (
    <>
      {!isIssueDetailRoute ? (
        <>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              mt: 1,
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(2, 8, 20, 0.05)',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(15,118,110,0.06))',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  Create a new issue
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                  Capture a bug, task, or idea in a fresh issue and keep the discussion in one place.
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate('/create')}
                disabled={!user.signedIn}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2.5,
                  px: 2.4,
                  fontWeight: 700,
                  boxShadow: '0 10px 24px rgba(245, 158, 11, 0.28)',
                  whiteSpace: 'nowrap',
                }}
              >
                Create Issue
              </Button>
            </Box>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, mt: 1, borderRadius: 3, boxShadow: '0 8px 24px rgba(2, 8, 20, 0.05)' }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Filter Issues</Typography>
            <IssueFilter urlBase="/issues" />
          </Paper>
          <IssueTable issues={issues} closeIssue={closeIssue} deleteIssue={deleteIssue} />
        </>
      ) : null}
      <IssueDetail issue={selectedIssue} showError={showError} showSuccess={showSuccess} />
      {!isIssueDetailRoute ? (
        <>
          <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.max(1, pages)}
              page={page}
              onChange={(_, p) => {
                const q = new URLSearchParams(location.search);
                q.set('page', p);
                navigate({ search: `?${q.toString()}` });
              }}
            />
          </Box>
          <Typography sx={{ mt: 1, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>{`Section ${startPage}-${Math.min(endPage, pages)}`}</Typography>
        </>
      ) : null}
    </>
  );
}

export default withToast(IssueList);
