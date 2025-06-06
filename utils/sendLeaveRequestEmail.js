const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const sendLeaveRequestEmail = async (
  recipientEmails, // array of emails
  employeeName,
  startDate,
  endDate,
  reason,
  leaveType
) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // Or your own redirect URI
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

    const dashboardLink = `${process.env.FRONTEND_URL}`;
    const formattedLeaveType =
      leaveType === "WorkFromHome" ? "Work From Home" : `${leaveType} Leave`;

    const mailOptions = {
      from: `"SO Attendance System" <${process.env.EMAIL_SENDER}>`,
      to: recipientEmails.join(","),
      subject: `📝 ${formattedLeaveType} Request from Employee ${employeeName}`,
      html: `
        <p>Hello,</p>
        <p>You have received a new ${formattedLeaveType} request from <strong>${employeeName}</strong>.</p>
        <ul>
          <li><strong>Start Date:</strong> ${new Date(
            startDate
          ).toDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(
            endDate
          ).toDateString()}</li>
          <li><strong>Reason:</strong> ${reason}</li>
        </ul>
        <p>
          👉 <a href="${dashboardLink}" target="_blank">Click here to review and approve the request</a>
        </p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Leave request email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending leave request email:", error);
    throw error;
  }
};

module.exports = sendLeaveRequestEmail;
