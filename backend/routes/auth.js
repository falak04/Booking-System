const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Faculty = require("../models/Falculty");
const { authenticateUser } = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");

const router = express.Router();

const validRoles = ["Teacher", "Lab Assistant", "HOD", "Admin"];
const isHOD = (role) => role === "HOD";

// ✅ Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const faculty = await Faculty.findOne({ name });
    if (!faculty) {
      return res.status(403).json({ error: "You are not authorized to register." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: faculty.role });

    await user.save();
    res.status(201).json({ message: "User registered successfully", role: faculty.role });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ error: "Error registering user" });
  }
});

// ✅ Login
router.post("/login", async (req, res) => {
  try {
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

// ✅ Add Faculty (HOD only)
router.post("/add-faculty", authenticateUser, async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!isHOD(req.user.role)) {
      return res.status(403).json({ error: "Only HOD can add faculty members" });
    }

    if (!name) {
      return res.status(400).json({ error: "Faculty name is required" });
    }

    const existingFaculty = await Faculty.findOne({ name });
    if (existingFaculty) {
      return res.status(400).json({ error: "Faculty already exists" });
    }

    const faculty = new Faculty({ name, role: validRoles.includes(role) ? role : "Teacher" });
    await faculty.save();

    res.status(201).json({ message: "Faculty added successfully", faculty });
  } catch (err) {
    console.error("❌ Add Faculty Error:", err);
    res.status(500).json({ error: "Error adding faculty member" });
  }
});

// ✅ Remove Faculty (HOD only)
router.delete("/remove-faculty", authenticateUser, async (req, res) => {
  try {
    const { name } = req.body;
    if (!isHOD(req.user.role)) {
      return res.status(403).json({ error: "Only HOD can remove faculty members" });
    }

    const faculty = await Faculty.findOne({ name });
    if (!faculty) {
      return res.status(404).json({ error: "Faculty member not found" });
    }

    if (faculty.role === "HOD") {
      return res.status(403).json({ error: "Cannot remove HOD from faculty list" });
    }

    await Faculty.deleteOne({ name });
    await User.deleteOne({ name }); // Optional: remove user login if exists

    res.status(200).json({ message: "Faculty removed successfully", facultyName: name });
  } catch (err) {
    console.error("❌ Remove Faculty Error:", err);
    res.status(500).json({ error: "Error removing faculty member" });
  }
});

// ✅ Get All Faculty (optional auth for HOD flag)
router.get("/faculty-list", optionalAuth, async (req, res) => {
  try {
    const user = req.user;
    const isHodRequest = user && isHOD(user.role);

    const facultyList = await Faculty.find({});
    const registeredUsers = await User.find({}, "name");
    const registeredNames = registeredUsers.map(user => user.name);

    const result = facultyList.map(faculty => ({
      name: faculty.name,
      role: faculty.role,
      isRegistered: isHodRequest ? registeredNames.includes(faculty.name) : undefined,
    }));

    res.status(200).json({ facultyList: result });
  } catch (err) {
    console.error("❌ Get Faculty List Error:", err);
    res.status(500).json({ error: "Error retrieving faculty list" });
  }
});

module.exports = router;
