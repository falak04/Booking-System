import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip
} from "@mui/material";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function HODDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [newFaculty, setNewFaculty] = useState({ name: "", role: "Teacher" });
  const [openDialog, setOpenDialog] = useState(false);
  const [facultyToRemove, setFacultyToRemove] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  // const API=import.meta.env.REACT_APP_API_URL;
  const API="http://localhost:5000/api"
  useEffect(() => {
    if (!user?.token) return;

    axios
      .get(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${user.token.trim()}` },
      })
      .then((res) => {
        const approved = res.data.filter(b => b.status === "Approved by Admin");
        setBookings(approved);
      })
      .catch((err) => console.error("Error fetching bookings:", err));
  }, [user?.token]);

  useEffect(() => {
    if (!user?.token) return;
    fetchFacultyList();
  }, [user?.token]);

  const fetchFacultyList = () => {
    axios
      .get(`${API}/auth/faculty-list`, {
        headers: { Authorization: `Bearer ${user.token.trim()}` },
      })
      .then((res) => {
        setFacultyList(res.data.facultyList);
      })
      .catch((err) => console.error("Error fetching faculty list:", err));
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleGrant = async (id) => {
    try {
      await axios.put(
        `${API}/bookings/hod/grant/${id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token.trim()}` } }
      );
      setBookings(prev => prev.map(b => b._id === id ? { ...b, hodStatus: "Granted" } : b));
    } catch (err) {
      console.error("Grant Error:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(
        `${API}/bookings/hod/reject/${id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token.trim()}` } }
      );
      setBookings(prev => prev.map(b => b._id === id ? { ...b, hodStatus: "Rejected" } : b));
    } catch (err) {
      console.error("Reject Error:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFaculty({ ...newFaculty, [name]: value });
  };

  const handleAddFaculty = async () => {
    if (!newFaculty.name) {
      setSnackbar({ open: true, message: "Faculty name required", severity: "error" });
      return;
    }

    try {
      await axios.post(
        `${API}/auth/add-faculty`,
        newFaculty,
        {
          headers: { Authorization: `Bearer ${user.token.trim()}` },
        }
      );
      setNewFaculty({ name: "", role: "Teacher" });
      fetchFacultyList();
      setSnackbar({ open: true, message: "Faculty added", severity: "success" });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Error adding faculty",
        severity: "error",
      });
    }
  };

  const openRemoveDialog = (faculty) => {
    setFacultyToRemove(faculty);
    setOpenDialog(true);
  };

  const handleRemoveFaculty = async () => {
    if (!facultyToRemove) return;
    try {
      await axios.delete(`${API}/auth/remove-faculty`, {
        headers: { Authorization: `Bearer ${user.token.trim()}` },
        data: { name: facultyToRemove.name },
      });
      setOpenDialog(false);
      fetchFacultyList();
      setSnackbar({ open: true, message: "Faculty removed", severity: "success" });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Error removing faculty",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Navbar />
      <Container>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3, mt: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Bookings" />
            <Tab label="Faculty Management" />
          </Tabs>
        </Box>

        {/* Bookings Tab */}
        {currentTab === 0 && (
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Booking Requests
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Classroom</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b._id}>
                    <TableCell>{b.teacher.name}</TableCell>
                    <TableCell>{b.classroom}</TableCell>
                    <TableCell>{b.date}</TableCell>
                    <TableCell>{b.timeSlot}</TableCell>
                    <TableCell>{b.purpose}</TableCell>
                    <TableCell>{b.hodStatus}</TableCell>
                    <TableCell>
                      {b.hodStatus === "Pending" && (
                        <>
                          <Button color="primary" onClick={() => handleGrant(b._id)}>
                            Grant
                          </Button>
                          <Button color="secondary" onClick={() => handleReject(b._id)}>
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No booking requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* Faculty Management Tab */}
        {currentTab === 1 && (
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Faculty Management
            </Typography>

            {/* Add Faculty Form */}
            <Box sx={{ mb: 4, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Add New Faculty
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  name="name"
                  label="Faculty Name"
                  value={newFaculty.name}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 300 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Role</InputLabel>
                  <Select name="role" value={newFaculty.role} onChange={handleInputChange} label="Role">
                    <MenuItem value="Teacher">Teacher</MenuItem>
                    <MenuItem value="Lab Assistant">Lab Assistant</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" color="primary" onClick={handleAddFaculty}>
                  Add Faculty
                </Button>
              </Box>
            </Box>

            {/* Faculty List */}
            <Typography variant="h6" gutterBottom>
              Faculty List
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Registration Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {facultyList.map((faculty) => (
                  <TableRow key={faculty.name}>
                    <TableCell>{faculty.name}</TableCell>
                    <TableCell>{faculty.role}</TableCell>
                    <TableCell>
                      {faculty.isRegistered === true ? (
                        <Chip label="Registered" color="success" size="small" />
                      ) : (
                        <Chip label="Not Registered" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {faculty.role !== "HOD" && (
                        <Button color="error" onClick={() => openRemoveDialog(faculty)} size="small">
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Container>

      {/* Remove Faculty Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Removal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove {facultyToRemove?.name}?
            {facultyToRemove?.isRegistered && " This will also delete their user account."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleRemoveFaculty} color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default HODDashboard;
