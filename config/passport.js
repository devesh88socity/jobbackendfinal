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
          });
          await user.save();
        }

        // Generate short-lived access token
        const accessTokenJWT = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "15m" } // shorter-lived access token
        );
        console.log(accessTokenJWT);
        // Generate long-lived refresh token
        const refreshTokenJWT = jwt.sign(
          { id: user._id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "7d" }
        );
        console.log(refreshTokenJWT);
        console.log(user);
        // Pass both tokens
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
