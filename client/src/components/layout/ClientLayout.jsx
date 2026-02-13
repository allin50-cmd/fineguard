import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as TasksIcon,
  Description as DocsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  Warning as AlertIcon,
  Assessment as ReportsIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';

export default function ClientLayout({ children, alerts = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const menuItems = [
    { path: '/portal/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/portal/deadlines', label: 'Deadlines', icon: <TasksIcon /> },
    { path: '/portal/documents', label: 'Documents', icon: <DocsIcon /> },
    { path: '/portal/reports', label: 'Reports', icon: <ReportsIcon /> },
    { path: '/portal/support', label: 'Support', icon: <HelpIcon /> }
  ];

  const isActive = (path) => location.pathname === path;
  const criticalAlerts = alerts.filter(a => a.type === 'critical').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            sx={{ mr: 2, display: { sm: 'none' } }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              FineGuard
            </Typography>
            <Typography variant="caption" sx={{ ml: 1, opacity: 0.8 }}>
              Compliance Portal
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' }, gap: 1, ml: 4 }}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                startIcon={item.icon}
                sx={{
                  bgcolor: isActive(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Right side: Alerts & User */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" onClick={() => navigate('/portal/alerts')}>
              <Badge badgeContent={criticalAlerts} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: 'white' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1565c0' }}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem disabled>
                <Typography variant="body2">{user?.email}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/portal/account'); }}>
                <ListItemIcon><AccountIcon fontSize="small" /></ListItemIcon>
                Account Settings
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); handleLogout(); }}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }}>
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6">FineGuard</Typography>
            <Typography variant="caption">{user?.email}</Typography>
          </Box>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Critical Alerts Banner */}
      {criticalAlerts > 0 && (
        <Box sx={{ bgcolor: '#dc2626', color: 'white', py: 1, px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <AlertIcon />
            <Typography variant="body2" fontWeight="bold">
              {criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''} - Action Required
            </Typography>
            <Button
              size="small"
              variant="contained"
              sx={{ bgcolor: 'white', color: '#dc2626', ml: 2 }}
              onClick={() => navigate('/portal/alerts')}
            >
              View Now
            </Button>
          </Box>
        </Box>
      )}

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: '#f5f5f5' }}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} FineGuard. Protecting your business compliance.
        </Typography>
      </Box>
    </Box>
  );
}
