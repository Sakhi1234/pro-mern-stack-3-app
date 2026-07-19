require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');

const { connectToDb } = require('./db.js');
const auth = require('./auth.js');
const restRoutes = require('./rest_routes.js');

const app = express();

const uiOrigin = process.env.UI_SERVER_ORIGIN || 'http://localhost:9000';
const corsOptions = {
  origin: uiOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use((req, _res, next) => {
  req.user = auth.getUser(req);
  next();
});

app.use('/auth', auth.routes);
app.use('/api', restRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.code === 'UNAUTHENTICATED') {
    res.status(401).json({ error: err.message, code: err.code });
    return;
  }
  if (err?.code === 'BAD_USER_INPUT') {
    res.status(400).json({ error: err.message, code: err.code, details: err.details || [] });
    return;
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 3000;

(async function start() {
  try {
    await connectToDb();
    app.listen(port, () => {
      console.log(`API server started on port ${port}`);
    });
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}());
