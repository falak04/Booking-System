import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

function Navbar({ title }) {
  const { logout } = useAuth();

  return (
    <AppBar position="fixed" style={{ top: 0, zIndex: 1000 }}>
      <Toolbar style={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">{title}</Typography>

        <div>
          <Button color="inherit" component={Link} to="/view-timetable">
            View Timetable
          </Button>
          <Button color="inherit" onClick={logout}>
            LOGOUT
          </Button>
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
