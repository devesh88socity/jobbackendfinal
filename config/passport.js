// config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      accessType: "offline",
      prompt: "consent",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            role: "Employee", // default role
            leaves: 0,
            googleRefreshToken: refreshToken, // save refresh token here
          });
          await user.save();
        } else if (refreshToken) {
          // Update refreshToken on every login if it's present (it may be null sometimes)
          user.googleRefreshToken = refreshToken;
          await user.save();
        }

        // Generate JWT tokens as before
        const accessTokenJWT = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );

        const refreshTokenJWT = jwt.sign(
          { id: user._id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "7d" }
        );

        return done(null, {
          accessToken: accessTokenJWT,
          refreshToken: refreshTokenJWT,
          user,
        });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
