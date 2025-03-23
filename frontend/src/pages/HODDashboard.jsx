import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button } from "@mui/material";
import Navbar from "../components/Navbar";
import {useAuth} from "../context/AuthContext"
function HODDashboard() {
  const {user}=useAuth();

  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!user?.token) {
      console.error("No token found. Please log in.");
      return;
    }
  
    console.log("Fetching bookings with token:", user.token); // Debugging log
  
    axios
      .get("http://localhost:5000/api/bookings", {
        headers: { Authorization: `Bearer ${user.token.trim()}` }, // Ensure token format is correct
      })
      .then((response) => {
        const approvedBookings = response.data.filter(b => b.status === "Approved by Admin");
        setBookings(approvedBookings);
      })
      .catch(error => console.error("Error fetching bookings:", error));
  }, [user?.token]);

  const handleGrant = async (id) => {
    if (!user?.token) {
      console.error("No token found. Please log in.");
      return;
    }
  
    try {
      await axios.put(
        `http://localhost:5000/api/bookings/hod/grant/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${user.token.trim()}` },
        }
      );
  
      setBookings(bookings.map(booking => 
        booking._id === id ? { ...booking, hodStatus: "Granted" } : booking
      ));
    } catch (error) {
      console.error("Error granting booking:", error);
    }
  };
  
  const handleReject = async (id) => {
    if (!user?.token) {
      console.error("No token found. Please log in.");
      return;
    }
  
    try {
      await axios.put(
        `http://localhost:5000/api/bookings/hod/reject/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${user.token.trim()}` },
        }
      );
  
      setBookings(bookings.map(booking => 
        booking._id === id ? { ...booking, hodStatus: "Rejected" } : booking
      ));
    } catch (error) {
      console.error("Error rejecting booking:", error);
    }
  };
  

  return (
    <>
    <Navbar title="HOD Dashboard" />
    <Container>
      <Typography variant="h4">HOD Dashboard</Typography>
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
          {bookings.map(booking => (
            <TableRow key={booking._id}>
              <TableCell>{booking.teacher.name}</TableCell>
              <TableCell>{booking.classroom}</TableCell>
              <TableCell>{booking.date}</TableCell>
              <TableCell>{booking.timeSlot}</TableCell>
              <TableCell>{booking.purpose}</TableCell>
              <TableCell>{booking.hodStatus}</TableCell>
              <TableCell>
                {booking.hodStatus === "Pending" && (
                  <>
                    <Button color="primary" onClick={() => handleGrant(booking._id)}>Grant</Button>
                    <Button color="secondary" onClick={() => handleReject(booking._id)}>Reject</Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
    </>
  );
}

export default HODDashboard;
