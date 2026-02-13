import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';

export default function ReportsPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>Reports & Analytics</Typography>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <AssessmentIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6">Reports & Analytics Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Generate comprehensive reports and view system analytics
        </Typography>
      </Paper>
    </Container>
  );
}
