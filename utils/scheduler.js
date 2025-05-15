// utils/scheduler.js
const cron = require("node-cron");
const User = require("../models/user.model");

// Run at 00:00 on the 1st of every month
cron.schedule("0 0 1 * *", async () => {
  console.log("Adding 1.82 leaves to all employees...");
  await User.updateMany({}, { $inc: { leaves: 1.82 } });
});
