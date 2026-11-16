import { useContext, useEffect, useRef, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import IssueFilter from "../components/IssueFilter.jsx";
import withToast from "../utils/withToast.jsx";
import { fetchIssueReport, getReportParams } from "../api/reports.js";
import InitialDataContext from "../context/InitialDataContext.js";

const statuses = ["New", "Assigned", "Fixed", "Closed"];

function IssueReport({ showError }) {
  const location = useLocation();
  const initialData = useContext(InitialDataContext);
  const routeKey = `${location.pathname}${location.search}`;
  const bootstrap = initialData?.route === routeKey ? initialData : null;
  const initialRoute = useRef(bootstrap ? routeKey : null);
  const [stats, setStats] = useState(bootstrap?.issueCounts ?? null);

  useEffect(() => {
    if (initialRoute.current === routeKey) return undefined;
    initialRoute.current = null;
    const abortController = new AbortController();

    async function loadReportData() {
      const issueCounts = await fetchIssueReport(location.search, showError, {
        signal: abortController.signal,
      });
      if (issueCounts) setStats(issueCounts);
    }

    loadReportData();

    return () => {
      abortController.abort();
    };
  }, [routeKey, location.search, showError]);

  if (stats == null) return null;

  return (
    <>
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
          Filter Report
        </Typography>
        <IssueFilter urlBase="/report" />
      </Paper>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ mt: 2, borderRadius: 3, overflow: "hidden" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                "& .MuiTableCell-root": {
                  backgroundColor: "rgba(15, 118, 110, 0.06)",
                  fontWeight: 700,
                },
              }}
            >
              <TableCell />
              {statuses.map((status) => (
                <TableCell key={status}>{status}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map((counts) => (
              <TableRow key={counts.owner}>
                <TableCell>{counts.owner}</TableCell>
                {statuses.map((status) => (
                  <TableCell key={status}>{counts[status]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

IssueReport.fetchData = async ({ get, url }) => {
  const query = new URLSearchParams(getReportParams(url.search));
  const data = await get(`/api/issue-counts?${query}`);
  if (!Array.isArray(data.issueCounts)) {
    throw new Error("Invalid SSR API response");
  }
  return { issueCounts: data.issueCounts };
};

const IssueReportWithToast = withToast(IssueReport);
IssueReportWithToast.fetchData = IssueReport.fetchData;
export default IssueReportWithToast;
