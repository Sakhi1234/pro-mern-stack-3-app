const express = require('express');
const about = require('./about.js');
const issue = require('./issue.js');
const { summarizeIssueWithComments } = require('./ai.js');

const router = express.Router();

router.get('/about', async (_req, res, next) => {
  try {
    res.json({ about: about.getMessage() });
  } catch (err) {
    next(err);
  }
});

router.get('/user', async (req, res) => {
  res.json({ user: req.user || { signedIn: false } });
});

router.get('/issues', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const effortMin = req.query.effortMin ? parseInt(req.query.effortMin, 10) : undefined;
    const effortMax = req.query.effortMax ? parseInt(req.query.effortMax, 10) : undefined;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;

    const issueList = await issue.list({}, {
      status,
      effortMin,
      effortMax,
      search,
      page,
    });

    let selectedIssue = null;
    if (req.query.selectedId) {
      const selectedId = parseInt(req.query.selectedId, 10);
      if (!Number.isNaN(selectedId)) {
        selectedIssue = await issue.get({}, { id: selectedId });
      }
    }

    res.json({ issueList, issue: selectedIssue });
  } catch (err) {
    next(err);
  }
});

router.get('/issues/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const requestedIssue = await issue.get({}, { id });
    res.json({ issue: requestedIssue });
  } catch (err) {
    next(err);
  }
});

router.get('/issue-counts', async (req, res, next) => {
  try {
    const status = req.query.status;
    const effortMin = req.query.effortMin ? parseInt(req.query.effortMin, 10) : undefined;
    const effortMax = req.query.effortMax ? parseInt(req.query.effortMax, 10) : undefined;
    const issueCounts = await issue.counts({}, { status, effortMin, effortMax });
    res.json({ issueCounts });
  } catch (err) {
    next(err);
  }
});

router.post('/issues', async (req, res, next) => {
  try {
    const created = await issue.add({}, { issue: req.body.issue }, { user: req.user });
    res.json({ issueAdd: created });
  } catch (err) {
    next(err);
  }
});

router.post('/issues/:id/summary', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const issueForSummary = await issue.get({}, { id });
    if (!issueForSummary) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }
    const summaryResult = await summarizeIssueWithComments(issueForSummary);
    res.json(summaryResult);
  } catch (err) {
    next(err);
  }
});

router.patch('/issues/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await issue.update({}, { id, changes: req.body.changes }, { user: req.user });
    res.json({ issueUpdate: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/issues/:id/comments', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const comment = await issue.addComment(
      {},
      { id, comment: req.body?.comment },
      { user: req.user },
    );
    res.json({ commentAdd: comment });
  } catch (err) {
    next(err);
  }
});

router.patch('/issues/:id/comments/:commentId', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const comment = await issue.updateComment(
      {},
      { id, commentId: req.params.commentId, comment: req.body?.comment },
      { user: req.user },
    );
    res.json({ commentUpdate: comment });
  } catch (err) {
    next(err);
  }
});

router.delete('/issues/:id/comments/:commentId', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await issue.deleteComment(
      {},
      { id, commentId: req.params.commentId },
      { user: req.user },
    );
    res.json({ commentDelete: deleted });
  } catch (err) {
    next(err);
  }
});

router.delete('/issues/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await issue.delete({}, { id }, { user: req.user });
    res.json({ issueDelete: deleted });
  } catch (err) {
    next(err);
  }
});

router.post('/issues/:id/restore', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const restored = await issue.restore({}, { id }, { user: req.user });
    res.json({ issueRestore: restored });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
