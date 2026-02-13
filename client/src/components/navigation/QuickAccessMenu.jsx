import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  IconButton,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as CompaniesIcon,
  AccountBalance as AccountantsIcon,
  Psychology as EnrichmentIcon,
  Description as DocumentsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Portal as PortalIcon
} from '@mui/icons-material';

const quickAccessItems = [
  {
    title: 'Dashboard',
    path: '/admin/dashboard',
    icon: DashboardIcon,
    color: '#1976d2',
    description: 'Overview & metrics'
  },
  {
    title: 'Companies',
    path: '/admin/companies',
    icon: CompaniesIcon,
    color: '#2e7d32',
    description: '5.4M UK companies'
  },
  {
    title: 'Accountants',
    path: '/admin/accountants',
    icon: AccountantsIcon,
    color: '#ed6c02',
    description: '390 London firms'
  },
  {
    title: 'Email Enrichment',
    path: '/admin/enrichment',
    icon: EnrichmentIcon,
    color: '#9c27b0',
    description: 'AI-powered enrichment'
  },
  {
    title: 'Documents',
    path: '/admin/documents',
    icon: DocumentsIcon,
    color: '#0288d1',
    description: 'Document management'
  },
  {
    title: 'Reports',
    path: '/admin/reports',
    icon: ReportsIcon,
    color: '#d32f2f',
    description: 'Analytics & reporting'
  },
  {
    title: 'Settings',
    path: '/admin/settings',
    icon: SettingsIcon,
    color: '#616161',
    description: 'System configuration'
  },
  {
    title: 'Client Portal',
    path: '/portal/dashboard',
    icon: PortalIcon,
    color: '#00897b',
    description: 'Client-facing dashboard'
  }
];

export default function QuickAccessMenu({ compact = false }) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {quickAccessItems.map((item) => {
            const Icon = item.icon;
            return (
              <Chip
                key={item.path}
                icon={<Icon />}
                label={item.title}
                onClick={() => navigate(item.path)}
                sx={{
                  bgcolor: item.color,
                  color: 'white',
                  '&:hover': {
                    bgcolor: item.color,
                    opacity: 0.8
                  }
                }}
              />
            );
          })}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Quick Access
      </Typography>
      <Grid container spacing={2}>
        {quickAccessItems.map((item) => {
          const Icon = item.icon;
          return (
            <Grid item xs={6} sm={4} md={3} key={item.path}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5
                      }}
                    >
                      <Icon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      {item.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
