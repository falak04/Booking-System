const express = require("express");
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/auth");
// async function removeExpiredBookings() {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Normalize to start of the day

//     console.log("⏳ Running Cleanup: Checking for expired bookings...");

//     // 1️⃣ Find expired bookings
//     const expiredBookings = await Booking.find({ date: { $lt: today-1 } });

//     if (expiredBookings.length === 0) {
//       console.log("✅ No expired bookings found.");
//       return;
//     }

//     console.log(`🚨 Found ${expiredBookings.length} expired bookings.`);

//     // 2️⃣ Remove expired bookings from the timetable
//     for (const booking of expiredBookings) {
//       const room = await Room.findOne({ name: booking.classroom });

//       if (room) {
//         const [startTime, endTime] = booking.timeSlot.split("-");

//         // Remove matching schedule entry
//         room.schedule = room.schedule.filter(
//           (entry) => !(entry.day === booking.day && entry.startTime === startTime && entry.endTime === endTime)
//         );

//         await room.save();
//       }
//     }

//     // 3️⃣ Delete expired bookings from the database
//     await Booking.deleteMany({ date: { $lt: today } });

//     console.log("🗑️ Expired bookings removed successfully!");
//   } catch (error) {
//     console.error("🚨 Error in removing expired bookings:", error);
//   }
// }

// 📌 Teacher Requests a Booking (Temporarily Block Slot
router.post("/", authenticateUser, async (req, res) => {
  try {
    console.log("Received booking request:", req.body);

    const { roomId, date, day, timeSlot, purpose } = req.body; // Ensure `day` is extracted
    console.log("Step 1: Checking existing bookings");
    console.log(req.user)
    // Check if the slot is already booked
    const existingBooking = await Booking.findOne({
      classroom: roomId,
      date,
      timeSlot,
      status: { $ne: "Rejected" }, // Ignore rejected bookings
    });

    if (existingBooking) {
      return res.status(400).json({ error: "This time slot is already booked." });
    }

    console.log("Step 2: Creating new booking");
    const booking = new Booking({
      teacher: req.user.id,
      classroom: roomId,
      date,
      day, // Include the day
      timeSlot,
      purpose,
      status: "Pending",
      hodStatus: "Pending",
    });

    await booking.save();
    console.log("Step 3: Booking saved successfully!");

    // 📌 **TEMPORARILY BLOCK SLOT IN TIMETABLE**
    console.log("Step 4: Updating room schedule temporarily");
    const room = await Room.findOne({ name: roomId });

    if (!room) {
      console.error("🚨 Error: Room not found in the database!");
      return res.status(404).json({ error: "Room not found" });
    }

    const [startTime, endTime] = timeSlot.split("-");
    console.log("Step 5: Adding temporary slot in room timetable");

    room.schedule.push({
      day,
      startTime,
      endTime,
      subject: "Pending Approval",
      faculty: req.user.name,
      approvalStatus:"pendingApproval"
       // Assigning booking requester's name
    });

    await room.save();
    console.log("Step 6: Room schedule updated successfully");

    res.status(201).json({ message: "Booking request submitted!", booking });

  } catch (error) {
    console.error("🚨 Error in booking:", error.message);
    res.status(500).json({ error: "Server error while processing booking." });
  }
});


// 📌 Get All Bookings (For Admin & HOD)
router.get("/", authenticateUser, authorizeRole(["Admin", "HOD"]), async (req, res) => {
  try {
    // await removeExpiredBookings();
    const bookings = await Booking.find().populate("teacher", "name email");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching bookings" });
  }
});

// 📌 Admin Approves Booking
router.put("/admin/approve/:id", authenticateUser, authorizeRole(["Admin"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.status !== "Pending") {
      return res.status(400).json({ error: "Booking already processed" });
    }

    // **Find the Room**
    const room = await Room.findOne({ name: booking.classroom });
    if (room) {
      console.log("🏫 Room Before Update:", room);

      // ✅ **Extract Start & End Time from booking**
      const [startTime, endTime] = booking.timeSlot.split("-");

      // ✅ **Convert booking.date to the corresponding day**
      const bookingDate = new Date(booking.date);
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const bookingDay = daysOfWeek[bookingDate.getUTCDay()]; // Ensure correct day conversion

      // ✅ **Update the Subject in Schedule**
      room.schedule = room.schedule.map((entry) => {
        if (entry.day === bookingDay && entry.startTime === startTime && entry.endTime === endTime) {
          return { ...entry, subject: "Approved by Admin" ,approvalStatus:"approved"}; // Update subject
        }
        return entry;
      });

      console.log("✅ Updated Room Schedule:", room.schedule);

      await room.save();
    }

    // ✅ **Update Booking Status**
    booking.status = "Approved by Admin";
    booking.hodStatus = "Pending";
    await booking.save();

    res.json({ message: "Booking approved by admin and updated in the schedule", booking });
  } catch (error) {
    console.error("🚨 Error Approving Booking:", error.message);
    res.status(500).json({ error: "Server error while approving booking." });
  }
});


// 📌 Admin Rejects Booking (Slot Becomes Available Again)
router.put("/admin/reject/:id", authenticateUser, authorizeRole(["Admin"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    console.log("🔍 Booking Details:", booking);

    if (booking.status !== "Pending") {
      return res.status(400).json({ error: "Booking already processed" });
    }

    // **Find the Room**
    const room = await Room.findOne({ name: booking.classroom });
    if (room) {
      console.log("🏫 Room Before Update:", room);

      // ✅ **Extract Start & End Time from booking**
      const [startTime, endTime] = booking.timeSlot.split("-");

      // ✅ **Convert booking.date to the corresponding day**
      const bookingDate = new Date(booking.date);
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const bookingDay = daysOfWeek[bookingDate.getUTCDay()]; // Ensure correct day conversion

      // ✅ **Filter out the rejected slot**
      room.schedule = room.schedule.filter(
        (entry) => !(entry.day === bookingDay && entry.startTime === startTime && entry.endTime === endTime)
      );

      console.log("✅ Updated Room Schedule:", room.schedule);

      await room.save();
    }

    // ✅ **Update Booking Status**
    booking.status = "Rejected";
    booking.hodStatus = "N/A";
    await booking.save();

    res.json({ message: "Booking rejected by admin and slot is now available", booking });
  } catch (error) {
    console.error("🚨 Error Rejecting Booking:", error.message);
    res.status(500).json({ error: "Server error while rejecting booking." });
  }
});


// 📌 HOD Grants Booking (Final Approval)
router.put("/hod/grant/:id", authenticateUser, authorizeRole(["HOD"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("teacher", "name");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.status !== "Approved by Admin") {
      return res.status(400).json({ error: "Booking must be approved by admin first" });
    }

    // ✅ Update Booking as Granted
    booking.hodStatus = "Granted";
    await booking.save();

    // ✅ FIND THE ROOM & UPDATE TIMETABLE
    const room = await Room.findOne({ name: booking.classroom });
    if (room) {
      console.log("🏫 Room Before Update:", room);

      // ✅ Extract start and end time
      const [startTime, endTime] = booking.timeSlot.split("-");

      // ✅ Convert booking.date to weekday
      const bookingDate = new Date(booking.date);
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const bookingDay = daysOfWeek[bookingDate.getUTCDay()];

      // ✅ Update schedule with final subject and faculty
      room.schedule = room.schedule.map((entry) => {
        if (entry.day === bookingDay && entry.startTime === startTime && entry.endTime === endTime) {
          return { ...entry, subject: booking.purpose, faculty: booking.teacher.name,approvalStatus:"granted" }; // Update subject & faculty
        }
        return entry;
      });

      console.log("✅ Updated Room Schedule:", room.schedule);
      await room.save();
    }

    res.json({ message: "Booking granted by HOD and updated in the schedule", booking });
  } catch (error) {
    console.error("🚨 Error Granting Booking:", error.message);
    res.status(500).json({ error: "Server error while granting booking." });
  }
});


// 📌 HOD Rejects Booking (Make Slot Available Again)
router.put("/hod/reject/:id", authenticateUser, authorizeRole(["HOD"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    console.log("🔍 Booking Details:", booking);

    if (booking.status !== "Approved by Admin") {
      return res.status(400).json({ error: "Booking must be approved by admin first" });
    }

    // **Find the Room**
    const room = await Room.findOne({ name: booking.classroom });
    if (room) {
      console.log("🏫 Room Before Update:", room);

      // ✅ **Extract Start & End Time from booking**
      const [startTime, endTime] = booking.timeSlot.split("-");

      // ✅ **Convert booking.date to the corresponding day**
      const bookingDate = new Date(booking.date);
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const bookingDay = daysOfWeek[bookingDate.getUTCDay()]; // Ensure correct day conversion

      // ✅ **Filter out the rejected slot**
      room.schedule = room.schedule.filter(
        (entry) => !(entry.day === bookingDay && entry.startTime === startTime && entry.endTime === endTime)
      );

      console.log("✅ Updated Room Schedule:", room.schedule);

      await room.save();
    }

    // ✅ **Update Booking Status**
    booking.hodStatus = "Rejected";
    await booking.save();

    res.json({ message: "Booking rejected by HOD and slot is now available", booking });
  } catch (error) {
    console.error("🚨 Error Rejecting Booking:", error.message);
    res.status(500).json({ error: "Server error while rejecting booking." });
  }
});


// 📌 Get Bookings for a Teacher (For Teacher Dashboard)
router.get("/teacher", authenticateUser, async (req, res) => {
  try {
    // await removeExpiredBookings();
    const bookings = await Booking.find({ teacher: req.user.id }).populate("teacher", "name email");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
