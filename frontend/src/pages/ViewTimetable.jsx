import React, { useState } from "react";
import axios from "axios";
import { 
  Container, TextField, Button, Typography, 
  Paper, Box, Stack, TableContainer, CircularProgress
} from "@mui/material";
import Navbar from "../components/Navbar";

const ViewTimetable = () => {
  const [roomName, setRoomName] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Time slots matching the PDF format
  const timeSlots = [
    { id: 1, time: "08:00-08:30" },
    { id: 2, time: "08:30-09:00" },
    { id: 3, time: "09:00-09:30" },
    { id: 4, time: "09:30-10:00" },
    { id: 5, time: "10:00-10:30" },
    { id: 6, time: "10:30-11:00" },
    { id: 7, time: "11:00-11:30" },
    { id: 8, time: "11:30-12:00" },
    { id: 9, time: "12:00-12:30" },
    { id: 10, time: "12:30-01:00" },
    { id: 11, time: "01:00-01:30" },
    { id: 12, time: "01:30-02:00" },
    { id: 13, time: "02:00-02:30" },
    { id: 14, time: "02:30-03:00" },
    { id: 15, time: "03:00-03:30" },
    { id: 16, time: "03:30-04:00" },
    { id: 17, time: "04:00-04:30" },
    { id: 18, time: "04:30-05:00" },
    { id: 19, time: "05:00-05:30" }
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Calculate the column width as a percentage
  const dayColumnWidth = `${100 / (days.length + 2)}%`; // +2 for the period number and time columns

  // Status colors for different approval states
  const statusColors = {
    pendingApproval: {
      background: "#FFF9C4", // Light yellow
      text: "#F57F17"        // Dark amber for text
    },
    approved: {
      background: "#FFE0B2", // Light orange
      text: "#E65100"        // Dark orange for text
    },
    granted: {
      background: "#E8F5E9", // Light green
      text: "#2E7D32"        // Dark green for text
    },
    default: {
      background: "#E6E6FA", // Light purple (original color)
      text: "#4B0082"        // Indigo for text (original color)
    }
  };

  const fetchTimetable = async () => {
    if (!roomName.trim()) {
      setError("Please enter a room name");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await axios.get(`http://localhost:5000/api/rooms/${roomName}/timetable`);
      console.log(response.data.timetable);
      setSchedule(response.data.timetable || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          "Room not found or no timetable available.";
      setError(errorMessage);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  // Improved time string to index conversion with special handling for 05:30
  const timeToIndex = (timeStr) => {
    // Special case for "05:30" as it's the end time of the last slot
    if (timeStr === "05:30") {
      return timeSlots.length; // Return the index after the last slot
    }
    
    // Convert time to a standardized format for comparison
    let hour = parseInt(timeStr.split(':')[0]);
    const minute = timeStr.split(':')[1];
    
    // Handle 12-hour format for afternoon times
    if (hour <= 5) {
      hour += 12; // Convert to 24-hour format
    }
    
    // Format to match the timeSlots format
    const formattedTime = hour < 10 ? `0${hour}:${minute}` : `${hour}:${minute}`;
    
    // Find matching time slot
    for (let i = 0; i < timeSlots.length; i++) {
      const slotStart = timeSlots[i].time.split('-')[0];
      
      // Convert slot time for comparison if it's in 12-hour format
      let slotHour = parseInt(slotStart.split(':')[0]);
      if (slotStart.includes('0') && slotHour <= 5) {
        slotHour += 12;
      }
      
      const slotMinute = slotStart.split(':')[1];
      const slotFormatted = slotHour < 10 ? `0${slotHour}:${slotMinute}` : `${slotHour}:${slotMinute}`;
      
      if (formattedTime === slotFormatted || slotStart === timeStr) {
        return i;
      }
    }
    return -1;
  };

  // Get cell colors based on approval status
  const getCellColors = (approvalStatus) => {
    switch(approvalStatus) {
      case "pendingApproval":
        return statusColors.pendingApproval;
      case "approved":
        return statusColors.approved;
      case "granted":
        return statusColors.granted;
      default:
        return statusColors.default;
    }
  };

  // Generate the timetable HTML
  const renderTimetable = () => {
    if (schedule.length === 0) return null;

    // Create a grid to track occupied cells
    const cellOccupied = {};
    days.forEach(day => {
      cellOccupied[day] = Array(timeSlots.length).fill(false);
    });

    // Process schedule data
    const classEntries = [];
    schedule.forEach(entry => {
      const day = entry.day;
      if (!days.includes(day)) return;
      
      const startIndex = timeToIndex(entry.startTime);
      let endIndex = timeToIndex(entry.endTime);
      
      // Skip invalid entries
      if (startIndex === -1) return;
      
      // Handle end time special cases
      if (endIndex > startIndex) {
        endIndex = endIndex - 1;
      }
      
      // Handle the case where endIndex is still -1 after adjustment
      if (endIndex === -1) {
        // If we couldn't find a valid end index, use the last slot
        endIndex = timeSlots.length - 1;
      }
      
      classEntries.push({
        day,
        startIndex,
        endIndex,
        rowSpan: endIndex - startIndex + 1,
        subject: entry.subject,
        faculty: entry.faculty || "",
        approvalStatus: entry.approvalStatus || "default", // Use default if not specified
        class: entry.class || {} // Add class information
      });
      
      // Mark cells as occupied
      for (let i = startIndex; i <= endIndex; i++) {
        cellOccupied[day][i] = true;
      }
    });

    // Table styles
    const tableStyles = {
      width: '100%',
      tableLayout: 'fixed', // This ensures equal column widths
      borderCollapse: 'collapse',
      fontSize: '0.75rem',
      border: '1px solid #ddd',
    };

    // Cell styles
    const cellStyles = {
      padding: '2px 4px',
      textAlign: 'center',
      border: '1px solid #ddd',
      overflow: 'hidden', // Prevent text overflow
      textOverflow: 'ellipsis', // Show ellipsis for overflowing text
      wordWrap: 'break-word' // Break words when necessary
    };

    // Fix for colgroup whitespace issue - use React.createElement instead of JSX
    const colgroup = React.createElement(
      'colgroup',
      null,
      React.createElement('col', { style: { width: '5%' } }),
      React.createElement('col', { style: { width: '10%' } }),
      ...days.map((day, index) => 
        React.createElement('col', { key: index, style: { width: dayColumnWidth } })
      )
    );

    return (
      <table className="timetable" style={tableStyles}>
        {colgroup}
        <thead>
          <tr>
            <th style={{ ...cellStyles, fontWeight: 'bold' }}>No.</th>
            <th style={{ ...cellStyles, fontWeight: 'bold' }}>PERIOD</th>
            {days.map(day => (
              <th key={day} style={{ ...cellStyles, fontWeight: 'bold' }}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((slot, rowIndex) => (
            <tr key={slot.id} style={{ height: '30px' }}>
              <td style={{ ...cellStyles, fontSize: '0.7rem' }}>{slot.id}</td>
              <td style={{ ...cellStyles, fontSize: '0.7rem' }}>{slot.time}</td>
              
              {days.map((day, colIndex) => {
                // Check if this cell is the start of a class entry
                const classEntry = classEntries.find(
                  entry => entry.day === day && entry.startIndex === rowIndex
                );
                
                // Check if this cell is part of a class but not the start
                const isOccupied = cellOccupied[day][rowIndex];
                
                // If cell is part of a class but not the start, don't render it
                if (isOccupied && !classEntry) {
                  return null;
                }
                
                // Render class cell or empty cell
                if (classEntry) {
                  // Get colors based on approval status
                  const colors = getCellColors(classEntry.approvalStatus);
                  
                  return (
                    <td 
                      key={`${day}-${rowIndex}`}
                      rowSpan={classEntry.rowSpan}
                      style={{
                        ...cellStyles,
                        backgroundColor: colors.background,
                        color: colors.text,
                        verticalAlign: 'middle'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.7rem', lineHeight: 1.1 }}>
                        {classEntry.subject}
                      </div>
                      <div>
                        {Array.isArray(classEntry.faculty) 
                          ? `(${classEntry.faculty.join(', ')})`
                          : `(${classEntry.faculty})`}
                      </div>
                      {/* Add class year and division information */}
                      {classEntry.class && (classEntry.class.year || classEntry.class.division) && (
                        <div style={{ marginTop: '2px' }}>
                          {classEntry.class.year && classEntry.class.division 
                            ? `${classEntry.class.year}-${classEntry.class.division}`
                            : classEntry.class.year || classEntry.class.division}
                        </div>
                      )}
                    </td>
                  );
                }
                
                // Empty cell
                return (
                  <td 
                    key={`${day}-${rowIndex}`}
                    style={cellStyles}
                  ></td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Legend for the approval status colors
  const renderLegend = () => {
    return (
      <Box sx={{ mt: 2, mb: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              backgroundColor: statusColors.pendingApproval.background, 
              border: '1px solid #ccc', 
              mr: 1 
            }} 
          />
          <Typography variant="caption">Pending Approval</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              backgroundColor: statusColors.approved.background, 
              border: '1px solid #ccc', 
              mr: 1 
            }} 
          />
          <Typography variant="caption">Approved by Admin</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              backgroundColor: statusColors.granted.background, 
              border: '1px solid #ccc', 
              mr: 1 
            }} 
          />
          <Typography variant="caption">Granted Approval</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              backgroundColor: statusColors.default.background, 
              border: '1px solid #ccc', 
              mr: 1 
            }} 
          />
          <Typography variant="caption">Default</Typography>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg">
        <Box sx={{ mt: 3, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Enter Room Name"
              variant="outlined"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              size="small"
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchTimetable();
              }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={fetchTimetable}
              sx={{ 
                backgroundColor: "#2c3e50", 
                color: "white", 
                marginLeft:4,
                padding: "12px 12px",
                marginTop:2,
                marginBottom: 2,
                borderRadius: 1,
                textTransform: "none",
                fontSize: "0.9rem",
                "&:hover": {
                  backgroundColor: "#1a2530"
                }
              }}
              size="medium"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? "Loading..." : "Fetch Timetable"}
            </Button>
          </Stack>
          
          {error && (
            <Typography color="error" sx={{ mt: 1 }} variant="body2">
              {error}
            </Typography>
          )}
        </Box>

        {schedule.length > 0 && (
          <Box sx={{ mt: 1,mb:2 }}>
            {renderLegend()}
            
            <TableContainer component={Paper} sx={{ mt: 1,marginBottom:2}}>
              {renderTimetable()}
            </TableContainer>
          </Box>
        )}
      </Container>
    </>
  );
};

export default ViewTimetable;