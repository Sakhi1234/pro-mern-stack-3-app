import { useContext, useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { fetchAbout } from "../api/about.js";
import InitialDataContext from "../context/InitialDataContext.js";

export default function About() {
  const initialData = useContext(InitialDataContext);
  const [apiAbout, setApiAbout] = useState(initialData?.about ?? null);

  useEffect(() => {
    if (apiAbout != null) return undefined;
    const controller = new AbortController();
    fetchAbout(null, { signal: controller.signal }).then((data) => {
      if (data) setApiAbout(data.about || "");
    });
    return () => controller.abort();
  }, [apiAbout]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 4,
        mt: 4,
        borderRadius: 3,
        textAlign: "center",
        boxShadow: "0 8px 24px rgba(2, 8, 20, 0.05)",
      }}
    >
      <Typography variant="h5" sx={{ mb: 1 }}>
        Issue Tracker
      </Typography>
      <Typography variant="body1" sx={{ color: "text.secondary" }}>
        Version 0.9
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>
        {apiAbout}
      </Typography>
      <Box sx={{ mt: 2, color: "text.secondary" }}>
        Built with React, MUI, REST API, and MongoDB.
      </Box>
    </Paper>
  );
}

About.fetchData = async ({ get }) => {
  const data = await get("/api/about");
  if (typeof data.about !== "string") {
    throw new Error("Invalid SSR API response");
  }
  return { about: data.about };
};
