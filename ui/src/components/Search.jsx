import { useEffect, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import { components } from "react-select";
import CloseIcon from "@mui/icons-material/Close";
import { Alert, Box, IconButton, Snackbar } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { searchIssues } from "../api/issues.js";

function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const debounceRef = useRef(null);

  function showError(message) {
    setToastMessage(message || "Something went wrong");
    setToastOpen(true);
  }

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function loadOptions(term, callback) {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (term.length < 3) {
      callback([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchIssues(term, showError)
        .then((data) => {
          callback(
            (data?.issueList?.issues || []).map((issue) => ({
              label: `#${issue.id}: ${issue.title}`,
              value: issue.id,
            })),
          );
        })
        .catch(() => callback([]));
    }, 3000);
  }

  function resetIssueList() {
    if (location.pathname.startsWith("/issues/")) {
      navigate(`/issues${location.search}`);
    }
  }

  return (
    <>
      <div style={{ minWidth: 260 }}>
        <AsyncSelect
          instanceId="issue-search"
          cacheOptions
          defaultOptions={[]}
          isClearable={false}
          inputValue={inputValue}
          loadOptions={loadOptions}
          components={{
            DropdownIndicator: () => null,
            IndicatorSeparator: null,
            IndicatorsContainer: (props) => (
              <components.IndicatorsContainer {...props}>
                {inputValue ? (
                  <Box sx={{ display: "flex", alignItems: "center", pr: 0.5 }}>
                    <IconButton
                      size="small"
                      sx={{ p: 0.3 }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setInputValue("");
                        resetIssueList();
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : null}
              </components.IndicatorsContainer>
            ),
          }}
          onChange={(option, actionMeta) => {
            if (option?.value) navigate(`/edit/${option.value}`);
            if (actionMeta?.action === "clear") resetIssueList();
          }}
          onInputChange={(inputValue, { action }) => {
            if (action === "input-change" && inputValue === "") {
              resetIssueList();
            }
            if (action === "clear") {
              setInputValue("");
              resetIssueList();
              return "";
            }
            if (action === "input-change") {
              setInputValue(inputValue);
            }
            return inputValue;
          }}
          placeholder="Search issues..."
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: 40,
              borderRadius: 12,
              borderColor: state.isFocused ? "#0f766e" : "#cbd5e1",
              boxShadow: state.isFocused
                ? "0 0 0 3px rgba(15,118,110,0.15)"
                : "none",
              "&:hover": { borderColor: "#0f766e" },
            }),
            menu: (base) => ({
              ...base,
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused ? "#ecfeff" : "#f8fafc",
              color: "#0f172a",
              fontSize: 14,
              fontWeight: 500,
            }),
            placeholder: (base) => ({
              ...base,
              color: "#64748b",
              fontSize: 14,
            }),
          }}
        />
      </div>
      <Snackbar
        open={toastOpen}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          severity="error"
          onClose={() => setToastOpen(false)}
          sx={{ width: "100%" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Search;
