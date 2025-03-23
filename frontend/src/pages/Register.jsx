import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { TextField, Button, Container, Typography, MenuItem, Box } from "@mui/material";

// Faculty list with predefined names and roles
const facultyRoles = {
  "Dr. Vinaya Sawant (VS)": "HOD",
  "Ms. Neha Katre (NK)": "Admin",
  "Prasad Sir":"Lab Assistant"
};

const facultyNames = [
  "Dr. Vinaya Sawant (VS)", "Dr. Abhijit Joshi (ARJ)", "Dr. Ram Mangulkar (RM)",
  "Dr. SatishKumar Verma (SV)", "Dr. Monika Mangla (MM)", "Ms. Neha Katre (NK)",
  "Mr. Harshal Dalvi (HD)", "Mr. Arjun Jaiswal (AJ)", "Ms. Stevina Coriea (SC)",
  "Ms. Prachi Satan (PS)", "Ms. Neha Agarwal (NA)", "Ms. Sharvari Patil (SP)",
  "Ms. Richa Sharma (RS)", "Ms. Sweedle Machado (SM)", "Ms. Priyanca Gonsalves (PG)",
  "Ms. Anushree Patkar (AP)", "Ms. Monali Sankhe (MS)", "Ms. Savyasachi Pandit (SSP)",
  "Mr. Chandrashekhar Badgujar (CB)", "Mr. Suryakant Chaudhari (STC)", "Dr. Gayatri Pandya (GP)",
  "Dr. Naresh Afre (NAF)", "Mr. Pravin Hole (PH)", "Ms. Leena Sahu (LS)","Prasad Sir"
];

// const obj = {
//   1 : "abc@mgail.com",
//   2 : "sakfjds",

// }

// obj[id]

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(""); // Role will be auto-assigned
  const { register } = useAuth();
  const navigate = useNavigate();

  // Function to set role automatically
  const handleNameChange = (event) => {
    const selectedName = event.target.value;
    setName(selectedName);
    setRole(facultyRoles[selectedName] || "Teacher"); // Default role is 'teacher'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(name, email, password, role);
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Register</Typography>
      <form onSubmit={handleSubmit}>
        {/* Faculty Name Dropdown */}
        <TextField select label="Select Name" fullWidth margin="normal" value={name} onChange={handleNameChange}>
          {facultyNames.map((faculty, index) => (
            <MenuItem key={index} value={faculty}>{faculty}</MenuItem>
          ))}
        </TextField>

        <TextField label="Email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />

        {/* Role (Auto-selected based on Name) */}
        <TextField label="Role" fullWidth margin="normal" value={role} disabled />

        <Button type="submit" variant="contained" color="primary" fullWidth>Register</Button>
      </form>

      {/* Link to Login */}
      <Box mt={2} textAlign="center">
        <Typography variant="body1">
          Already have an account? <Link to="/login" style={{ color: "blue", textDecoration: "none" }}>Login here</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default Register;
