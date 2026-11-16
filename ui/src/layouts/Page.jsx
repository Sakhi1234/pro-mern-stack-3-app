import { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Link } from "react-router-dom";
import Contents from "./Contents.jsx";
import IssueAddNavItem from "../components/IssueAddNavItem.jsx";
import SignInNavItem from "../components/SignInNavItem.jsx";
import Search from "../components/Search.jsx";
import UserContext from "../context/UserContext.js";
import { fetchCurrentUser } from "../api/auth.js";

export default function Page({ initialUser }) {
  const [user, setUser] = useState(initialUser ?? null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    if (initialUser != null) return undefined;
    const abortController = new AbortController();

    async function loadCurrentUser() {
      const data = await fetchCurrentUser(null, {
        signal: abortController.signal,
      });

      if (data) {
        setUser(
          data.user || {
            signedIn: false,
            givenName: "",
            name: "",
            email: "",
          },
        );
      }
    }

    loadCurrentUser();

    return () => {
      abortController.abort();
    };
  }, [initialUser]);

  if (user == null) return null;

  return (
    <Box>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backdropFilter: "blur(10px)",
          background: "rgba(15, 23, 42, 0.82)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Toolbar sx={{ gap: 1.5, display: "flex", flexWrap: "wrap", py: 0.5 }}>
          <Typography variant="h6" sx={{ mr: 1.5 }}>
            Issue Tracker
          </Typography>
          <Button
            color="inherit"
            component={Link}
            to="/issues"
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Issue List
          </Button>
          <Box sx={{ flexGrow: 1, minWidth: 260 }}>
            <Search />
          </Box>
          <IssueAddNavItem user={user} />
          <SignInNavItem user={user} onUserChange={setUser} />
          <IconButton
            color="inherit"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem
              component={Link}
              to="/about"
              onClick={() => setMenuAnchor(null)}
            >
              About
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <UserContext.Provider value={user}>
          <Contents />
        </UserContext.Provider>
      </Container>
      <Box
        component="footer"
        sx={{ mt: 5, mb: 2, textAlign: "center", color: "text.secondary" }}
      >
        <Typography variant="body2">
          Full source code available at this{" "}
          <a href="https://github.com/vasansr/pro-mern-stack-2">
            GitHub repository
          </a>
        </Typography>
      </Box>
    </Box>
  );
}

Page.fetchData = async ({ get }) => {
  const data = await get("/api/user");
  if (typeof data.user?.signedIn !== "boolean") {
    throw new Error("Invalid SSR API response");
  }
  // Whitelist only public UI fields; never serialize authentication tokens.
  const { signedIn, givenName = "", name = "", email = "" } = data.user;
  return { signedIn, givenName, name, email };
};
