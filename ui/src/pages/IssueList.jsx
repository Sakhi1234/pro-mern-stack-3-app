import { useCallback, useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Pagination, Typography } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import IssueFilter from '../components/IssueFilter.jsx';
import IssueTable from '../components/IssueTable.jsx';
import IssueDetail from '../components/IssueDetail.jsx';
import {
  closeIssueRequest,
  deleteIssueRequest,
  fetchIssueList,
  restoreIssueRequest,
} from '../api/issues.js';
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

  const loadData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    const searchParams = new URLSearchParams(location.search);
    const listParams = {};
    if (searchParams.get('status')) listParams.status = searchParams.get('status');

    const effortMin = parseInt(searchParams.get('effortMin'), 10);
    if (!Number.isNaN(effortMin)) listParams.effortMin = effortMin;
    const effortMax = parseInt(searchParams.get('effortMax'), 10);
    if (!Number.isNaN(effortMax)) listParams.effortMax = effortMax;

    const selectedIssueId = parseInt(paramsRoute.id, 10);
    if (!Number.isNaN(selectedIssueId)) {
      listParams.selectedId = selectedIssueId;
    }

    let page = parseInt(searchParams.get('page'), 10);
    if (Number.isNaN(page)) page = 1;
    listParams.page = page;

    const data = await fetchIssueList(listParams, showError);
    if (data) {
      setIssues(data.issueList.issues);
      setSelectedIssue(data.issue || null);
      setPages(data.issueList.pages || 1);
    }
    setLoading(false);
  }, [location.search, paramsRoute.id, showError]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  async function closeIssue(index) {
    const data = await closeIssueRequest(issues[index].id, showError);

    if (!data) {
      loadData();
      return;
    }

    const newList = [...issues];
    newList[index] = data.issueUpdate;
    setIssues(newList);
  }

  async function restoreIssue(id) {
    const data = await restoreIssueRequest(id, showError);

    if (data?.issueRestore) {
      showSuccess(`Issue ${id} restored successfully.`);
      loadData();
    }
  }

  async function deleteIssue(index) {
    const id = issues[index].id;
    const data = await deleteIssueRequest(id, showError);

    if (!data?.issueDelete) {
      loadData();
      return;
    }

    const newList = [...issues];
    if (location.pathname === `/issues/${id}`) navigate(`/issues${location.search}`);
    newList.splice(index, 1);
    setIssues(newList);
    showSuccess(<span>{`Deleted issue ${id} successfully. `}<Button onClick={() => restoreIssue(id)}>UNDO</Button></span>);
  }

  if (issues == null || loading) {
    return (
      <Box sx={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={34} />
      </Box>
    );
  }

  const searchParams = new URLSearchParams(location.search);
  let page = parseInt(searchParams.get('page'), 10);
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
              onChange={(_, nextPage) => {
                const nextSearchParams = new URLSearchParams(location.search);
                nextSearchParams.set('page', nextPage);
                navigate({ search: `?${nextSearchParams.toString()}` });
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
