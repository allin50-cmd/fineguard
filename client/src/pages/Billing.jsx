import { Paper, Typography, Box, Button, Chip } from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function Billing() {
  const [subscription, setSubscription] = useState({ plan: 'starter', status: 'inactive' });
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/api/subscription`).then(res => setSubscription(res.data));
    axios.get(`${API_BASE}/api/billing/methods`).then(res => setPaymentMethods(res.data));
  }, []);

  const plans = {
    starter: { price: '£19-29', features: ['Deadline monitoring', 'Alerts', 'Basic storage'] },
    growth: { price: '£49-79', features: ['Full compliance tracking', 'Filing support', 'Document vault'] },
    pro: { price: '£129-199', features: ['Multi-company management', 'Accountant access', 'Priority support'] }
  };

  const currentPlan = plans[subscription.plan] || plans.starter;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Billing & Subscription</Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Current Plan: <Chip label={subscription.plan} color="primary" /></Typography>
        <Typography>{currentPlan.price} / month</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>Features:</Typography>
        <ul>
          {currentPlan.features.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
        <Button variant="outlined" sx={{ mt: 1 }}>Upgrade to Pro</Button>
      </Paper>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Payment Method</Typography>
        {paymentMethods.map(method => (
          <Box key={method.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>{method.type} ending in {method.last4} (exp {method.expiry})</Typography>
            <Button size="small">Update</Button>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
