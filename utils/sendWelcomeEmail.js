//utils/sendWelcomeEmail.js
const nodemailer = require("nodemailer");

const sendWelcomeEmail = async (email, name) => {
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
    from: `"So Attendance System" <${process.env.EMAIL_SENDER}>`,
    to: email,
    subject: "🎉 Welcome to Our Platform!",
    html: `<p>Hi ${name},</p><p>Welcome aboard! We're excited to have you with us.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendWelcomeEmail;
