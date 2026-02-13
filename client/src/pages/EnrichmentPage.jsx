import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress } from '@mui/material';

export default function EnrichmentPage() {
  const [enriched, setEnriched] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('${API_BASE_URL}/api/enrichment/companies')
      .then(res => res.json())
      .then(data => {
        setEnriched(data.slice(0, 20));
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
      <Typography variant="h3" gutterBottom>Email Enrichment</Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {enriched.length} enriched companies with contact data and risk assessments
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Company</strong></TableCell>
              <TableCell><strong>Number</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Website</strong></TableCell>
              <TableCell><strong>Risk</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enriched.map((e, i) => (
              <TableRow key={i}>
                <TableCell>{e.company_name}</TableCell>
                <TableCell>{e.company_number}</TableCell>
                <TableCell>{e.email || 'N/A'}</TableCell>
                <TableCell>{e.website || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={`${e.risk_level || 'N/A'} (${e.risk_score || 0})`}
                    color={e.risk_level === 'HIGH' ? 'error' : e.risk_level === 'MEDIUM' ? 'warning' : 'success'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
