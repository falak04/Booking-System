import React from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Welcome() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", marginTop: 10 }}>
      <Typography variant="h3" gutterBottom>
        Welcome to the Booking System
      </Typography>
      <Typography variant="h6" gutterBottom>
        Please register if you're a new user or log in if you already have an account.
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 4 }}>
        <Button variant="contained" color="primary" onClick={() => navigate("/register")}>
          Register
        </Button>
        <Button variant="contained" color="secondary" onClick={() => navigate("/login")}>
          Login
        </Button>
      </Box>
    </Container>
  );
}

export default Welcome;
