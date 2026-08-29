import { useState } from "react";
import { Box, Button, MenuItem, TextField } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { isIntegerText } from "../utils/InputUtils.js";
import { toQuery } from "../utils/restFetch.js";

export default function IssueFilter({ urlBase }) {
  const location = useLocation();
  return (
    <IssueFilterContent
      key={location.search}
      urlBase={urlBase}
      location={location}
    />
  );
}

function IssueFilterContent({ urlBase, location }) {
  const navigate = useNavigate();
  const currentSearchParams = new URLSearchParams(location.search);
  const [status, setStatus] = useState(currentSearchParams.get("status") || "");
  const [effortMin, setEffortMin] = useState(
    currentSearchParams.get("effortMin") || "",
  );
  const [effortMax, setEffortMax] = useState(
    currentSearchParams.get("effortMax") || "",
  );
  const [changed, setChanged] = useState(false);

  const hasActiveFilters = Boolean(status || effortMin || effortMax);

  function applyFilter() {
    const nextSearchParams = new URLSearchParams();
    if (status) nextSearchParams.set("status", status);
    if (effortMin) nextSearchParams.set("effortMin", effortMin);
    if (effortMax) nextSearchParams.set("effortMax", effortMax);
    const search = toQuery(Object.fromEntries(nextSearchParams));
    navigate({ pathname: urlBase, search });
  }

  function resetFilter() {
    setStatus("");
    setEffortMin("");
    setEffortMax("");
    setChanged(false);
    navigate({ pathname: urlBase, search: "" });
  }

  return (
    <Box
      sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}
    >
      <TextField
        select
        size="small"
        label="Status"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setChanged(true);
        }}
        sx={{ minWidth: 170 }}
      >
        <MenuItem value="">(All)</MenuItem>
        <MenuItem value="New">New</MenuItem>
        <MenuItem value="Assigned">Assigned</MenuItem>
        <MenuItem value="Fixed">Fixed</MenuItem>
        <MenuItem value="Closed">Closed</MenuItem>
      </TextField>
      <TextField
        size="small"
        label="Effort Min (days)"
        value={effortMin}
        onChange={(e) => {
          if (isIntegerText(e.target.value)) {
            setEffortMin(e.target.value);
            setChanged(true);
          }
        }}
        sx={{ minWidth: 150 }}
      />
      <TextField
        size="small"
        label="Effort Max (days)"
        value={effortMax}
        onChange={(e) => {
          if (isIntegerText(e.target.value)) {
            setEffortMax(e.target.value);
            setChanged(true);
          }
        }}
        sx={{ minWidth: 150 }}
      />
      <Button
        variant="contained"
        onClick={applyFilter}
        sx={{ textTransform: "none", borderRadius: 2.5, px: 2.2 }}
      >
        Apply
      </Button>
      <Button
        variant="outlined"
        disabled={!changed && !hasActiveFilters}
        onClick={resetFilter}
        sx={{ textTransform: "none", borderRadius: 2.5 }}
      >
        Reset
      </Button>
    </Box>
  );
}
