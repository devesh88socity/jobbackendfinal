const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const sendLeaveStatusEmail = async (
  toEmail,
  employeeName,
  startDate,
  endDate,
  reason,
  status, // "Approved" or "Rejected"
  approverName,
  leaveType
) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // or your own redirect URI
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_SENDER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const capitalizedStatus =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const formattedStartDate = new Date(startDate).toDateString();
    const formattedEndDate = new Date(endDate).toDateString();
    const formattedLeaveType =
      leaveType === "WorkFromHome" ? "Work From Home" : `${leaveType} Leave`;

    const mailOptions = {
      from: `"SO Attendance System" <${process.env.EMAIL_SENDER}>`,
      to: toEmail,
      subject: `📩 Your ${leaveType} Request Has Been ${capitalizedStatus}`,
      html: `
        <p>Hi <strong>${employeeName}</strong>,</p>
        <p>Your ${formattedLeaveType} request has been <strong>${capitalizedStatus}</strong> by <strong>${approverName}</strong>.</p>
        <ul>
          <li><strong>Start Date:</strong> ${formattedStartDate}</li>
          <li><strong>End Date:</strong> ${formattedEndDate}</li>
          <li><strong>Reason:</strong> ${reason}</li>
        </ul>
        <p>To view the details, please visit your dashboard:</p>
        <p>
          👉 <a href="${process.env.FRONTEND_URL}" target="_blank">Go to Dashboard</a>
        </p>
        <br />
        <p>Regards,<br />SO Attendance System</p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Leave status email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending leave status email:", error);
    throw error;
  }
};

module.exports = sendLeaveStatusEmail;
