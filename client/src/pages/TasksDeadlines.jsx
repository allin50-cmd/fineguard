import { Paper, Typography, Box, Button, List, ListItem, ListItemText } from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function TasksDeadlines() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/api/tasks`).then(res => setTasks(res.data));
  }, []);

  const markComplete = async (id) => {
    await axios.patch(`${API_BASE}/api/tasks/${id}`, { status: 'completed' });
    setTasks(tasks.filter(t => t.id !== id));
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const overdue = pendingTasks.filter(t => new Date(t.due_date) < new Date());
  const upcoming = pendingTasks.filter(t => new Date(t.due_date) >= new Date());

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Tasks & Deadlines</Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Upcoming Filings</Typography>
        <List>
          {upcoming.map(task => (
            <ListItem key={task.id} secondaryAction={<Button onClick={() => markComplete(task.id)}>Mark Complete</Button>}>
              <ListItemText primary={task.title} secondary={`Due ${new Date(task.due_date).toLocaleDateString()}`} />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Overdue Tasks</Typography>
        <List>
          {overdue.map(task => (
            <ListItem key={task.id} secondaryAction={<Button color="error" onClick={() => markComplete(task.id)}>Mark Complete</Button>}>
              <ListItemText primary={task.title} secondary={`Overdue by ${Math.ceil((new Date() - new Date(task.due_date)) / (1000*60*60*24))} days`} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
