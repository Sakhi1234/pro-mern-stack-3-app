import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import IssueRow from './IssueRow.jsx';

export default function IssueTable({ issues, closeIssue, deleteIssue }) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ mt: 2, overflow: 'hidden' }}
    >
      <Table size="small">
        <TableHead>
          <TableRow
            sx={{
              '& .MuiTableCell-root': {
                backgroundColor: 'rgba(15, 118, 110, 0.06)',
                fontWeight: 700,
              },
            }}
          >
            <TableCell>ID</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Effort in days</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {issues.map((issue, index) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              index={index}
              closeIssue={closeIssue}
              deleteIssue={deleteIssue}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
