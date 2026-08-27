import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { createIssue, fetchIssue, updateIssue } from "../api/issues.js";
import {
  daysFromNow,
  formatDateForDisplay,
} from "../utils/DateUtils.js";
import NumInput from "../components/NumInput.jsx";
import DateInput from "../components/DateInput.jsx";
import TextInput from "../components/TextInput.jsx";
import IssueComments from "../components/IssueComments.jsx";
import withToast from "../utils/withToast.jsx";
import UserContext from "../context/UserContext.js";

const VALID_STATUSES = ["New", "Assigned", "Fixed", "Closed"];

function normalizeStatus(value) {
  if (typeof value === "string" && VALID_STATUSES.includes(value)) return value;
  return "New";
}

function normalizeIssue(issue) {
  if (!issue || typeof issue !== "object") return issue;
  return { ...issue, status: normalizeStatus(issue.status) };
}

function IssueEdit({ showSuccess, showError }) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const isCreateMode = routeId == null;
  const [issue, setIssue] = useState(null);
  const [invalidFields, setInvalidFields] = useState({});
  const [showingValidation, setShowingValidation] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      await Promise.resolve();
      if (ignore) return;

      setLoading(true);
      if (isCreateMode) {
        setIssue({
          status: "New",
          owner: "",
          effort: null,
          due: daysFromNow(10),
          title: "",
          description: "",
          created: new Date(),
        });
        setInvalidFields({});
        setLoading(false);
        return;
      }

      const data = await fetchIssue(routeId, showError);
      if (ignore) return;

      setIssue(data ? normalizeIssue(data.issue) : {});
      setInvalidFields({});
      setLoading(false);
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [isCreateMode, routeId, showError]);

  function onChange(event, naturalValue) {
    const { name, value } = event.target;
    const isMuiSelectChild =
      naturalValue &&
      typeof naturalValue === "object" &&
      "props" in naturalValue;
    const changedValue =
      naturalValue === undefined || isMuiSelectChild ? value : naturalValue;
    setIssue((prev) => ({ ...prev, [name]: changedValue }));
  }

  function onValidityChange(event, valid) {
    const { name } = event.target;
    setInvalidFields((prev) => {
      const updated = { ...prev, [name]: !valid };
      if (valid) delete updated[name];
      return updated;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setShowingValidation(true);
    if (Object.keys(invalidFields).length) return;

    const changes = {
      status: normalizeStatus(issue.status),
      owner: issue.owner,
      effort: issue.effort,
      due: issue.due,
      title: issue.title,
      description: issue.description,
    };
    if (isCreateMode) {
      const createPayload = {
        status: normalizeStatus(issue.status),
        owner: issue.owner,
        effort: issue.effort,
        title: issue.title,
        due: issue.due,
        description: issue.description,
      };
      createIssue(createPayload, showError).then((data) => {
        if (data?.issueAdd?.id) {
          showSuccess("Created issue successfully");
          navigate(`/edit/${data.issueAdd.id}`);
        }
      });
      return;
    }

    const id = issue.id;
    updateIssue(id, changes, showError).then((data) => {
      if (data) {
        setIssue(normalizeIssue(data.issueUpdate));
        showSuccess("Updated issue successfully");
      }
    });
  }

  if (issue == null || loading) {
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
  if (!isCreateMode && issue.id == null)
    return (
      <Typography variant="h6">{`Issue with ID ${routeId} not found.`}</Typography>
    );

  return (
    <Paper variant="outlined" sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {isCreateMode ? "Create Issue" : `Editing issue: ${issue.id}`}
      </Typography>
      {!isCreateMode && !user.signedIn ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Sign in to edit the description, add or edit comments, or take actions on this issue.
        </Alert>
      ) : null}
      <Box
        component="form"
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 14 }}
      >
        <TextField
          label="Created"
          size="small"
          value={formatDateForDisplay(issue.created)}
          disabled
        />
        <TextField
          select
          label="Status"
          size="small"
          name="status"
          value={normalizeStatus(issue.status)}
          onChange={onChange}
        >
          <MenuItem value="New">New</MenuItem>
          <MenuItem value="Assigned">Assigned</MenuItem>
          <MenuItem value="Fixed">Fixed</MenuItem>
          <MenuItem value="Closed">Closed</MenuItem>
        </TextField>
        <TextInput
          key={`owner:${issue.id || "new"}:${issue.owner || ""}`}
          label="Owner"
          name="owner"
          value={issue.owner}
          onChange={onChange}
        />
        <NumInput
          key={`effort:${issue.id || "new"}:${issue.effort ?? ""}`}
          label="Effort in days"
          name="effort"
          value={issue.effort}
          onChange={onChange}
        />
        <DateInput
          key={`due:${issue.id || "new"}:${issue.due || ""}`}
          label="Due"
          name="due"
          value={issue.due}
          onChange={onChange}
          onValidityChange={onValidityChange}
        />
        <TextInput
          key={`title:${issue.id || "new"}:${issue.title || ""}`}
          label="Title"
          name="title"
          value={issue.title}
          onChange={onChange}
        />
        <TextInput
          key={`description:${issue.id || "new"}:${issue.description || ""}`}
          label="Description"
          multiline
          rows={8}
          name="description"
          value={issue.description}
          onChange={onChange}
        />
        {Object.keys(invalidFields).length > 0 && showingValidation ? (
          <Alert severity="error">
            Please correct invalid fields before submitting.
          </Alert>
        ) : null}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button disabled={!user.signedIn} type="submit" variant="contained">
            Submit
          </Button>
          <Button variant="outlined" onClick={() => navigate("/issues")}>
            Back
          </Button>
        </Box>
      </Box>
      {!isCreateMode ? <IssueComments issue={issue} showError={showError} showSuccess={showSuccess} /> : null}
      {!isCreateMode ? (
        <Box sx={{ mt: 2 }}>
          <Link to={`/edit/${issue.id - 1}`}>Prev</Link>
          {" | "}
          <Link to={`/edit/${issue.id + 1}`}>Next</Link>
        </Box>
      ) : null}
    </Paper>
  );
}

export default withToast(IssueEdit);
