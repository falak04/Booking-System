const express = require("express");
const Room = require("../models/Room");
const { authenticateUser, authorizeRole } = require("../middleware/auth");
const router = express.Router();

/**
 * 📌 Add Predefined Rooms to Database (If Not Exists)
 */
router.post("/add-rooms", async (req, res) => {
  try {
    console.log(1)
    const rooms = [
      { name: "64", type: "Classroom", capacity: 70, location: "Department of Information Technology" },
      { name: "65", type: "Classroom", capacity: 70, location: "Department of Information Technology" },
      { name: "66", type: "Classroom", capacity: 70, location: "Department of Information Technology" },
      { name: "Lab1", type: "Lab", capacity: 35, location: "Department of Information Technology" },
      { name: "Lab2", type: "Lab", capacity: 35, location: "Department of Information Technology" },
      { name: "Lab3", type: "Lab", capacity: 35, location: "Department of Information Technology" }
    ];

    for (const room of rooms) {
      const existingRoom = await Room.findOne({ name: room.name });
      if (!existingRoom) {
        await Room.create({ ...room, schedule: [] });
      }
    }

    res.status(201).json({ message: "Rooms added successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📌 Get All Rooms (with details)
 */
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching rooms" });
  }
});

/**
 * 📌 Fetch Timetable for a Specific Room
 */
router.get("/:roomName/timetable", async (req, res) => {
  try {
    console.log(1);
    const { roomName } = req.params;
    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json({ timetable: room.schedule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📌 Fetch Available Rooms for a Given Day
 */
router.get("/available", async (req, res) => {
  try {
    const { day } = req.query;
    if (!day) {
      return res.status(400).json({ error: "Day is required" });
    }

    // Fetch all rooms
    const allRooms = await Room.find();

    // Fetch booked slots on the given day
    const bookedRooms = await Room.find({ "schedule.day": day });

    const bookedRoomMap = {};
    bookedRooms.forEach(room => {
      bookedRoomMap[room.name] = room.schedule
        .filter(sch => sch.day === day)
        .map(sch => ({ startTime: sch.startTime, endTime: sch.endTime }));
    });

    // Generate available time slots (from 08:00 to 17:30)
    const timeSlots = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
      "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
    ];

    // Find available slots for each room
    const availableRooms = {};
    allRooms.forEach(room => {
      const bookedSlots = bookedRoomMap[room.name] || [];
      const availableSlots = [];

      for (let i = 0; i < timeSlots.length - 1; i++) {
        const slotStart = timeSlots[i];
        const slotEnd = timeSlots[i + 1];

        const isBooked = bookedSlots.some(b => b.startTime < slotEnd && b.endTime > slotStart);
        if (!isBooked) {
          availableSlots.push({ startTime: slotStart, endTime: slotEnd });
        }
      }

      // Add room details (capacity & type) along with available slots
      availableRooms[room.name] = {
        type: room.type,
        capacity: room.capacity,
        availableSlots
      };
    });

    res.json(availableRooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:roomName/available-week", async (req, res) => {
  try {
    const { roomName } = req.params;
    const room = await Room.findOne({ name: roomName });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const timeSlots = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
      "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
    ];

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const availableWeekSchedule = {};

    daysOfWeek.forEach(day => {
      const bookedSlots = room.schedule.filter(sch => sch.day === day);
      const availableSlots = [];

      for (let i = 0; i < timeSlots.length - 1; i++) {
        const slotStart = timeSlots[i];
        const slotEnd = timeSlots[i + 1];
        const isBooked = bookedSlots.some(
          b => b.startTime < slotEnd && b.endTime > slotStart
        );
        if (!isBooked) {
          availableSlots.push({ startTime: slotStart, endTime: slotEnd });
        }
      }
      availableWeekSchedule[day] = availableSlots;
    });

    res.json({ roomName, availableWeekSchedule });
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching available timeslots" });
  }
});
/**
//  * 📌 Add or Update a Timetable Entry for a Room
//  */
/**
 * 📌 Add or Update a Timetable Entry for a Room
 */
router.post("/add", async (req, res) => {
  try {
    console.log("📥 Received Data:", req.body);

    const { name, day, startTime, endTime, faculty, subject, capacity, type } = req.body;

    if (!name || !day || !startTime || !endTime || !faculty || !subject || !capacity || !type) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let existingRoom = await Room.findOne({ name });

    if (!existingRoom) {
      console.log("⚠️ Room not found. Creating new room...");
      existingRoom = new Room({ name, type, capacity, location: "N/A", schedule: [] });
      await existingRoom.save();
    }

    const conflict = existingRoom.schedule.some(
      (entry) =>
        entry.day === day &&
        ((startTime >= entry.startTime && startTime < entry.endTime) ||
         (endTime > entry.startTime && endTime <= entry.endTime))
    );

    if (conflict) {
      return res.status(400).json({ error: "Time slot conflict! Room is already booked at this time." });
    }

    await Room.updateOne(
      { name },
      { 
        $push: { 
          schedule: { 
            day, 
            startTime, 
            endTime, 
            faculty: Array.isArray(faculty) ? faculty : [faculty], // ✅ Ensure faculty is an array
            subject 
          } 
        }, 
        $setOnInsert: { type, capacity, location: "N/A" }
      },
      { upsert: true }
    );

    console.log("✅ Room updated in database");

    res.status(201).json({ message: "Timetable entry added successfully!" });

  } catch (error) {
    console.error("❌ Error Saving Room:", error);
    res.status(500).json({ error: "Server error while adding timetable entry" });
  }
});

/**
 * 📌 Update a Timetable Entry (Subject & Faculty)
 */
router.put("/:roomName/schedule/:entryId", authenticateUser, authorizeRole(["Admin","Lab Assistant"]), async (req, res) => {
  try {
    const { roomName, entryId } = req.params;
    const { subject, faculty } = req.body;

    if (!subject || !faculty) {
      return res.status(400).json({ error: "Both subject and faculty are required." });
    }

    console.log(1);

    const room = await Room.findOneAndUpdate(
      { name: roomName, "schedule._id": entryId },
      { 
        $set: { 
          "schedule.$.subject": subject, 
          "schedule.$.faculty": Array.isArray(faculty) ? faculty : [faculty] // ✅ Ensure faculty is an array
        } 
      },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ error: "Room or schedule entry not found." });
    }

    res.json({ message: "Timetable entry updated successfully!", room });
  } catch (error) {
    console.error("❌ Error updating timetable:", error);
    res.status(500).json({ error: "Server error while updating timetable entry." });
  }
});

/**
 * 📌 Delete a Timetable Entry
 */
router.delete("/:roomName/schedule/:entryId", authenticateUser, authorizeRole(["Admin","Lab Assistant"]), async (req, res) => {
  try {
    const { roomName, entryId } = req.params;

    // ✅ Find room and remove the schedule entry
    const room = await Room.findOneAndUpdate(
      { name: roomName },
      { $pull: { schedule: { _id: entryId } } }, // Remove the entry with matching ID
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ error: "Room or schedule entry not found." });
    }

    res.json({ message: "Timetable entry deleted successfully!", room });
  } catch (error) {
    console.error("❌ Error deleting timetable entry:", error);
    res.status(500).json({ error: "Server error while deleting timetable entry." });
  }
});

module.exports = router;
