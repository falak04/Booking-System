import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Container, Typography, TextField, MenuItem, Select, Button, Table, TableHead, 
  TableRow, TableCell, TableBody, Checkbox, ListItemText 
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "../context/AuthContext";

function CreateBooking() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [availableRooms, setAvailableRooms] = useState({});
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [purpose, setPurpose] = useState("");

  const getDayFromDate = (date) => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return daysOfWeek[new Date(date).getDay()];
  };

  useEffect(() => {
    setSelectedDay(getDayFromDate(selectedDate));
  }, [selectedDate]);

  // Fetch available rooms along with time slots on the selected day
  useEffect(() => {
    if (selectedDay) {
      if(selectedDay!="Sunday")
      {
      axios.get(`http://localhost:5000/api/rooms/available?day=${selectedDay}`)
        .then(response => {
          console.log("Available Rooms:", response.data);
          setAvailableRooms(response.data);
        })
      
        .catch(error => console.error("Error fetching rooms:", error));
    }}
  }, [selectedDay]);

  // Handle selection of multiple continuous time slots
  const handleTimeSlotChange = (roomName, slots) => {
    const sortedSlots = slots.sort();

    if (sortedSlots.length > 4) {
      alert("You can select a maximum of 4 continuous slots.");
      return;
    }

    // Validate continuity of selected slots
    const timeIndex = availableRooms[roomName]?.availableSlots.map(slot => slot.startTime);
    const startIndex = timeIndex.indexOf(sortedSlots[0]);

    for (let i = 0; i < sortedSlots.length; i++) {
      if (timeIndex[startIndex + i] !== sortedSlots[i]) {
        alert("Selected slots must be continuous.");
        return;
      }
    }

    setSelectedRoom(roomName);
    setSelectedSlots(sortedSlots);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRoom || selectedSlots.length === 0) {
      alert("Please select a room and at least one time slot");
      return;
    }
    if(selectedDay==="Sunday")
    {
      alert("Sunday selected select another day");
      return;
    }
    // Merge selected time slots into a range
    const startTime = selectedSlots[0];
    const endTime = availableRooms[selectedRoom]?.availableSlots
      .find(slot => slot.startTime === selectedSlots[selectedSlots.length - 1])?.endTime;

    try {
      await axios.post("http://localhost:5000/api/bookings", {
        roomId: selectedRoom,
        date: selectedDate,
        day: selectedDay,
        timeSlot: `${startTime}-${endTime}`,
        purpose,
      }, { headers: { Authorization: `Bearer ${user.token}` } });

      alert("Booking request submitted!");
      navigate("/teacher-dashboard");
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to submit booking request.");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container sx={{ mt: 30, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Create a Booking Request
        </Typography>

        {/* Date Picker */}
        <Typography variant="h6">Select Date:</Typography>
        <DatePicker
          label="Pick a Date"
          value={selectedDate}
          onChange={(newDate) => setSelectedDate(newDate)}
          renderInput={(params) => <TextField fullWidth {...params} />}
        />

        {/* Auto-selected Day */}
        <Typography variant="h6" sx={{ marginTop: 2 }}>Selected Day: {selectedDay}</Typography>

        {/* Available Rooms & Time Slots */}
        <Typography variant="h5" sx={{ marginTop: 3 }}>Available Rooms & Time Slots</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Room Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Available Time Slots</TableCell>
              <TableCell>Select</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(availableRooms).length > 0 ? (
              Object.entries(availableRooms).map(([roomName, roomData]) => (
                <TableRow key={roomName}>
                  <TableCell>{roomName}</TableCell>
                  <TableCell>{roomData.type}</TableCell>
                  <TableCell>{roomData.capacity}</TableCell>
                  <TableCell>
                    <Select
                      multiple
                      fullWidth
                      value={selectedRoom === roomName ? selectedSlots : []}
                      onChange={(e) => handleTimeSlotChange(roomName, e.target.value)}
                      renderValue={(selected) => selected.join(", ")}
                    >
                      {roomData.availableSlots.map((slot, index) => (
                        <MenuItem key={index} value={slot.startTime}>
                          <Checkbox checked={selectedSlots.indexOf(slot.startTime) > -1} />
                          <ListItemText primary={`${slot.startTime} - ${slot.endTime}`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={selectedRoom === roomName ? "contained" : "outlined"}
                      color="primary"
                      onClick={() => setSelectedRoom(roomName)}
                    >
                      {selectedRoom === roomName ? "Selected" : "Select"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">No available rooms</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Purpose Input */}
        <TextField
          label="Purpose"
          fullWidth
          margin="normal"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />

        {/* Submit Button */}
        <Button type="submit" variant="contained" color="primary" fullWidth onClick={handleSubmit}>
          Create Booking
        </Button>
      </Container>
    </LocalizationProvider>
  );
}

export default CreateBooking;
