import { useParams } from 'react-router-dom';
import { Paper, Typography, Box, Button } from '@mui/material';

export default function CompanyOverview() {
  const { id } = useParams();
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Company #{id}</Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Company Information</Typography>
        <Typography>Name: Example Ltd</Typography>
        <Typography>Number: {id}</Typography>
        <Typography>Status: Active</Typography>
      </Paper>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Directors & PSC</Typography>
        <Typography>John Doe (Appointed 01/01/2020)</Typography>
      </Paper>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Filing Status</Typography>
        <Typography>Confirmation statement: Up to date</Typography>
        <Typography>Accounts: Due in 45 days</Typography>
      </Paper>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained">Update Records</Button>
        <Button variant="outlined" sx={{ ml: 2 }}>Submit Filing</Button>
        <Button variant="outlined" sx={{ ml: 2 }}>Download Reports</Button>
      </Box>
    </Box>
  );
}
