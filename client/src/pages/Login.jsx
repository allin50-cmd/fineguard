import { useState } from 'react';
import { Box, TextField, Button, Link, Typography, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (!result.success) setError(result.error);
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 4 }}>
      <img src="/logo.svg" alt="FineGuard" height={40} style={{ marginBottom: 24 }} />
      <Typography variant="h5" gutterBottom>Sign in to FineGuard</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField fullWidth label="Email" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField fullWidth label="Password" type="password" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>Login</Button>
      </form>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Link href="#">Forgot password?</Link>
        <Link href="#">Create account</Link>
      </Box>
    </Box>
  );
}
