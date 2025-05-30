const nodemailer = require("nodemailer");

const sendLeaveStatusEmail = async (
  toEmail,
  employeeName,
  startDate,
  endDate,
  reason,
  status,
  approverName
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_SENDER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  });

  const mailOptions = {
    from: `"SO Attendance System" <${process.env.EMAIL_SENDER}>`,
    to: toEmail,
    subject: `✅ Your Leave Request has been ${status}`,
    html: `
      <p>Hi ${employeeName},</p>
      <p>Your leave request from <strong>${new Date(
        startDate
      ).toDateString()}</strong> to <strong>${new Date(
      endDate
    ).toDateString()}</strong> has been <strong>${status}</strong>.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p><strong>Approved/Rejected By:</strong> ${approverName}</p>
      <br />
      <p>Check your dashboard for more details: <a href="${
        process.env.FRONTEND_URL
      }" target="_blank">Go to Dashboard</a></p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendLeaveStatusEmail;
