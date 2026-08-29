import { Button, Tooltip } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useNavigate } from "react-router-dom";

function IssueAddNavItem({ user }) {
  const navigate = useNavigate();
  const tooltipTitle = user.signedIn
    ? "Create a new issue"
    : "Sign in to create an issue";

  return (
    <Tooltip title={tooltipTitle} arrow>
      <span>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddCircleOutlineIcon />}
          disabled={!user.signedIn}
          onClick={() => navigate("/create")}
          sx={{
            textTransform: "none",
            borderRadius: 2.5,
            px: 2,
            fontWeight: 700,
            boxShadow: "0 10px 24px rgba(245, 158, 11, 0.28)",
            whiteSpace: "nowrap",
            "&.Mui-disabled": {
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              color: "rgba(255, 255, 255, 0.78)",
              boxShadow: "none",
              border: "1px solid rgba(255, 255, 255, 0.18)",
            },
            "&.Mui-disabled .MuiButton-startIcon": {
              color: "rgba(255, 255, 255, 0.78)",
            },
          }}
        >
          Create Issue
        </Button>
      </span>
    </Tooltip>
  );
}

export default IssueAddNavItem;
