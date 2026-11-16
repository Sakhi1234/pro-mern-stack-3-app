import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Pagination,
  Typography,
  Tooltip,
} from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import IssueFilter from "../components/IssueFilter.jsx";
import IssueTable from "../components/IssueTable.jsx";
import IssueDetail from "../components/IssueDetail.jsx";
import {
  closeIssueRequest,
  deleteIssueRequest,
  fetchIssueListPage,
  getIssueListParams,
  restoreIssueRequest,
} from "../api/issues.js";
import withToast from "../utils/withToast.jsx";
import UserContext from "../context/UserContext.js";
import InitialDataContext from "../context/InitialDataContext.js";
import { loadIssue } from "../utils/ssrApi.js";

const SECTION_SIZE = 5;

function IssueList({ showError, showSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();
  const paramsRoute = useParams();
  const user = useContext(UserContext);
  const initialData = useContext(InitialDataContext);
  const routeKey = `${location.pathname}${location.search}`;
  const bootstrap = initialData?.route === routeKey ? initialData : null;
  const initialRoute = useRef(bootstrap ? routeKey : null);
  const isIssueDetailRoute = paramsRoute.id != null;
  const [issues, setIssues] = useState(bootstrap?.issueList?.issues ?? null);
  const [selectedIssue, setSelectedIssue] = useState(bootstrap?.issue ?? null);
  const [pages, setPages] = useState(bootstrap?.issueList?.pages || 1);
  const [loadedRoute, setLoadedRoute] = useState(bootstrap ? routeKey : null);

  useEffect(() => {
    const createdIssueId = location.state?.createdIssueId;
    if (createdIssueId !== Number(paramsRoute.id)) return;

    showSuccess(`Issue #${createdIssueId} created successfully.`);
    // Consume the confirmation so refresh and browser Back do not replay it.
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: null,
    });
  }, [location, navigate, paramsRoute.id, showSuccess]);

  const applyIssueListData = useCallback(
    (data) => {
      setIssues(data.issueList.issues);
      setSelectedIssue(data.issue || null);
      setPages(data.issueList.pages || 1);
      setLoadedRoute(routeKey);
    },
    [routeKey],
  );

  const loadData = useCallback(async () => {
    const data = await fetchIssueListPage(
      location.search,
      paramsRoute.id,
      showError,
    );
    if (data) applyIssueListData(data);
  }, [location.search, paramsRoute.id, showError, applyIssueListData]);

  useEffect(() => {
    // Keep skipping the initial request through StrictMode's effect replay.
    // Once the URL changes, always fetch afresh (including browser Back).
    if (initialRoute.current === routeKey) return undefined;
    initialRoute.current = null;
    const abortController = new AbortController();

    async function loadIssueList() {
      const data = await fetchIssueListPage(
        location.search,
        paramsRoute.id,
        showError,
        { signal: abortController.signal },
      );
      if (data) applyIssueListData(data);
    }

    loadIssueList();

    return () => {
      abortController.abort();
    };
  }, [
    routeKey,
    location.search,
    paramsRoute.id,
    showError,
    applyIssueListData,
  ]);

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
    if (location.pathname === `/issues/${id}`)
      navigate(`/issues${location.search}`);
    newList.splice(index, 1);
    setIssues(newList);
    showSuccess(
      <span>
        {`Deleted issue ${id} successfully. `}
        <Button onClick={() => restoreIssue(id)}>UNDO</Button>
      </span>,
    );
  }

  if (issues == null || (isIssueDetailRoute && loadedRoute !== routeKey)) {
    return (
      <Box
        sx={{
          minHeight: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={34} />
      </Box>
    );
  }

  if (isIssueDetailRoute && !selectedIssue) {
    return (
      <Typography variant="h6">{`Issue with ID ${paramsRoute.id} not found.`}</Typography>
    );
  }

  const searchParams = new URLSearchParams(location.search);
  let page = parseInt(searchParams.get("page"), 10);
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
              boxShadow: "0 8px 24px rgba(2, 8, 20, 0.05)",
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(15,118,110,0.06))",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  Create a new issue
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                  Capture a bug, task, or idea in a fresh issue and keep the
                  discussion in one place.
                </Typography>
              </Box>
              <Tooltip
                title={
                  user.signedIn
                    ? "Create a new issue"
                    : "Sign in to create an issue"
                }
                arrow
              >
                <span>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate("/create")}
                    disabled={!user.signedIn}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2.5,
                      px: 2.4,
                      fontWeight: 700,
                      boxShadow: "0 10px 24px rgba(245, 158, 11, 0.28)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Create Issue
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Paper>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              mt: 1,
              borderRadius: 3,
              boxShadow: "0 8px 24px rgba(2, 8, 20, 0.05)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Filter Issues
            </Typography>
            <IssueFilter urlBase="/issues" />
          </Paper>
          <IssueTable
            issues={issues}
            closeIssue={closeIssue}
            deleteIssue={deleteIssue}
          />
        </>
      ) : null}
      <IssueDetail
        issue={selectedIssue}
        showError={showError}
        showSuccess={showSuccess}
      />
      {!isIssueDetailRoute ? (
        <>
          <Box sx={{ mt: 2.5, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={Math.max(1, pages)}
              page={page}
              onChange={(_, nextPage) => {
                const nextSearchParams = new URLSearchParams(location.search);
                nextSearchParams.set("page", nextPage);
                navigate({ search: `?${nextSearchParams.toString()}` });
              }}
            />
          </Box>
          <Typography
            sx={{
              mt: 1,
              textAlign: "center",
              color: "text.secondary",
              fontSize: 13,
            }}
          >{`Section ${startPage}-${Math.min(endPage, pages)}`}</Typography>
        </>
      ) : null}
    </>
  );
}

IssueList.fetchData = async ({ get, url, params }) => {
  if (params.id != null) {
    return {
      ...(await loadIssue(get, params.id)),
      // The detail view does not display or fetch the issue list.
      issueList: { issues: [], pages: 0 },
    };
  }

  const query = new URLSearchParams(getIssueListParams(url.search));
  const data = await get(`/api/issues?${query}`);
  if (
    !Array.isArray(data.issueList?.issues) ||
    !Number.isInteger(data.issueList.pages) ||
    data.issueList.pages < 0
  ) {
    throw new Error("Invalid SSR API response");
  }
  return { issueList: data.issueList, issue: null };
};

const IssueListWithToast = withToast(IssueList);
IssueListWithToast.fetchData = IssueList.fetchData;
export default IssueListWithToast;
