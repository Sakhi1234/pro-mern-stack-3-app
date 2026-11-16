import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Chip, IconButton, TableCell, TableRow, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import UserContext from "../context/UserContext.js";
import { formatIssueDateForDisplay } from "../utils/DateUtils.js";
import useTimeZone from "../hooks/useTimeZone.js";

function statusColor(status) {
  if (status === "New") return "default";
  if (status === "Assigned") return "info";
  if (status === "Fixed") return "success";
  if (status === "Closed") return "warning";
  return "default";
}

export default function IssueRow({ issue, index, closeIssue, deleteIssue }) {
  const timeZone = useTimeZone();
  const user = useContext(UserContext);
  const disabled = !user.signedIn;
  const location = useLocation();
  const navigate = useNavigate();

  const onRowClick = () => navigate(`/issues/${issue.id}${location.search}`);

  return (
    <TableRow
      hover
      onClick={onRowClick}
      sx={{
        cursor: "pointer",
        "&:last-child td": { borderBottom: 0 },
      }}
    >
      <TableCell>{issue.id}</TableCell>
      <TableCell>
        {issue.status ? (
          <Chip
            label={issue.status}
            color={statusColor(issue.status)}
            size="small"
            variant="outlined"
          />
        ) : null}
      </TableCell>
      <TableCell>{issue.owner}</TableCell>
      <TableCell>{formatIssueDateForDisplay(issue.created, timeZone)}</TableCell>
      <TableCell>{issue.effort}</TableCell>
      <TableCell>{formatIssueDateForDisplay(issue.due)}</TableCell>
      <TableCell>{issue.title}</TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Tooltip title="Edit Issue">
          <IconButton component={Link} to={`/edit/${issue.id}`} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Close Issue">
          <span>
            <IconButton
              size="small"
              disabled={disabled}
              onClick={() => closeIssue(index)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Delete Issue">
          <span>
            <IconButton
              size="small"
              disabled={disabled}
              onClick={() => deleteIssue(index)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
