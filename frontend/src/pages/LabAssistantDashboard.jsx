import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, 
  Button, Select, MenuItem, FormControl 
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import PrintTimeTable from "../components/PrintTimeTable";

// Define faculty names for dropdown
const facultyNames = [
  "Dr. Vinaya Sawant (VS)", "Dr. Abhijit Joshi (ARJ)", "Dr. Ram Mangulkar (RM)", 
  "Dr. SatishKumar Verma (SV)", "Dr. Monika Mangla (MM)", "Ms. Neha Katre (NK)", 
  "Mr. Harshal Dalvi (HD)", "Mr. Arjun Jaiswal (AJ)", "Ms. Stevina Coriea (SC)", 
  "Ms. Prachi Satam (PS)", "Ms. Neha Agarwal (NA)", "Ms. Sharvari Patil (SP)", 
  "Ms. Richa Sharma (RS)", "Ms. Sweedle Machado (SM)", "Ms. Priyanca Gonsalves (PG)", 
  "Ms. Anushree Patkar (AP)", "Ms. Monali Sankhe (MS)", "Ms. Savyasachi Pandit (SSP)", 
  "Mr. Chandrashekhar Badgujar (CB)", "Mr. Suryakant Chaudhari (STC)", "Dr. Gayatri Pandya (GP)", 
  "Dr. Naresh Afre (NAF)", "Mr. Pravin Hole (PH)", "Ms. Leena Sahu (LS)"
];

const subjectOptions = [
  "BDA", "AM", "FLAT", "DAA", "ML", "SE", "IPCV", "ISIG", "DP", "EFM", "PA", "OE", "AM-T", "FLAT-T"
];

function LabAssistantDashboard() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [editEntries, setEditEntries] = useState({});
  const navigate = useNavigate();

  // Fetch rooms on load
  useEffect(() => {
    axios.get("http://localhost:5000/api/rooms")
      .then(response => setRooms(response.data))
      .catch(error => console.error("Error fetching rooms:", error));
  }, []);

  // Fetch timetable data for the selected room
  const fetchTimetable = async () => {
    if (!selectedRoom) {
      alert("Please select a room first!");
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/api/rooms/${selectedRoom}/timetable`);
      setTimetable(response.data.timetable || []);
    } catch (error) {
      console.error("Error fetching timetable:", error);
      alert("Failed to load timetable. Please try again.");
    }
  };

  // Update a timetable entry
  const handleUpdateTimetableEntry = async (roomName, entryId) => {
    try {
      const updatedEntry = editEntries[entryId] || {}; 
      const currentEntry = timetable.find(entry => entry._id === entryId); 

      if (!currentEntry) {
        alert("Timetable entry not found.");
        return;
      }

      const updatedSubject = updatedEntry.subject ?? currentEntry.subject;
      const updatedFaculty = updatedEntry.faculty ?? currentEntry.faculty; // Now an array

      await axios.put(
        `http://localhost:5000/api/rooms/${roomName}/schedule/${entryId}`,
        { subject: updatedSubject, faculty: updatedFaculty },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Update local state
      setTimetable(timetable.map(entry => 
        entry._id === entryId 
          ? { ...entry, subject: updatedSubject, faculty: updatedFaculty }
          : entry
      ));

      alert("Timetable updated successfully!");
    } catch (error) {
      console.error("Error updating timetable entry:", error.response?.data || error.message);
      alert("Failed to update timetable entry.");
    }
  };

  // Delete a timetable entry
  const handleDeleteTimetableEntry = async (roomName, entryId) => {
    if (!window.confirm("Are you sure you want to delete this timetable entry?")) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/rooms/${roomName}/schedule/${entryId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setTimetable(timetable.filter(entry => entry._id !== entryId));
      alert("Timetable entry deleted successfully!");
    } catch (error) {
      console.error("Error deleting timetable entry:", error);
      alert("Failed to delete timetable entry.");
    }
  };

  return (
    <>
      <Navbar title="Lab Assistant Dashboard" />
      <Container sx={{ marginTop: 6 }}>
        <Typography variant="h4">Lab Assistant Dashboard</Typography>

        {/* Room selection dropdown */}
        <FormControl fullWidth sx={{ marginTop: 3 }}>
          <Select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} displayEmpty>
            <MenuItem value="" disabled>Select Room</MenuItem>
            {rooms.map(room => (
              <MenuItem key={room.name} value={room.name}>{room.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Action buttons */}
        <Button onClick={fetchTimetable} variant="contained" sx={{ margin: 2 }}>Load Timetable</Button>
        <Button variant="contained" color="primary" onClick={() => navigate("/admin-dashboard/input-timetable")}>
          Input Timetable
        </Button>

        {/* <PrintTimeTable roomName={selectedRoom} timetable={timetable} /> */}

        {/* Timetable display table */}
        <div style={{ maxHeight: "70vh", overflowY: "auto", marginTop: 20 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Day</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Faculty</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timetable.map(entry => (
                <TableRow key={entry._id}>
                  <TableCell>{entry.day}</TableCell>
                  <TableCell>{entry.startTime}</TableCell>
                  <TableCell>{entry.endTime}</TableCell>

                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        value={editEntries[entry._id]?.subject ?? entry.subject}
                        onChange={(e) =>
                          setEditEntries({
                            ...editEntries,
                            [entry._id]: { ...editEntries[entry._id], subject: e.target.value }
                          })
                        }
                      >
                        {subjectOptions.map(option => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>

                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={editEntries[entry._id]?.faculty ?? entry.faculty}
                        onChange={(e) =>
                          setEditEntries({
                            ...editEntries,
                            [entry._id]: { ...editEntries[entry._id], faculty: e.target.value }
                          })
                        }
                        renderValue={(selected) => selected.join(", ")}
                      >
                        {facultyNames.map(faculty => (
                          <MenuItem key={faculty} value={faculty}>{faculty}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>

                  <TableCell>
                    <Button color="primary" onClick={() => handleUpdateTimetableEntry(selectedRoom, entry._id)}>Update</Button>
                    <Button color="secondary" onClick={() => handleDeleteTimetableEntry(selectedRoom, entry._id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Container>
    </>
  );
}

export default LabAssistantDashboard;
