import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Container, Typography, Paper, Box, Stack, IconButton, 
  Grid, CircularProgress, Chip, Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import { 
  ChevronLeft, ChevronRight, CalendarMonth, 
  AccessTime, Room
} from "@mui/icons-material";
import Navbar from "../components/Navbar";

const ViewTimetable = () => {
  // State variables
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // const API=import.meta.env.REACT_APP_API_URL;
  const API="https://bookingsystem-e4oz.onrender.com"
  // Time slots for the day
  const timeSlots = [
    "08:00-08:30", "08:30-09:00", "09:00-09:30", "09:30-10:00",
    "10:00-10:30", "10:30-11:00", "11:00-11:30", "11:30-12:00",
    "12:00-12:30", "12:30-13:00", "13:00-13:30", "13:30-14:00",
    "14:00-14:30", "14:30-15:00", "15:00-15:30", "15:30-16:00",
    "16:00-16:30", "16:30-17:00", "17:00-17:30"
  ];

  // Days of the week
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Status colors for different approval states
  const statusColors = {
    pendingApproval: {
      background: "#FFF9C4", // Light yellow
      text: "#F57F17",       // Dark amber for text
      border: "#FFD54F"      // Amber border
    },
    approved: {
      background: "#FFE0B2", // Light orange
      text: "#E65100",       // Dark orange for text
      border: "#FFB74D"      // Orange border
    },
    granted: {
      background: "#E8F5E9", // Light green
      text: "#2E7D32",       // Dark green for text
      border: "#A5D6A7"      // Green border
    },
    default: {
      background: "#E6E6FA", // Light purple
      text: "#4B0082",       // Indigo for text
      border: "#9FA8DA"      // Indigo border
    }
  };

  // Fetch all available rooms when component mounts
  useEffect(() => {
    async function fetchRooms() {
      try {
        const response = await axios.get(`${API}/rooms`);
        setRooms(response.data);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setError("Failed to load rooms. Please try again later.");
      }
    }
    
    fetchRooms();
    
    // Set current week to start on Monday
    adjustToMonday(new Date());
  }, []);

  // Adjust date to the Monday of its week
  const adjustToMonday = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date);
    monday.setDate(diff);
    setCurrentWeekStart(monday);
  };

  // Handle room selection change
  const handleRoomChange = (event) => {
    setSelectedRoom(event.target.value);
    fetchRoomData(event.target.value);
  };

  // Fetch room data including schedule
  const fetchRoomData = async (roomName) => {
    if (!roomName) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.get(`${API}/rooms/${roomName}/timetable`);
      setRoomData({
        name: roomName,
        schedule: response.data.timetable || []
      });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          "Room not found or no timetable available.";
      setError(errorMessage);
      setRoomData(null);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  // Get date string for a specific day in the current week
  const getDateString = (dayIndex) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get Date object for a specific day in the current week
  const getDateForDay = (dayIndex) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
  };

  // Format week range for display
  const getWeekRangeDisplay = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 5); // Saturday (6 days including Monday)
    
    const startMonth = currentWeekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    
    const startDay = currentWeekStart.getDate();
    const endDay = endDate.getDate();
    
    const startYear = currentWeekStart.getFullYear();
    const endYear = endDate.getFullYear();
    
    if (startYear !== endYear) {
      return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
    } else if (startMonth !== endMonth) {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
    } else {
      return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
    }
  };

  // Check if two entries are identical for merging purposes
  const areEntriesIdentical = (entry1, entry2) => {
    if (!entry1 || !entry2) return false;
    
    return (
      entry1.subject === entry2.subject &&
      entry1.approvalStatus === entry2.approvalStatus &&
      JSON.stringify(entry1.faculty) === JSON.stringify(entry2.faculty) &&
      JSON.stringify(entry1.class) === JSON.stringify(entry2.class)
    );
  };

  // Check if a date matches the entry's date (if applicable)
  const matchesEntryDate = (entry, currentDate) => {
    // If approvalStatus is default, always show the entry
    if (entry.approvalStatus === "default") {
      return true;
    }
    
    // If approvalStatus is NOT default, only show on specific date
    if (entry.date) {
      const entryDate = new Date(entry.date);
      return (
        currentDate.getFullYear() === entryDate.getFullYear() &&
        currentDate.getMonth() === entryDate.getMonth() &&
        currentDate.getDate() === entryDate.getDate()
      );
    }
    
    return false; // Don't show entries with non-default status and no date
  };

  // Find schedule entries for a specific day and time slot
  const findScheduleEntries = (day, timeSlot, dayIndex) => {
    if (!roomData || !roomData.schedule) return null;
    
    // Parse the time slot correctly
    const [startTimeSlot, endTimeSlot] = timeSlot.split('-');
    
    // Get the date for this day
    const currentDate = getDateForDay(dayIndex);
    
    return roomData.schedule.filter(entry => {
      // First check if this entry matches the day and time slot
      const matchesSlot = (
        entry.day === day &&
        ((entry.startTime <= startTimeSlot && entry.endTime > startTimeSlot) || 
         (entry.startTime >= startTimeSlot && entry.startTime < endTimeSlot))
      );
      
      // Then check if this entry should be shown on the current date
      return matchesSlot && matchesEntryDate(entry, currentDate);
    });
  };

  // Process timetable data to identify mergeable slots
  const processTimeTable = () => {
    const mergeData = {};
    
    weekDays.forEach((day, dayIndex) => {
      mergeData[day] = [];
      
      let currentGroup = null;
      
      timeSlots.forEach((slot, slotIndex) => {
        const entries = findScheduleEntries(day, slot, dayIndex);
        const entry = entries && entries.length > 0 ? entries[0] : null;
        
        if (!entry) {
          if (currentGroup) {
            mergeData[day].push(currentGroup);
            currentGroup = null;
          }
          // Push an empty slot
          mergeData[day].push({
            startIndex: slotIndex,
            endIndex: slotIndex,
            entry: null,
            span: 1
          });
        } else {
          if (currentGroup && areEntriesIdentical(currentGroup.entry, entry)) {
            // Extend current group
            currentGroup.endIndex = slotIndex;
            currentGroup.span = currentGroup.endIndex - currentGroup.startIndex + 1;
          } else {
            // End current group if exists
            if (currentGroup) {
              mergeData[day].push(currentGroup);
            }
            // Start new group
            currentGroup = {
              startIndex: slotIndex,
              endIndex: slotIndex,
              entry: entry,
              span: 1
            };
          }
        }
      });
      
      // Add the last group if exists
      if (currentGroup) {
        mergeData[day].push(currentGroup);
      }
    });
    
    return mergeData;
  };

  // Get approval status label
  const getStatusLabel = (status) => {
    switch(status) {
      case "pendingApproval": return "Pending";
      case "approved": return "Approved";
      case "granted": return "Granted";
      default: return "Regular";
    }
  };

  // Format date for display in the cell
  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Render cell content based on schedule entry
  const renderCellContent = (entry) => {
    if (!entry) return null;
    
    const colors = statusColors[entry.approvalStatus || "default"];
    
    return (
      <Box 
        sx={{ 
          height: '100%',
          p: 1,
          backgroundColor: colors.background,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          borderRadius: 1,
          overflow: 'hidden',
          fontSize: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5, lineHeight: 1.2 }}>
          {entry.subject}
        </Typography>
        
        <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
          {Array.isArray(entry.faculty) 
            ? entry.faculty.join(', ')
            : entry.faculty}
        </Typography>
        
        {entry.class && (entry.class.year || entry.class.division) && (
          <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
            {entry.class.year && entry.class.division 
              ? `${entry.class.year}-${entry.class.division}`
              : entry.class.year || entry.class.division}
          </Typography>
        )}
        
        {entry.approvalStatus && entry.approvalStatus !== "default" && (
          <Box sx={{ mt: 0.5 }}>
            <Chip 
              label={getStatusLabel(entry.approvalStatus)}
              size="small"
              sx={{ 
                height: 16,
                fontSize: '0.6rem',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                color: colors.text,
                mr: 0.5
              }}
            />
            {entry.date && (
              <Chip 
                label={formatDateDisplay(entry.date)}
                size="small"
                sx={{ 
                  height: 16,
                  fontSize: '0.6rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  color: colors.text
                }}
              />
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Determine if the current date is today
  const isToday = (dayIndex) => {
    const today = new Date();
    const compareDate = new Date(currentWeekStart);
    compareDate.setDate(compareDate.getDate() + dayIndex);
    
    return (
      today.getDate() === compareDate.getDate() &&
      today.getMonth() === compareDate.getMonth() &&
      today.getFullYear() === compareDate.getFullYear()
    );
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          {/* Header with room selector */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ fontWeight: 'medium' }}>
              Room Timetable
            </Typography>
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="room-select-label">Select Room</InputLabel>
              <Select
                labelId="room-select-label"
                value={selectedRoom}
                label="Select Room"
                onChange={handleRoomChange}
                size="small"
              >
                <MenuItem value=""><em>Select a room</em></MenuItem>
                {rooms.map(room => (
                  <MenuItem key={room.name} value={room.name}>
                    {room.name} ({room.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          
          {/* Room info and week navigation */}
          {selectedRoom && (
            <Box mb={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center">
                  <Room sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {selectedRoom} {roomData && `(Capacity: ${rooms.find(r => r.name === selectedRoom)?.capacity || '-'})`}
                  </Typography>
                </Box>
                
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconButton onClick={goToPreviousWeek} size="small">
                    <ChevronLeft />
                  </IconButton>
                  
                  <Box display="flex" alignItems="center">
                    <CalendarMonth sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {getWeekRangeDisplay()}
                    </Typography>
                  </Box>
                  
                  <IconButton onClick={goToNextWeek} size="small">
                    <ChevronRight />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>
          )}
          
          {/* Error message */}
          {error && (
            <Typography color="error" sx={{ mt: 1, mb: 2 }} variant="body2">
              {error}
            </Typography>
          )}
          
          {/* Loading indicator */}
          {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          )}
          
          {/* Calendar timetable grid */}
          {selectedRoom && roomData && !loading && (
            <Box sx={{ overflowX: 'auto' }}>
              <Grid container sx={{ minWidth: 900 }}>
                {/* Time column */}
                <Grid item xs={1} sx={{ borderRight: '1px solid #e0e0e0' }}>
                  <Box sx={{ 
                    height: 50, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#f5f5f5'
                  }}>
                    <AccessTime fontSize="small" sx={{ color: 'text.secondary' }} />
                  </Box>
                  
                  {timeSlots.map((slot, index) => (
                    <Box key={index} sx={{ 
                      height: 80, 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 1,
                      borderBottom: '1px solid #e0e0e0',
                      fontSize: '0.75rem'
                    }}>
                      {slot}
                    </Box>
                  ))}
                </Grid>
                
                {/* Days columns */}
                {weekDays.map((day, dayIndex) => {
                  const mergedData = roomData ? processTimeTable()[day] : [];
                  
                  return (
                    <Grid item xs={1.8} key={day} sx={{ borderRight: '1px solid #e0e0e0' }}>
                      {/* Day header */}
                      <Box sx={{ 
                        height: 50, 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid #e0e0e0',
                        backgroundColor: isToday(dayIndex) ? 'primary.light' : '#f5f5f5',
                        color: isToday(dayIndex) ? 'primary.contrastText' : 'inherit'
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {day}
                        </Typography>
                        <Typography variant="caption">
                          {getDateString(dayIndex)}
                        </Typography>
                      </Box>
                      
                      {/* Merged time slots for this day */}
                      {mergedData.map((slot, slotIndex) => (
                        <Box 
                          key={`${day}-${slotIndex}`} 
                          sx={{ 
                            height: slot.span * 80, 
                            p: 0.5,
                            borderBottom: '1px solid #e0e0e0',
                            backgroundColor: slot.entry ? 'transparent' : 'white',
                            '&:hover': {
                              backgroundColor: slot.entry ? 'transparent' : '#f9f9f9'
                            }
                          }}
                        >
                          {renderCellContent(slot.entry)}
                        </Box>
                      ))}
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
          
          {/* Legend for approval status */}
          {selectedRoom && roomData && !loading && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                Status Legend:
              </Typography>
              
              {Object.entries(statusColors).map(([status, colors]) => (
                <Box key={status} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '2px',
                      mr: 0.5
                    }} 
                  />
                  <Typography variant="caption">
                    {status === "pendingApproval" ? "Pending Approval" : 
                     status === "approved" ? "Approved by Admin" :
                     status === "granted" ? "Granted Approval" : "Default"}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default ViewTimetable;