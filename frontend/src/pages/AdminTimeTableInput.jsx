import React, { useState } from "react";
import { Card, CardContent, Typography, MenuItem, TextField, Button, Select, Grid, InputLabel, FormControl } from "@mui/material";
import axios from "axios";

const facultyNames = [
  "Dr. Vinaya Sawant (VS)", "Dr. Abhijit Joshi (ARJ)", "Dr. Ram Mangulkar (RM)", "Dr. SatishKumar Verma (SV)",
  "Dr. Monika Mangla (MM)", "Ms. Neha Katre (NK)", "Mr. Harshal Dalvi (HD)", "Mr. Arjun Jaiswal (AJ)",
  "Ms. Stevina Coriea (SC)", "Ms. Prachi Satan (PS)", "Ms. Neha Agarwal (NA)", "Ms. Sharvari Patil (SP)",
  "Ms. Richa Sharma (RS)", "Ms. Sweedle Machado (SM)", "Ms. Priyanca Gonsalves (PG)", "Ms. Anushree Patkar (AP)",
  "Ms. Monali Sankhe (MS)", "Ms. Savyasachi Pandit (SSP)", "Mr. Chandrashekhar Badgujar (CB)",
  "Mr. Suryakant Chaudhari (STC)", "Dr. Gayatri Pandya (GP)", "Dr. Naresh Afre (NAF)", "Mr. Pravin Hole (PH)",
  "Ms. Leena Sahu (LS)"
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AdminTimetableInput = () => {
  const [formData, setFormData] = useState({
    name: "",
    day: "",
    startTime: "",
    endTime: "",
    faculty: [],
    subject: "",
    capacity: "",
    type: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "faculty") {
      setFormData({ ...formData, faculty: typeof value === "string" ? value.split(",") : value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting Form Data:", formData);

    if (formData.startTime >= formData.endTime) {
      alert("⚠️ End time must be after start time!");
      return;
    }

    if (parseInt(formData.capacity, 10) <= 0) {
      alert("⚠️ Capacity must be a positive number!");
      return;
    }

    if (formData.faculty.length === 0) {
      alert("⚠️ Please select at least one faculty member.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/rooms/add", formData, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ Timetable Added:", response.data);
      alert("✔️ Timetable entry added successfully!");

      setFormData({
        name: "",
        day: "",
        startTime: "",
        endTime: "",
        faculty: [],
        subject: "",
        capacity: "",
        type: "",
      });
    } catch (error) {
      console.error("❌ Error adding timetable:", error.response?.data || error.message);
      alert(error.response?.data?.error || "❌ Failed to add timetable entry.");
    }
  };

  return (
    <Card style={{ maxWidth: 500, margin: "40px auto", padding: "20px" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>Add Timetable Entry</Typography>
        <form onSubmit={handleSubmit}>
          <TextField name="name" label="Class/Lab Name" fullWidth margin="normal" required value={formData.name} onChange={handleChange} />

          <Select name="day" fullWidth value={formData.day} onChange={handleChange} displayEmpty required style={{ marginBottom: "10px" }}>
            <MenuItem value="" disabled>Select Day</MenuItem>
            {daysOfWeek.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
          </Select>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Select name="startTime" fullWidth value={formData.startTime} onChange={handleChange} displayEmpty required>
                <MenuItem value="" disabled>Select Start Time</MenuItem>
                {timeSlots.map(time => <MenuItem key={time} value={time}>{time}</MenuItem>)}
              </Select>
            </Grid>

            <Grid item xs={6}>
              <Select name="endTime" fullWidth value={formData.endTime} onChange={handleChange} displayEmpty required>
                <MenuItem value="" disabled>Select End Time</MenuItem>
                {timeSlots.map(time => <MenuItem key={time} value={time}>{time}</MenuItem>)}
              </Select>
            </Grid>
          </Grid>

          <FormControl fullWidth style={{ marginTop: "10px" }}>
            <InputLabel>Select Faculty</InputLabel>
            <Select
              name="faculty"
              multiple
              value={formData.faculty}
              onChange={handleChange}
              renderValue={(selected) => selected.join(", ")}
            >
              {facultyNames.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField name="subject" label="Subject" fullWidth margin="normal" required value={formData.subject} onChange={handleChange} />

          <TextField name="capacity" type="number" label="Capacity" fullWidth margin="normal" required value={formData.capacity} onChange={handleChange} />

          <Select name="type" fullWidth value={formData.type} onChange={handleChange} displayEmpty required>
            <MenuItem value="" disabled>Select Type</MenuItem>
            <MenuItem value="Classroom">Classroom</MenuItem>
            <MenuItem value="Lab">Lab</MenuItem>
          </Select>

          <Button type="submit" variant="contained" color="primary" fullWidth style={{ marginTop: "15px" }}>
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminTimetableInput;
