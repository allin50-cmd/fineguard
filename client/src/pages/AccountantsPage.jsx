import React from 'react';
import { Container, Typography } from '@mui/material';

export default function AccountantsPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        Accountants
      </Typography>
      <Typography variant="body1">
        390+ London accountants loaded and ready.
      </Typography>
    </Container>
  );
}
