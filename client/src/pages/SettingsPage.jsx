import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

export default function SettingsPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>Settings</Typography>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <SettingsIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6">System Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure API keys, notifications, and system preferences
        </Typography>
      </Paper>
    </Container>
  );
}
