import { Grid, Paper, Typography, Box, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function Dashboard() {
  const [companyStats, setCompanyStats] = useState({ total: 0 });
  const [tasks, setTasks] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    axios.get(`${API_BASE}/api/companies/stats`).then(res => setCompanyStats(res.data));
    if (user) {
      axios.get(`${API_BASE}/api/tasks`).then(res => setTasks(res.data));
      axios.get(`${API_BASE}/api/subscription`).then(res => setSubscription(res.data));
    }
  }, [user]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Welcome back, {user?.fullName || 'User'}</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Compliance Health</Typography>
            <Typography variant="h3" color="success.main">98%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Next Deadline</Typography>
            <Typography variant="h4">
              {tasks.length > 0 ? new Date(tasks[0]?.due_date).toLocaleDateString() : 'No tasks'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Companies Tracked</Typography>
            <Typography variant="h3">{companyStats.total}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Upcoming Tasks</Typography>
            {tasks.slice(0, 3).map(task => (
              <Box key={task.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography>{task.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Due {new Date(task.due_date).toLocaleDateString()}
                </Typography>
              </Box>
            ))}
          </Paper>
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6">Alerts</Typography>
            <Typography color="warning.main">⚠️ Annual accounts due in 30 days</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Quick Actions</Typography>
            <Button fullWidth variant="outlined" sx={{ mt: 1 }}>Upload Documents</Button>
            <Button fullWidth variant="outlined" sx={{ mt: 1 }}>Fix Filing</Button>
            <Button fullWidth variant="outlined" sx={{ mt: 1 }}>Contact Support</Button>
          </Paper>
          {subscription && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6">Current Plan</Typography>
              <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>{subscription.plan}</Typography>
              <Button variant="text" sx={{ mt: 1 }}>Upgrade</Button>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
