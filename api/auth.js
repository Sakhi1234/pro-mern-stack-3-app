const express = require('express');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const jwt = require('jsonwebtoken');
const { randomBytes, pbkdf2Sync, timingSafeEqual } = require('crypto');
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

const routes = express.Router();
routes.use(express.json());

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
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

function makePasswordRecord(password, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, passwordRecord) {
  if (!passwordRecord?.salt || !passwordRecord?.hash) return false;

  const candidate = makePasswordRecord(password, passwordRecord.salt).hash;
  const stored = Buffer.from(passwordRecord.hash, 'hex');
  const attempted = Buffer.from(candidate, 'hex');
  if (stored.length !== attempted.length) return false;
  return timingSafeEqual(stored, attempted);
}

async function findUserByEmail(email) {
  const db = getDb();
  return db.collection('users').findOne({ email: normalizeEmail(email) });
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
  const cookieConfig = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
  if (process.env.COOKIE_DOMAIN) cookieConfig.domain = process.env.COOKIE_DOMAIN;
  res.cookie('jwt', token, cookieConfig);
}

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    session: false,
  },
  (email, password, done) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      done(null, false, { message: 'Email and password are required' });
      return;
    }

    findUserByEmail(normalizedEmail)
      .then((userDoc) => {
        if (!userDoc) {
          done(null, false, { message: 'Account not found. Please create an account first.' });
          return;
        }

        if (!verifyPassword(password, userDoc.password)) {
          done(null, false, { message: 'Invalid email or password' });
          return;
        }

        done(null, buildUserPayload(userDoc));
      })
      .catch((err) => done(err));
  },
));

routes.post('/signup', async (req, res, next) => {
  try {
    if (!JWT_SECRET) {
      res.status(500).send('Missing JWT_SECRET. Refusing to authenticate');
      return;
    }

    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password || '';
    const name = (req.body?.name || '').trim();

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email and password are required' });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please enter a valid email address' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    const db = getDb();
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const userDoc = {
      email,
      name,
      givenName: deriveGivenName(name),
      password: makePasswordRecord(password),
      created: new Date(),
      updated: new Date(),
    };

    const result = await db.collection('users').insertOne(userDoc);
    const saved = await db.collection('users').findOne({ _id: result.insertedId });
    const user = buildUserPayload(saved);
    signUserIn(res, user);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

routes.post('/signin', (req, res, next) => {
  if (!JWT_SECRET) {
    res.status(500).send('Missing JWT_SECRET. Refusing to authenticate');
    return;
  }

  if (!isValidEmail(req.body?.email)) {
    res.status(400).json({ error: 'Please enter a valid email address' });
    return;
  }

  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      next(err);
      return;
    }
    if (!user) {
      res.status(401).json({ error: info?.message || 'Invalid credentials' });
      return;
    }

    signUserIn(res, user);
    res.json(user);
  })(req, res, next);
});

routes.post('/signout', async (_req, res) => {
  res.clearCookie('jwt');
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
