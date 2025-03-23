const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Predefined Faculty List and Roles
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

// Get Role Function
const getRole = (name) => facultyRoles[name] || "Teacher";

// Register Route
router.post("/register", async (req, res) => {
  try {
    console.log("📌 Register request received:", req.body);
    const { name, email, password } = req.body;

    // Check if the user is in the allowed faculty list
    if (!facultyNames.includes(name)) {
      return res.status(403).json({ error: "You are not authorized to register." });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    console.log("📌 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Automatically assign the correct role
    const role = getRole(name);

    console.log("📌 Creating new user...");
    const user = new User({ name, email, password: hashedPassword, role });

    console.log("📌 Saving user to DB...");
    await user.save();

    console.log("✅ User registered successfully with role:", role);
    res.status(201).json({ message: "User registered successfully", role });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ error: "Error registering user" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    console.log("📌 Login request received:", req.body);
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("✅ Login successful for:", user.email);
    res.status(200).json({
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "Error logging in" });
  }
});

module.exports = router;
