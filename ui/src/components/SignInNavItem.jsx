import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import withToast from "../utils/withToast.jsx";

function SignInNavItem({ user, onUserChange, showError }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  function signInWithGoogle() {
    const apiEndpoint = import.meta.env.VITE_UI_AUTH_ENDPOINT || "/auth";
    window.location.assign(`${apiEndpoint}/google`);
  }

  async function signOut() {
    try {
      setSigningOut(true);
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
    } finally {
      setSigningOut(false);
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
          <MenuItem onClick={signOut} disabled={signingOut}>
            Sign out
          </MenuItem>
        </Menu>
      </>
    );
  }

  return (
    <Button
      color="inherit"
      startIcon={<GoogleIcon />}
      onClick={signInWithGoogle}
    >
      Sign in
    </Button>
  );
}

export default withToast(SignInNavItem);
