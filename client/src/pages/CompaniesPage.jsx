import React from 'react';
import { Container, Typography } from '@mui/material';

export default function CompaniesPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        Companies
      </Typography>
      <Typography variant="body1">
        5.8M UK companies with enrichment data.
      </Typography>
    </Container>
  );
}
