import React from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Button } from "@mui/material";
import Requests from "./Requests";
import CreateBooking from "./CreateBooking";
import ViewTimetable from "./ViewTimetable"; // Import the ViewTimetable component
import { useAuth } from "../context/AuthContext";

function TeacherDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Navbar */}
      <AppBar position="fixed" style={{ top: 0, zIndex: 1000 }}>
        <Toolbar style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <Button color="inherit" component={Link} to="/teacher-dashboard">
              Requests
            </Button>
            <Button color="inherit" component={Link} to="/teacher-dashboard/create">
              Create Booking
            </Button>
            <Button color="inherit" component={Link} to="/view-timetable">
              View Timetable
            </Button>
          </div>
          <Button color="inherit" onClick={logout}>
            LOGOUT
          </Button>
        </Toolbar>
      </AppBar>

      {/* Page Content */}
      <div style={{ marginTop: "80px", padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Requests />} />
          <Route path="/create" element={<CreateBooking />} />
          <Route path="/view-timetable" element={<ViewTimetable />} />
        </Routes>
      </div>
    </>
  );
}

export default TeacherDashboard;
