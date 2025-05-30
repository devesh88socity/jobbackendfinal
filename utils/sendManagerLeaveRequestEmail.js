const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const sendManagerLeaveRequestEmail = async (
  adminEmails, // ✅ Accepts array
  managerName,
  startDate,
  endDate,
  reason
) => {
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

    const mailOptions = {
      from: `"SO Attendance System" <${process.env.EMAIL_SENDER}>`,
      to: adminEmails.join(", "), // ✅ Join array to string
      subject: `📩 Leave Request from Manager ${managerName}`,
      text: `${managerName} has requested a leave from ${new Date(
        startDate
      ).toDateString()} to ${new Date(
        endDate
      ).toDateString()}.\nReason: ${reason}\nReview it at: ${dashboardLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <p>Hi Admin,</p>
          <p>You have received a new leave request from <strong>Manager ${managerName}</strong>.</p>
          <table style="margin: 10px 0; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 8px;"><strong>Start Date:</strong></td>
              <td>${new Date(startDate).toDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px;"><strong>End Date:</strong></td>
              <td>${new Date(endDate).toDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px;"><strong>Reason:</strong></td>
              <td>${reason}</td>
            </tr>
          </table>
          <p>
            <a href="${dashboardLink}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
              Review Manager's Request
            </a>
          </p>
          <p>Regards,<br/>SO Attendance System</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `Manager leave request email sent to: ${adminEmails.join(", ")}`
    );
  } catch (error) {
    console.error("Error sending manager leave request email:", error.message);
  }
};

module.exports = sendManagerLeaveRequestEmail;
