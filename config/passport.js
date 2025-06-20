const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const sendWelcomeEmail = require("../utils/sendWelcomeEmail");

// ✅ Inject custom authorization params into Google OAuth request
GoogleStrategy.prototype.authorizationParams = function (options) {
  return {
    access_type: "offline",
    prompt: "consent",
  };
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_REDIRECT_URI || "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const name = profile.displayName;
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(
            new Error("Google account does not expose an email."),
            null
          );
        }

        let user = await User.findOne({ googleId });

        let isFirstLogin = false;

        if (!user) {
          user = new User({
            name,
            email,
            googleId,
            role: "Employee", // default
            leaves: 0,
            googleRefreshToken: refreshToken || null,
          });
          await user.save();
          isFirstLogin = true;
        } else if (refreshToken) {
          user.googleRefreshToken = refreshToken;
          await user.save();
        }

        if (isFirstLogin) {
          sendWelcomeEmail(user.email, user.name).catch((err) =>
            console.error("Failed to send welcome email:", err)
          );
        }

        // Generate access token (15 min)
        const accessTokenJWT = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "4h", algorithm: "HS256" }
        );

        // Generate refresh token (7 days)
        const refreshTokenJWT = jwt.sign(
          { id: user._id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "365d", algorithm: "HS256" }
        );

        return done(null, {
          accessToken: accessTokenJWT,
          refreshToken: refreshTokenJWT,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      } catch (err) {
        console.error("Google OAuth Strategy Error:", err);
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
