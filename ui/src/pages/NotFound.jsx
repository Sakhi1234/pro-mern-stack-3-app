import { Paper, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Paper
      variant="outlined"
      sx={{ mt: 6, p: 4, textAlign: "center", borderRadius: 3 }}
    >
      <Typography variant="h4">Page Not Found</Typography>
      <Typography sx={{ mt: 1, color: "text.secondary" }}>
        Try going back to the issue list.
      </Typography>
    </Paper>
  );
}

NotFound.fetchData = async () => ({ status: 404 });
