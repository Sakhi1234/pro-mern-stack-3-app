import { useEffect, useState } from 'react';
import { Avatar, Box, Button, IconButton, Paper, TextField, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { apiFetch } from '../utils/restFetch.js';
import { formatDateTimeForDisplay } from '../utils/DateUtils.js';

function canManageComment(comment, currentUser) {
  if (!currentUser?.signedIn) return false;
  if (comment.authorEmail && currentUser.email) return comment.authorEmail === currentUser.email;
  if (comment.authorName && currentUser.givenName) return comment.authorName === currentUser.givenName;
  return false;
}

export default function IssueCommentItem({
  issueId,
  comment,
  currentUser,
  onUpdate,
  onDelete,
  showError = () => {},
  showSuccess = () => {},
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDraft(comment.text || '');
    setEditing(false);
    setSaving(false);
    setDeleting(false);
  }, [comment.id, comment.text]);

  const canManage = canManageComment(comment, currentUser);
  const updatedAt = comment.updatedAt || null;

  async function saveEdit() {
    const text = draft.trim();
    if (!text) return;

    setSaving(true);
    const data = await apiFetch(
      `/issues/${issueId}/comments/${comment.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ comment: text }),
      },
      showError,
    );
    setSaving(false);

    if (data?.commentUpdate) {
      onUpdate(data.commentUpdate);
      setEditing(false);
      showSuccess('Comment updated.');
    }
  }

  async function removeComment() {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;

    setDeleting(true);
    const data = await apiFetch(
      `/issues/${issueId}/comments/${comment.id}`,
      { method: 'DELETE' },
      showError,
    );
    setDeleting(false);

    if (data?.commentDelete) {
      onDelete(comment.id);
      showSuccess('Comment deleted.');
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(15, 118, 110, 0.03)' }}
    >
      <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
          {(comment.authorName || 'A').slice(0, 1).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
              {comment.authorName || comment.authorEmail || 'Anonymous'}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
              {formatDateTimeForDisplay(comment.created)}
              {updatedAt ? ' • edited' : ''}
            </Typography>
          </Box>

          {editing ? (
            <Box sx={{ mt: 1 }}>
              <TextField
                multiline
                minRows={3}
                fullWidth
                size="small"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={saving}
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckIcon />}
                  onClick={saveEdit}
                  disabled={saving || !draft.trim()}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CloseIcon />}
                  onClick={() => {
                    setDraft(comment.text || '');
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ mt: 0.75, whiteSpace: 'pre-wrap', fontSize: 14 }}>
              {comment.text}
            </Typography>
          )}
        </Box>

        {canManage && !editing ? (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <IconButton size="small" onClick={() => setEditing(true)} disabled={deleting}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={removeComment} disabled={deleting}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
