import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, CircularProgress, Alert } from '@mui/material';
import { API_BASE_URL } from '../config';

export default function PortalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/portal/dashboard`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Container>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>Client Portal Dashboard</Typography>

      {data && data.client ? (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6">Company: {data.client.company_name}</Typography>
            <Typography>Number: {data.client.company_number}</Typography>
            <Typography>Status: {data.client.account_status}</Typography>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Health Score</Typography>
            <Typography variant="h3" color="primary">{data.healthScore.score}/100</Typography>
            <Typography variant="caption">Last calculated: {new Date(data.healthScore.lastCalculated).toLocaleString()}</Typography>
          </Paper>
        </Box>
      ) : (
        <Alert severity="info">No client data available</Alert>
      )}
    </Container>
  );
}
