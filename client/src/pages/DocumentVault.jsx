import { Paper, Typography, Box, Button, TextField, InputAdornment, List, ListItem, ListItemText } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function DocumentVault() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE}/api/documents`).then(res => setDocuments(res.data));
  }, []);

  const filtered = documents.filter(doc =>
    doc.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Document Vault</Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button variant="contained">Upload Documents</Button>
        <TextField
          placeholder="Search documents..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
          }}
        />
      </Box>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">All Documents</Typography>
        <List>
          {filtered.map(doc => (
            <ListItem key={doc.id}>
              <ListItemText
                primary={doc.filename}
                secondary={`Uploaded ${new Date(doc.uploaded_at).toLocaleDateString()} • ${doc.category || 'Uncategorized'}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
