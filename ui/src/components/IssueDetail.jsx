import { useContext, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { generateIssueSummary, updateIssue } from "../api/issues.js";
import UserContext from "../context/UserContext.js";
import IssueComments from "./IssueComments.jsx";

export default function IssueDetail({ issue, showError, showSuccess }) {
  if (!issue) return null;

  return (
    <IssueDetailContent
      key={`${issue.id}:${issue.description || ""}`}
      issue={issue}
      showError={showError}
      showSuccess={showSuccess}
    />
  );
}

function IssueDetailContent({ issue, showError, showSuccess }) {
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [descriptionText, setDescriptionText] = useState(
    issue?.description || "",
  );
  async function generateSummary() {
    setLoadingSummary(true);
    const data = await generateIssueSummary(issue.id, showError);
    setLoadingSummary(false);

    if (data?.aiSummary) {
      setAiSummary(data.aiSummary);
      showSuccess("AI summary generated.");
    }
  }

  async function saveDescription() {
    try {
      setSavingDescription(true);
      const data = await updateIssue(
        issue.id,
        { description: descriptionText },
        showError,
      );

      if (data?.issueUpdate) {
        setDescriptionText(data.issueUpdate.description || "");
        setEditingDescription(false);
        setAiSummary(null);
        showSuccess("Description updated successfully.");
      }
    } finally {
      setSavingDescription(false);
    }
  }

  return (
    <>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ letterSpacing: 1.4, color: "text.secondary" }}
          >
            Issue No
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            {`#${issue.id}`}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate("/issues")}>
          Back to Issues
        </Button>
      </Box>
      <Alert severity={user.signedIn ? "success" : "info"} sx={{ mt: 2 }}>
        {user.signedIn
          ? "You can edit the description, add or edit comments, and take actions on this issue."
          : "Sign in to edit the description, add or edit comments, or take actions on this issue."}
      </Alert>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mt: 2,
          borderRadius: 3,
          boxShadow: "0 8px 24px rgba(2, 8, 20, 0.05)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h6">AI Summary</Typography>
          <Button
            variant="outlined"
            onClick={generateSummary}
            disabled={loadingSummary}
          >
            {loadingSummary ? "Summarizing..." : "Summarize with AI"}
          </Button>
        </Box>
        <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 14 }}>
          Anyone can generate a concise summary of this issue and its
          discussion.
        </Typography>
        {aiSummary ? (
          <Box sx={{ mt: 1.5, display: "grid", gap: 1.2 }}>
            <Typography
              sx={{
                whiteSpace: "pre-wrap",
                color: "text.primary",
                fontSize: 14,
              }}
            >
              {aiSummary.summary || "No summary returned."}
            </Typography>
            {aiSummary.highlights?.length ? (
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 0.75, fontSize: 13 }}>
                  Highlights
                </Typography>
                <Box
                  component="ul"
                  sx={{ m: 0, pl: 2.5, color: "text.secondary", fontSize: 13 }}
                >
                  {aiSummary.highlights.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </Box>
              </Box>
            ) : null}
            {aiSummary.nextSteps?.length ? (
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 0.75, fontSize: 13 }}>
                  Next Steps
                </Typography>
                <Box
                  component="ul"
                  sx={{ m: 0, pl: 2.5, color: "text.secondary", fontSize: 13 }}
                >
                  {aiSummary.nextSteps.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </Box>
              </Box>
            ) : null}
          </Box>
        ) : null}
      </Paper>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mt: 2,
          borderRadius: 3,
          boxShadow: "0 8px 24px rgba(2, 8, 20, 0.05)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
            mb: 1,
          }}
        >
          <Typography variant="h6">Description</Typography>
          {user.signedIn ? (
            editingDescription ? (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  onClick={saveDescription}
                  disabled={savingDescription}
                >
                  {savingDescription ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setDescriptionText(issue.description || "");
                    setEditingDescription(false);
                  }}
                  disabled={savingDescription}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                onClick={() => setEditingDescription(true)}
              >
                Edit Description
              </Button>
            )
          ) : null}
        </Box>
        {editingDescription ? (
          <TextField
            multiline
            minRows={5}
            fullWidth
            value={descriptionText}
            onChange={(e) => setDescriptionText(e.target.value)}
            disabled={savingDescription}
            placeholder="Write a clear issue description..."
          />
        ) : (
          <Box
            component="pre"
            sx={{
              whiteSpace: "pre-wrap",
              margin: 0,
              color: "text.secondary",
              fontSize: 14,
            }}
          >
            {descriptionText || "No description provided."}
          </Box>
        )}
      </Paper>
      <IssueComments
        issue={issue}
        showError={showError}
        showSuccess={showSuccess}
        onCommentsChange={() => setAiSummary(null)}
      />
    </>
  );
}
