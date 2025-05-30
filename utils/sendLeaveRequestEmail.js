const nodemailer = require("nodemailer");

const sendLeaveRequestEmail = async (
  managerEmail,
  employeeName,
  startDate,
  endDate,
  reason
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

  const dashboardLink = `${process.env.FRONTEND_URL}`;

  const mailOptions = {
    from: `"SO Attendance System" <${process.env.EMAIL_SENDER}>`,
    to: managerEmail,
    subject: "📝 Leave Request from Employee",
    html: `
      <p>Hello,</p>
      <p>You have received a new leave request from <strong>${employeeName}</strong>.</p>
      <ul>
        <li><strong>Start Date:</strong> ${new Date(
          startDate
        ).toDateString()}</li>
        <li><strong>End Date:</strong> ${new Date(endDate).toDateString()}</li>
        <li><strong>Reason:</strong> ${reason}</li>
      </ul>
      <p>
        👉 <a href="${dashboardLink}" target="_blank">Click here to review and approve the request</a>
      </p>
     `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendLeaveRequestEmail;
