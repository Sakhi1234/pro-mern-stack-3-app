const { mustBeSignedIn } = require('./auth.js');

let aboutMessage = 'Issue Tracker API v2.0';

function setMessage(_root, { message }) {
  aboutMessage = message;
  return aboutMessage;
}

function getMessage() {
  return aboutMessage;
}

module.exports = { getMessage, setMessage: mustBeSignedIn(setMessage) };
