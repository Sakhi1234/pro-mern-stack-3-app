import { useContext, useEffect, useState } from 'react';
import { Box, Button, Divider, Paper, TextField, Typography } from '@mui/material';
import { apiFetch } from '../utils/restFetch.js';
import UserContext from '../context/UserContext.js';
import IssueCommentItem from './IssueCommentItem.jsx';

const NOOP = () => {};

export default function IssueComments({
  issue,
  showError = () => {},
  showSuccess = () => {},
  onCommentsChange = NOOP,
}) {
  const user = useContext(UserContext);
  const [comments, setComments] = useState(issue?.comments || []);
  const [commentText, setCommentText] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setComments(issue?.comments || []);
    setCommentText('');
    setSaving(false);
    onCommentsChange?.(issue?.comments || []);
  }, [issue?.id, issue?.comments, onCommentsChange]);

  if (!issue?.id) return null;

  async function submitComment(e) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    setSaving(true);
    const data = await apiFetch(
      `/issues/${issue.id}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ comment: text }),
      },
      showError,
    );
    setSaving(false);

    if (data?.commentAdd) {
      setComments((prev) => {
        const updated = [...prev, data.commentAdd];
        onCommentsChange?.(updated);
        return updated;
      });
      setCommentText('');
      showSuccess('Comment posted.');
    }
  }

  function updateComment(updatedComment) {
    setComments((prev) => {
      const updated = prev.map((comment) => (
        comment.id === updatedComment.id ? updatedComment : comment
      ));
      onCommentsChange?.(updated);
      return updated;
    });
  }

  function deleteComment(commentId) {
    setComments((prev) => {
      const updated = prev.filter((comment) => comment.id !== commentId);
      onCommentsChange?.(updated);
      return updated;
    });
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        mt: 2,
        borderRadius: 3,
        boxShadow: '0 8px 24px rgba(2, 8, 20, 0.05)',
        borderColor: 'rgba(15, 118, 110, 0.18)',
        background: 'linear-gradient(180deg, rgba(15, 118, 110, 0.04) 0%, rgba(255,255,255,1) 38%)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        <Typography variant="h6">
          Comments
        </Typography>
        <Typography sx={{ fontSize: 12, color: user.signedIn ? 'success.main' : 'text.secondary', fontWeight: 600 }}>
          {user.signedIn ? 'Ready' : 'Locked'}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 1.25 }}>
        {comments.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            No comments yet.
          </Typography>
        ) : (
          comments.map((comment) => (
            <IssueCommentItem
              key={comment.id}
              issueId={issue.id}
              comment={comment}
              currentUser={user}
              onUpdate={updateComment}
              onDelete={deleteComment}
              showError={showError}
              showSuccess={showSuccess}
            />
          ))
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box component="form" onSubmit={submitComment} sx={{ display: 'grid', gap: 1.25 }}>
        <TextField
          label="Add a comment"
          placeholder="Write a comment..."
          multiline
          minRows={3}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={!user.signedIn || saving}
          helperText=" "
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
            {user.signedIn ? `Commenting as ${user.givenName || 'you'}` : ' '}
          </Typography>
          <Button
            type="submit"
            variant="contained"
            disabled={!user.signedIn || saving || !commentText.trim()}
          >
            {saving ? 'Posting...' : 'Post Comment'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
