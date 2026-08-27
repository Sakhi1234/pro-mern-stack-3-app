const { getDb, getNextSequence } = require('./db.js');
const { mustBeSignedIn } = require('./auth.js');
const { AppError } = require('./errors.js');
const { randomUUID } = require('crypto');

const PAGE_SIZE = 10;

async function get(_root, { id }) {
  const db = getDb();
  return db.collection('issues').findOne({ id });
}

async function list(_root, {
  status, effortMin, effortMax, search, page,
}) {
  const db = getDb();
  const filter = {};

  if (status) filter.status = status;
  if (effortMin !== undefined || effortMax !== undefined) {
    filter.effort = {};
    if (effortMin !== undefined) filter.effort.$gte = effortMin;
    if (effortMax !== undefined) filter.effort.$lte = effortMax;
  }
  if (search) filter.$text = { $search: search };

  const skip = PAGE_SIZE * (Math.max(1, page || 1) - 1);
  const [issues, totalCount] = await Promise.all([
    db.collection('issues').find(filter).sort({ id: 1 }).skip(skip).limit(PAGE_SIZE).toArray(),
    db.collection('issues').countDocuments(filter),
  ]);

  return { issues, pages: Math.ceil(totalCount / PAGE_SIZE) };
}

function validate(issue) {
  const errors = [];
  if (issue.title.length < 3) {
    errors.push('Field "title" must be at least 3 characters long.');
  }
  if (issue.status === 'Assigned' && !issue.owner) {
    errors.push('Field "owner" is required when status is "Assigned"');
  }
  if (errors.length > 0) {
    throw new AppError('Invalid input(s)', 'BAD_USER_INPUT', errors);
  }
}

function validateComment(comment) {
  const text = typeof comment === 'string' ? comment.trim() : '';
  const errors = [];
  if (!text) {
    errors.push('Comment text is required.');
  }
  if (text.length > 1000) {
    errors.push('Comment text must be 1000 characters or less.');
  }
  if (errors.length > 0) {
    throw new AppError('Invalid input(s)', 'BAD_USER_INPUT', errors);
  }
  return text;
}

function isSameAuthor(comment, user) {
  if (!comment || !user) return false;
  if (comment.authorEmail && user.email) return comment.authorEmail === user.email;
  if (comment.authorName && user.givenName) return comment.authorName === user.givenName;
  return false;
}

async function add(_root, { issue }) {
  const db = getDb();
  validate(issue);

  const newIssue = {
    ...issue,
    comments: [],
    created: new Date(),
    id: await getNextSequence('issues'),
  };
  const insertResult = await db.collection('issues').insertOne(newIssue);
  return db.collection('issues').findOne({ _id: insertResult.insertedId });
}

async function update(_root, { id, changes }) {
  const db = getDb();

  if (changes.title || changes.status || changes.owner) {
    const issue = await db.collection('issues').findOne({ id });
    Object.assign(issue, changes);
    validate(issue);
  }

  await db.collection('issues').updateOne({ id }, { $set: changes });
  return db.collection('issues').findOne({ id });
}

async function remove(_root, { id }) {
  const db = getDb();
  const issue = await db.collection('issues').findOne({ id });
  if (!issue) return false;

  issue.deleted = new Date();
  const archiveResult = await db.collection('deleted_issues').insertOne(issue);
  if (!archiveResult.insertedId) return false;

  const deleteResult = await db.collection('issues').deleteOne({ id });
  return deleteResult.deletedCount === 1;
}

async function restore(_root, { id }) {
  const db = getDb();
  const issue = await db.collection('deleted_issues').findOne({ id });
  if (!issue) return false;

  issue.deleted = new Date();
  const restoreResult = await db.collection('issues').insertOne(issue);
  if (!restoreResult.insertedId) return false;

  const archiveDeleteResult = await db.collection('deleted_issues').deleteOne({ id });
  return archiveDeleteResult.deletedCount === 1;
}

async function addComment(_root, { id, comment }, { user }) {
  const db = getDb();
  const text = validateComment(comment);
  const issue = await db.collection('issues').findOne({ id });
  if (!issue) {
    throw new AppError('Issue not found', 'BAD_USER_INPUT', ['Issue does not exist.']);
  }

  const newComment = {
    id: randomUUID(),
    authorName: user?.givenName || user?.name || user?.email || 'Anonymous',
    authorEmail: user?.email || '',
    text,
    created: new Date(),
  };

  const updateResult = await db.collection('issues').updateOne(
    { id },
    { $push: { comments: newComment } },
  );

  if (updateResult.modifiedCount !== 1) return false;
  return newComment;
}

async function updateComment(_root, { id, commentId, comment }, { user }) {
  const db = getDb();
  const text = validateComment(comment);
  const issue = await db.collection('issues').findOne({ id });
  if (!issue) {
    throw new AppError('Issue not found', 'BAD_USER_INPUT', ['Issue does not exist.']);
  }

  const existing = issue.comments?.find((item) => item.id === commentId);
  if (!existing) return false;
  if (!isSameAuthor(existing, user)) {
    throw new AppError('You can only edit your own comments.', 'UNAUTHENTICATED');
  }

  const updatedAt = new Date();
  const updatedComment = { ...existing, text, updatedAt };

  const updateResult = await db.collection('issues').updateOne(
    { id, 'comments.id': commentId },
    {
      $set: {
        'comments.$.text': text,
        'comments.$.updatedAt': updatedAt,
      },
    },
  );

  if (updateResult.modifiedCount !== 1) return false;
  return updatedComment;
}

async function deleteComment(_root, { id, commentId }, { user }) {
  const db = getDb();
  const issue = await db.collection('issues').findOne({ id });
  if (!issue) {
    throw new AppError('Issue not found', 'BAD_USER_INPUT', ['Issue does not exist.']);
  }

  const existing = issue.comments?.find((item) => item.id === commentId);
  if (!existing) return false;
  if (!isSameAuthor(existing, user)) {
    throw new AppError('You can only delete your own comments.', 'UNAUTHENTICATED');
  }

  const updateResult = await db.collection('issues').updateOne(
    { id },
    { $pull: { comments: { id: commentId } } },
  );

  if (updateResult.modifiedCount !== 1) return false;
  return true;
}

async function counts(_root, { status, effortMin, effortMax }) {
  const db = getDb();
  const filter = {};

  if (status) filter.status = status;
  if (effortMin !== undefined || effortMax !== undefined) {
    filter.effort = {};
    if (effortMin !== undefined) filter.effort.$gte = effortMin;
    if (effortMax !== undefined) filter.effort.$lte = effortMax;
  }

  const results = await db.collection('issues').aggregate([
    { $match: filter },
    { $group: { _id: { owner: '$owner', status: '$status' }, count: { $sum: 1 } } },
  ]).toArray();

  const stats = {};
  results.forEach((result) => {
    const { owner, status: statusKey } = result._id;
    if (!stats[owner]) stats[owner] = { owner };
    stats[owner][statusKey] = result.count;
  });

  return Object.values(stats);
}

module.exports = {
  list,
  add: mustBeSignedIn(add),
  get,
  update: mustBeSignedIn(update),
  delete: mustBeSignedIn(remove),
  restore: mustBeSignedIn(restore),
  addComment: mustBeSignedIn(addComment),
  updateComment: mustBeSignedIn(updateComment),
  deleteComment: mustBeSignedIn(deleteComment),
  counts,
};
