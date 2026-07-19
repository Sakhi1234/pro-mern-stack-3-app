import { useState } from "react";
import {
  Alert,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import withToast from "../utils/withToast.jsx";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const AUTH_MODES = {
  signIn: "signIn",
  signUp: "signUp",
};

function isValidEmail(email) {
  const value = (email || "").trim();
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function SigninNavItem({ user, onUserChange, showError }) {
  const [showing, setShowing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [mode, setMode] = useState(AUTH_MODES.signIn);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function resetDialog(nextMode = AUTH_MODES.signIn) {
    setMode(nextMode);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setDialogError("");
    setSubmitted(false);
  }

  function openDialog(nextMode = AUTH_MODES.signIn) {
    resetDialog(nextMode);
    setShowing(true);
  }

  function closeDialog() {
    setShowing(false);
  }

  function updateField(field) {
    return (e) => {
      const { value } = e.target;
      if (dialogError) setDialogError("");
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function requestAuth(path, payload) {
    const apiEndpoint = import.meta.env.VITE_UI_AUTH_ENDPOINT || "/auth";
    const response = await fetch(`${apiEndpoint}/${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let result;
    try {
      result = raw ? JSON.parse(raw) : {};
    } catch {
      result = {};
    }

    if (!response.ok) {
      throw new Error(
        result.error || result.message || raw || "Request failed",
      );
    }

    return result;
  }

  async function submitSignIn() {
    setSubmitted(true);
    if (!form.email.trim()) {
      setDialogError("Email is required.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setDialogError("Please enter a valid email address.");
      return;
    }
    if (!form.password) {
      setDialogError("Password is required.");
      return;
    }

    try {
      setSubmitting(true);
      setDialogError("");
      const result = await requestAuth("signin", {
        email: form.email,
        password: form.password,
      });

      onUserChange({
        signedIn: result.signedIn,
        givenName: result.givenName,
        name: result.name,
        email: result.email,
      });
      closeDialog();
    } catch (error) {
      setDialogError(error.message || "Error signing into the app");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitSignUp() {
    setSubmitted(true);
    if (!form.name.trim()) {
      setDialogError("Please enter your name.");
      return;
    }
    if (!form.email.trim()) {
      setDialogError("Email is required.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setDialogError("Please enter a valid email address.");
      return;
    }
    if (!form.password) {
      setDialogError("Password is required.");
      return;
    }
    if (!form.confirmPassword) {
      setDialogError("Please confirm your password.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setDialogError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setDialogError("");
      const result = await requestAuth("signup", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      onUserChange({
        signedIn: result.signedIn,
        givenName: result.givenName,
        name: result.name,
        email: result.email,
      });
      closeDialog();
    } catch (error) {
      setDialogError(error.message || "Error creating account");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    try {
      const apiEndpoint = import.meta.env.VITE_UI_AUTH_ENDPOINT || "/auth";

      await fetch(`${apiEndpoint}/signout`, {
        method: "POST",
        credentials: "include",
      });
      onUserChange({
        signedIn: false,
        givenName: "",
        name: "",
        email: "",
      });

      setMenuAnchor(null);
    } catch (error) {
      showError(`Error signing out: ${error}`);
    }
  }

  if (user.signedIn) {
    return (
      <>
        <Button color="inherit" onClick={(e) => setMenuAnchor(e.currentTarget)}>
          {user.givenName}
        </Button>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={signOut}>Sign out</MenuItem>
        </Menu>
      </>
    );
  }

  const isSignIn = mode === AUTH_MODES.signIn;
  const canSubmit = Boolean(
    !submitting &&
    form.email.trim() &&
    form.password &&
    (isSignIn || (form.name.trim() && form.confirmPassword)),
  );

  return (
    <>
      <Button color="inherit" onClick={() => openDialog(AUTH_MODES.signIn)}>
        Sign in
      </Button>

      <Dialog open={showing} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isSignIn ? "Sign in" : "Create account"}</DialogTitle>

        <DialogContent>
          {dialogError ? (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {dialogError}
            </Alert>
          ) : null}
          <Typography sx={{ color: "text.secondary", fontSize: 13, mb: 1.5 }}>
            {isSignIn
              ? "Use your email and password to continue."
              : "Create a simple account with your name, email, and password."}
          </Typography>

          {!isSignIn ? (
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              label="Name"
              value={form.name}
              onChange={updateField("name")}
              disabled={submitting}
            />
          ) : null}

          <TextField
            autoFocus={isSignIn}
            fullWidth
            margin="dense"
            label="Email"
            type="email"
            value={form.email}
            onChange={updateField("email")}
            disabled={submitting}
            error={submitted && !!form.email && !isValidEmail(form.email)}
            helperText={
              submitted && !form.email.trim()
                ? "Email is required."
                : submitted && !isValidEmail(form.email)
                  ? "Enter a valid email like name@example.com."
                  : null
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={updateField("password")}
            disabled={submitting}
            helperText={isSignIn ? null : "Must be at least 6 characters long."}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={submitting}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {!isSignIn ? (
            <TextField
              fullWidth
              margin="dense"
              label="Confirm password"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={updateField("confirmPassword")}
              disabled={submitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      disabled={submitting}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          ) : null}

          <Button
            fullWidth
            variant="contained"
            onClick={isSignIn ? submitSignIn : submitSignUp}
            disabled={!canSubmit}
            sx={{ mt: 2 }}
          >
            {submitting
              ? isSignIn
                ? "Signing in..."
                : "Creating account..."
              : isSignIn
                ? "Sign in"
                : "Create account"}
          </Button>

          <Button
            variant="text"
            onClick={() => resetDialog(isSignIn ? AUTH_MODES.signUp : AUTH_MODES.signIn)}
            disabled={submitting}
            sx={{ mt: 1 }}
          >
            {isSignIn
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </Button>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog} disabled={submitting}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default withToast(SigninNavItem);
