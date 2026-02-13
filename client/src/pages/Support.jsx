import { Paper, Typography, Box, Button, TextField } from '@mui/material';

export default function Support() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Support</Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Live Chat</Typography>
        <Button variant="contained">Start Chat</Button>
      </Paper>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Submit a Ticket</Typography>
        <TextField fullWidth label="Subject" margin="normal" />
        <TextField fullWidth multiline rows={4} label="Description" margin="normal" />
        <Button variant="contained" sx={{ mt: 1 }}>Submit</Button>
      </Paper>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Help Articles</Typography>
        <Typography>• How to file confirmation statement</Typography>
        <Typography>• Adding a new director</Typography>
        <Typography>• Understanding compliance score</Typography>
      </Paper>
    </Box>
  );
}
