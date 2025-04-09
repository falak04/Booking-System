import React, { useState } from "react";
import { 
  Card, CardContent, Typography, Button, TextField, 
  Grid, Alert, CircularProgress
} from "@mui/material";
import axios from "axios";
import * as XLSX from "xlsx";
import Navbar from "../components/Navbar";

// Original data from your component
const facultyNames = [
  "Dr. Vinaya Sawant (VS)", "Dr. Abhijit Joshi (ARJ)", "Dr. Ram Mangulkar (RM)", "Dr. SatishKumar Verma (SV)",
  "Dr. Monika Mangla (MM)", "Ms. Neha Katre (NK)", "Mr. Harshal Dalvi (HD)", "Mr. Arjun Jaiswal (AJ)",
  "Ms. Stevina Coriea (SC)", "Ms. Prachi Satan (PS)", "Ms. Neha Agarwal (NA)", "Ms. Sharvari Patil (SP)",
  "Ms. Richa Sharma (RS)", "Ms. Sweedle Machado (SM)", "Ms. Priyanca Gonsalves (PG)", "Ms. Anushree Patkar (AP)",
  "Ms. Monali Sankhe (MS)", "Ms. Savyasachi Pandit (SSP)", "Mr. Chandrashekhar Badgujar (CB)",
  "Mr. Suryakant Chaudhari (STC)", "Dr. Gayatri Pandya (GP)", "Dr. Naresh Afre (NAF)", "Mr. Pravin Hole (PH)",
  "Ms. Leena Sahu (LS)","Ms. Prahelika Pai (PP)"
];

// Updated to ensure all days from Monday to Saturday are included
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AdminTimeTableInput = () => {
  const [file, setFile] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [extractedData, setExtractedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Enhanced function to parse class code (TY-11) into year and division
  const parseClassCode = (roomCode) => {
    if (!roomCode || typeof roomCode !== 'string') {
      return { year: "", division: "" };
    }
    
    // Match patterns like "TY-11", "SY-I3", etc.
    const regex = /^([A-Z]+)-([A-Z0-9]+)$/;
    const match = roomCode.trim().match(regex);
    
    if (match) {
      return {
        year: match[1], // "TY", "SY", etc.
        division: match[2] // "11", "I3", etc.
      };
    }
    
    return { year: roomCode, division: "" };
  };

  // Helper function to parse a cell entry like "(TY-11) ISIG (RS)" or "(TY-11) ISIG (RS, NK)"
  const parseCellEntry = (entry) => {
    if (!entry || typeof entry !== 'string') return null;
    
    const entryStr = String(entry).trim();
    
    // Regular expression to match pattern with multiple faculty codes like "(TY-11) ISIG (RS, NK)"
    // This will capture room code, subject, and faculty codes (potentially multiple)
    let regex = /^(?:\(([^)]+)\)\s*)?(.*?)\s*\(([^)]+)\)$/;
    let match = entryStr.match(regex);
    
    if (match) {
      const [, roomCode, subject, facultyCodes] = match;
      
      // Split by comma to handle multiple faculty codes
      const facultyCodeList = facultyCodes.split(',').map(code => code.trim());
      
      // Parse year and division from roomCode
      const classInfo = parseClassCode(roomCode || "");
      
      return {
        roomCode: roomCode || "",
        subject: subject.trim(),
        facultyCodes: facultyCodeList,
        year: classInfo.year,
        division: classInfo.division
      };
    }
    
    // Try the format with colon (e.g., "II-1: PBC")
    regex = /^(.*?):\s*(.*)$/;
    match = entryStr.match(regex);
    
    if (match) {
      const [, prefix, subject] = match;
      
      // Parse year and division from prefix
      const classInfo = parseClassCode(prefix || "");
      
      return {
        roomCode: prefix.trim(),
        subject: subject.trim(),
        facultyCodes: [],
        year: classInfo.year,
        division: classInfo.division
      };
    }
    
    // If nothing matches, just use the entire string as the subject
    return {
      roomCode: "",
      subject: entryStr,
      facultyCodes: [],
      year: "",
      division: ""
    };
  };

  // Helper function to find full faculty name from code
  const findFacultyByCode = (codes) => {
    if (!codes || (Array.isArray(codes) && codes.length === 0)) return [];
    
    // Convert to array if it's not already one
    const codeArray = Array.isArray(codes) ? codes : [codes];
    
    const foundFaculty = [];
    
    codeArray.forEach(code => {
      const matches = facultyNames.filter(name => {
        const codeMatch = name.match(/\(([^)]+)\)$/);
        return codeMatch && codeMatch[1] === code;
      });
      
      foundFaculty.push(...matches);
    });
    
    return foundFaculty;
  };

  // Improved function to parse time slots, handling formats like "10:00-10:30" or just "10:00"
  const parseTimeSlot = (periodText) => {
    if (!periodText || typeof periodText !== 'string') return null;
    
    // Try the standard format first (e.g., "10:00-10:30")
    const timeFormat1 = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/;
    const match1 = String(periodText).match(timeFormat1);
    
    if (match1) {
      return {
        startTime: match1[1].trim(),
        endTime: match1[2].trim()
      };
    }
    
    // Try a single time format (e.g., "10:00") - use this for merged cells or single time representation
    const timeFormat2 = /(\d{1,2}:\d{2})/;
    const match2 = String(periodText).match(timeFormat2);
    
    if (match2) {
      // For a single time value, we need to infer the end time
      // We'll add 1 hour as a default duration
      const startTime = match2[1].trim();
      
      const [hours, minutes] = startTime.split(':').map(num => parseInt(num, 10));
      let endHours = hours + 1;
      
      // Format the end time
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      return {
        startTime,
        endTime
      };
    }
    
    return null;
  };

  // Function to handle merged cells and extract time slots
  const getTimeSlotForRow = (sheet, rowIndex, timeColumnIndex) => {
    // Try to get a value from the expected cell
    let cellValue = sheet[XLSX.utils.encode_cell({r: rowIndex, c: timeColumnIndex})];
    
    // If the cell is undefined, the Excel file might have merged cells
    if (!cellValue || !cellValue.v) {
      // Look up for previous rows to find a merged cell value
      for (let i = rowIndex - 1; i >= 0; i--) {
        const prevCellValue = sheet[XLSX.utils.encode_cell({r: i, c: timeColumnIndex})];
        if (prevCellValue && prevCellValue.v) {
          // Check if this cell is part of a merged range that includes our target cell
          const merges = sheet['!merges'] || [];
          for (const merge of merges) {
            if (i >= merge.s.r && i <= merge.e.r && 
                timeColumnIndex >= merge.s.c && timeColumnIndex <= merge.e.c &&
                rowIndex >= merge.s.r && rowIndex <= merge.e.r) {
              cellValue = prevCellValue;
              break;
            }
          }
          if (cellValue) break;
        }
      }
    }
    
    return cellValue ? parseTimeSlot(String(cellValue.v)) : null;
  };

  // Function to merge consecutive time slots for the same subject and faculty
  const mergeConsecutiveSlots = (entries) => {
    if (!entries || entries.length === 0) return [];
    
    // Sort entries by day, subject, faculty, and start time
    const sortedEntries = [...entries].sort((a, b) => {
      // Sort by day of week first
      const dayIndexA = daysOfWeek.indexOf(a.day);
      const dayIndexB = daysOfWeek.indexOf(b.day);
      if (dayIndexA !== dayIndexB) return dayIndexA - dayIndexB;
      
      // Then by subject
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      
      // Then by faculty (using first faculty member if available)
      const facultyA = a.faculty.length > 0 ? a.faculty[0] : "";
      const facultyB = b.faculty.length > 0 ? b.faculty[0] : "";
      if (facultyA !== facultyB) return facultyA.localeCompare(facultyB);
      
      // Finally by start time
      return a.startTime.localeCompare(b.startTime);
    });
    
    const mergedEntries = [];
    let currentEntry = null;
    
    for (const entry of sortedEntries) {
      if (!currentEntry) {
        currentEntry = { ...entry };
        continue;
      }
      
      // Check if this entry can be merged with the current one
      const canMerge = 
        currentEntry.day === entry.day &&
        currentEntry.subject === entry.subject &&
        JSON.stringify(currentEntry.faculty) === JSON.stringify(entry.faculty) &&
        currentEntry.endTime === entry.startTime;
      
      if (canMerge) {
        // Merge by updating the end time
        currentEntry.endTime = entry.endTime;
      } else {
        // Cannot merge, add current entry to results and start a new one
        mergedEntries.push(currentEntry);
        currentEntry = { ...entry };
      }
    }
    
    // Add the last entry if there is one
    if (currentEntry) {
      mergedEntries.push(currentEntry);
    }
    
    return mergedEntries;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setMessage({ text: "", type: "" });
  };

  const processExcelFile = () => {
    if (!file) {
      setMessage({ text: "Please select a file first", type: "error" });
      return;
    }

    if (!roomName) {
      setMessage({ text: "Please enter a room name", type: "error" });
      return;
    }

    if (!roomType) {
      setMessage({ text: "Please select a room type", type: "error" });
      return;
    }

    if (!capacity || parseInt(capacity) <= 0) {
      setMessage({ text: "Please enter a valid capacity", type: "error" });
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get the merged cells information
        const mergedCells = worksheet['!merges'] || [];
        
        // Get the range of the worksheet
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        // Identify header row and columns for days
        let headerRowIndex = -1;
        const dayColumnIndices = {};
        
        // Find the header row containing days of the week
        outerLoop:
        for (let r = range.s.r; r <= Math.min(range.e.r, 10); r++) { // Check only first 10 rows
          let daysFound = 0;
          
          for (let c = range.s.c; c <= range.e.c; c++) {
            const cellAddress = XLSX.utils.encode_cell({r, c});
            const cell = worksheet[cellAddress];
            
            if (!cell || !cell.v) continue;
            
            const cellValue = String(cell.v).trim();
            
            // Improved day matching to handle variations in day format
            daysOfWeek.forEach((day, index) => {
              if (cellValue.toLowerCase() === day.toLowerCase() || 
                  cellValue.toLowerCase().includes(day.toLowerCase())) {
                dayColumnIndices[index] = c;
                daysFound++;
              }
            });
          }
          
          if (daysFound >= 3) { // If we find at least 3 days, this is likely the header row
            headerRowIndex = r;
            break outerLoop;
          }
        }
        
        if (headerRowIndex === -1) {
          setMessage({ text: "Could not find header row with days of the week", type: "error" });
          setLoading(false);
          return;
        }
        
        // DEBUG: Log found day columns
        console.log("Day columns found:", Object.keys(dayColumnIndices).map(idx => 
          `${daysOfWeek[idx]} at column ${dayColumnIndices[idx]}`).join(", "));
        
        // Find the time/period column
        let timeColumnIndex = -1;
        
        // Look for a column with "PERIOD" or "TIME" header
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cellAddress = XLSX.utils.encode_cell({r: headerRowIndex, c});
          const cell = worksheet[cellAddress];
          
          if (!cell || !cell.v) continue;
          
          const cellValue = String(cell.v).trim().toUpperCase();
          if (cellValue === "PERIOD" || cellValue === "TIME" || cellValue.includes("TIME") || cellValue.includes("PERIOD")) {
            timeColumnIndex = c;
            break;
          }
        }
        
        // If we couldn't find a labeled time column, look for one with time format
        if (timeColumnIndex === -1) {
          for (let c = range.s.c; c <= range.e.c; c++) {
            // Check the row after header for time formats
            const cellAddress = XLSX.utils.encode_cell({r: headerRowIndex + 1, c});
            const cell = worksheet[cellAddress];
            
            if (!cell || !cell.v) continue;
            
            const cellValue = String(cell.v);
            if (cellValue.match(/\d{1,2}:\d{2}/)) {
              timeColumnIndex = c;
              break;
            }
          }
        }
        
        if (timeColumnIndex === -1) {
          setMessage({ text: "Could not find time/period column", type: "error" });
          setLoading(false);
          return;
        }
        
        // Second pass for days that might not have been found with exact match
        // This helps with Excel files that might abbreviate days (Thu instead of Thursday)
        if (Object.keys(dayColumnIndices).length < daysOfWeek.length) {
          for (let c = range.s.c; c <= range.e.c; c++) {
            const cellAddress = XLSX.utils.encode_cell({r: headerRowIndex, c});
            const cell = worksheet[cellAddress];
            
            if (!cell || !cell.v) continue;
            
            const cellValue = String(cell.v).trim().toLowerCase();
            
            // Check for abbreviated/partial matches
            daysOfWeek.forEach((day, index) => {
              if (!dayColumnIndices[index] && // Skip if already found
                  (cellValue.startsWith(day.toLowerCase().substring(0, 3)) || // e.g., "Thu" for "Thursday"
                   day.toLowerCase().startsWith(cellValue))) { // e.g., "Thursday" for "Thur"
                dayColumnIndices[index] = c;
              }
            });
          }
        }
        
        // Process the timetable data
        const extractedEntries = [];
        
        // Start from the row after header
        for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
          // Get the time slot for this row, handling merged cells
          const timeSlot = getTimeSlotForRow(worksheet, r, timeColumnIndex);
          
          if (!timeSlot) continue; // Skip rows without valid time slots
          
          // Process each day column
          for (let dayIndex = 0; dayIndex < daysOfWeek.length; dayIndex++) {
            const columnIndex = dayColumnIndices[dayIndex];
            if (columnIndex === undefined) {
              // Log when a day is not found
              console.log(`Column for ${daysOfWeek[dayIndex]} not found in the Excel file`);
              continue;
            }
            
            // Get cell value for this day, handling merged cells
            let cellValue = null;
            const cellAddress = XLSX.utils.encode_cell({r, c: columnIndex});
            const cell = worksheet[cellAddress];
            
            if (cell && cell.v) {
              cellValue = cell.v;
            } else {
              // Check if this cell is part of a merged range
              for (const merge of mergedCells) {
                if (r >= merge.s.r && r <= merge.e.r && 
                    columnIndex >= merge.s.c && columnIndex <= merge.e.c) {
                  // If it's in a merged range, get the value from the top-left cell
                  const mergedCellAddress = XLSX.utils.encode_cell({
                    r: merge.s.r, 
                    c: merge.s.c
                  });
                  const mergedCell = worksheet[mergedCellAddress];
                  if (mergedCell && mergedCell.v) {
                    cellValue = mergedCell.v;
                    break;
                  }
                }
              }
            }
            
            if (!cellValue) continue;
            
            try {
              const parsedCell = parseCellEntry(cellValue);
              if (!parsedCell) continue;
              
              const { subject, facultyCodes, year, division } = parsedCell;
              const facultyList = findFacultyByCode(facultyCodes);
              
              if (subject) {
                extractedEntries.push({
                  name: roomName,
                  day: daysOfWeek[dayIndex],
                  startTime: timeSlot.startTime,
                  endTime: timeSlot.endTime,
                  faculty: facultyList,
                  subject: subject,
                  capacity: capacity,
                  type: roomType,
                  class: {
                    year: year,
                    division: division
                  }
                });
              }
            } catch (cellError) {
              console.warn("Error processing cell:", cellValue, cellError);
              // Continue with other cells even if one fails
            }
          }
        }
        
        // Merge consecutive time slots
        const mergedEntries = mergeConsecutiveSlots(extractedEntries);
        
        // Group by day to verify all days have data
        const entriesByDay = {};
        daysOfWeek.forEach(day => {
          entriesByDay[day] = mergedEntries.filter(entry => entry.day === day);
        });
        
        console.log("Entries by day:", Object.keys(entriesByDay).map(day => 
          `${day}: ${entriesByDay[day].length} entries`).join(", "));
        
        setExtractedData(mergedEntries);
        setMessage({ 
          text: `Successfully extracted ${extractedEntries.length} entries and merged into ${mergedEntries.length} entries`, 
          type: "success" 
        });
      } catch (error) {
        console.error("Error processing Excel file:", error);
        setMessage({ text: "Error processing Excel file: " + error.message, type: "error" });
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setMessage({ text: "Error reading file", type: "error" });
      setLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleSubmitAll = async () => {
    if (extractedData.length === 0) {
      setMessage({ text: "No data to submit", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "Submitting timetable entries...", type: "info" });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const entry of extractedData) {
      try {
        await axios.post("http://localhost:5000/api/rooms/add", entry, {
          headers: { "Content-Type": "application/json" },
        });
        successCount++;
      } catch (error) {
        console.error("Error adding entry:", error);
        errorCount++;
      }
    }
    
    setLoading(false);
    setMessage({ 
      text: `Submitted ${successCount} entries successfully. ${errorCount > 0 ? `Failed to submit ${errorCount} entries.` : ''}`, 
      type: errorCount > 0 ? "warning" : "success" 
    });
    
    // Reset data after submission
    if (successCount > 0) {
      setExtractedData([]);
      setFile(null);
    }
  };

  return (
    <>
      <Navbar />
       <Card style={{ maxWidth: 600, margin: "40px auto", padding: "20px" }}>
      <CardContent>
        <Grid container spacing={2} style={{ marginBottom: "20px" }}>
          <Grid item xs={12}>
            <TextField
              label="Room/Lab Name"
              fullWidth
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label="Room Type"
              fullWidth
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              required
              SelectProps={{ native: true }}
            >
              <option value=""></option>
              <option value="Classroom">Classroom</option>
              <option value="Lab">Lab</option>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Capacity"
              type="number"
              fullWidth
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </Grid>
        </Grid>
        
        <input
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          id="excel-file-input"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="excel-file-input">
          <Button 
            variant="outlined" 
            component="span" 
            fullWidth
            style={{ marginBottom: "10px" }}
          >
            Select Excel File
          </Button>
        </label>
        
        {file && (
          <Typography variant="body2" style={{ marginBottom: "10px" }}>
            Selected file: {file.name}
          </Typography>
        )}
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={processExcelFile}
          disabled={loading || !file}
          fullWidth
          style={{ marginBottom: "10px" }}
        >
          Process Excel File
        </Button>
        
        {message.text && (
          <Alert severity={message.type} style={{ marginTop: "10px", marginBottom: "10px" }}>
            {message.text}
          </Alert>
        )}
        
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <CircularProgress />
          </div>
        )}
        
        {extractedData.length > 0 && (
          <>
            <Typography variant="subtitle1" style={{ marginTop: "20px" }}>
              Extracted {extractedData.length} timetable entries
            </Typography>
            
            <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
              {extractedData.map((entry, index) => (
                <div key={index} style={{ padding: "5px", borderBottom: "1px solid #eee" }}>
                  <Typography variant="body2">
                    <strong>{entry.day}</strong>, {entry.startTime}-{entry.endTime}: {entry.subject} - 
                    {entry.faculty.length > 0 
                      ? <span style={{color: "#007700"}}>{entry.faculty.join(", ")}</span> 
                      : <span style={{color: "#CC0000"}}>No faculty matched</span>}
                    {entry.class && (entry.class.year || entry.class.division) && 
                      <span style={{color: "#0055AA"}}> ({entry.class.year}-{entry.class.division})</span>}
                  </Typography>
                </div>
              ))}
            </div>
            
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleSubmitAll}
              disabled={loading}
              fullWidth
            >
              Submit All Entries
            </Button>
          </>
        )}
      </CardContent>
    </Card></>
  );
};

export default AdminTimeTableInput;