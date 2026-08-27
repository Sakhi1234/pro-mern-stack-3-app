const express = require('express');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt = require('jsonwebtoken');
const { getDb } = require('./db.js');
const { AppError } = require('./errors.js');

let { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV !== 'production') {
    JWT_SECRET = 'tempjwtsecretfordevonly';
    console.log('Missing env var JWT_SECRET. Using unsafe dev secret');
  } else {
    console.log('Missing env var JWT_SECRET. Authentication disabled');
  }
}

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback',
  UI_SERVER_ORIGIN = 'http://localhost:9000',
  AUTH_SUCCESS_REDIRECT = UI_SERVER_ORIGIN,
  AUTH_FAILURE_REDIRECT = `${UI_SERVER_ORIGIN}/?auth=failed`,
} = process.env;

const routes = express.Router();
routes.use(express.json());

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function deriveGivenName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'User';
  return trimmed.split(/\s+/)[0] || trimmed;
}

function buildUserPayload(userDoc) {
  return {
    signedIn: true,
    givenName: userDoc.givenName || deriveGivenName(userDoc.name),
    name: userDoc.name,
    email: userDoc.email,
  };
}

function cookieOptions() {
  const options = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
  if (process.env.COOKIE_DOMAIN) options.domain = process.env.COOKIE_DOMAIN;
  return options;
}

function getUser(req) {
  const token = req.cookies.jwt;
  if (!token) return { signedIn: false };

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return { signedIn: false };
  }
}

function signUserIn(res, user) {
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('jwt', token, cookieOptions());
}

function getGoogleEmail(profile) {
  return normalizeEmail(profile.emails?.find((email) => email.value)?.value);
}

async function findOrCreateGoogleUser(profile) {
  const db = getDb();
  const email = getGoogleEmail(profile);

  if (!email) {
    throw new AppError('Google account did not provide an email address', 'BAD_USER_INPUT');
  }

  const name = profile.displayName || email;
  const givenName = profile.name?.givenName || deriveGivenName(name);
  const googleProfile = {
    id: profile.id,
    email,
    name,
    givenName,
    photo: profile.photos?.[0]?.value || '',
  };

  const existing = await db.collection('users').findOne({
    $or: [
      { googleId: profile.id },
      { email },
    ],
  });

  if (existing) {
    await db.collection('users').updateOne(
      { _id: existing._id },
      {
        $set: {
          email,
          name,
          givenName,
          googleId: profile.id,
          googleProfile,
          authProvider: 'google',
          updated: new Date(),
        },
      },
    );
    return buildUserPayload({
      ...existing,
      email,
      name,
      givenName,
    });
  }

  const userDoc = {
    email,
    name,
    givenName,
    googleId: profile.id,
    googleProfile,
    authProvider: 'google',
    created: new Date(),
    updated: new Date(),
  };

  const insertResult = await db.collection('users').insertOne(userDoc);
  const saved = await db.collection('users').findOne({ _id: insertResult.insertedId });
  return buildUserPayload(saved);
}

const googleAuthConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

if (googleAuthConfigured) {
  passport.use(new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    (_accessToken, _refreshToken, profile, done) => {
      findOrCreateGoogleUser(profile)
        .then((user) => done(null, user))
        .catch((err) => done(err));
    },
  ));
} else {
  console.log('Missing Google OAuth env vars. Google sign-in disabled');
}

function requireGoogleConfig(_req, res, next) {
  if (!JWT_SECRET) {
    res.status(500).send('Missing JWT_SECRET. Refusing to authenticate');
    return;
  }

  if (!googleAuthConfigured) {
    res.status(500).json({
      error: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
    });
    return;
  }

  next();
}

routes.get(
  '/google',
  requireGoogleConfig,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }),
);

routes.get('/google/callback', requireGoogleConfig, (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err) {
      next(err);
      return;
    }

    if (!user) {
      res.redirect(AUTH_FAILURE_REDIRECT);
      return;
    }

    signUserIn(res, user);
    res.redirect(AUTH_SUCCESS_REDIRECT);
  })(req, res, next);
});

routes.post('/signout', async (_req, res) => {
  res.clearCookie('jwt', cookieOptions());
  res.json({ status: 'ok' });
});

routes.get('/user', (req, res) => {
  res.json(getUser(req));
});

function mustBeSignedIn(resolver) {
  return (root, args, context) => {
    const { user } = context;
    if (!user || !user.signedIn) {
      throw new AppError('You must be signed in', 'UNAUTHENTICATED');
    }
    return resolver(root, args, context);
  };
}

function resolveUser(_root, _args, { user }) {
  return user;
}

module.exports = {
  routes,
  getUser,
  mustBeSignedIn,
  resolveUser,
};
