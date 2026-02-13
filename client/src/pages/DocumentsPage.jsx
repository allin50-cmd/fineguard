import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';

export default function DocumentsPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>Documents</Typography>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <FolderIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6">Document Management System</Typography>
        <Typography variant="body2" color="text.secondary">
          Upload, organize, and manage company documents
        </Typography>
      </Paper>
    </Container>
  );
}
