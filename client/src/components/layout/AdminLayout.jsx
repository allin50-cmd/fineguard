import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  SpeedDial,
  SpeedDialAction,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Psychology as AIIcon,
  Description as DocumentIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
  Map as MapIcon
} from '@mui/icons-material';

const menuItems = [
  { title: 'Dashboard', path: '/admin/dashboard', icon: DashboardIcon },
  { title: 'Companies', path: '/admin/companies', icon: BusinessIcon },
  { title: 'Accountants', path: '/admin/accountants', icon: PeopleIcon },
  { title: 'Enrichment', path: '/admin/enrichment', icon: AIIcon },
  { title: 'Documents', path: '/admin/documents', icon: DocumentIcon },
  { title: 'Reports', path: '/admin/reports', icon: ReportsIcon },
  { title: 'Settings', path: '/admin/settings', icon: SettingsIcon },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.title : 'FineGuard';
  };

  const speedDialActions = menuItems.map((item) => ({
    icon: React.createElement(item.icon),
    name: item.title,
    action: () => navigate(item.path)
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FineGuard - {getCurrentPageTitle()}
          </Typography>

          <Chip
            label="LIVE DATA"
            color="success"
            size="small"
            sx={{ mr: 2 }}
          />

          <Typography variant="body2" sx={{ mr: 2 }}>
            1.36M Companies
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 280, pt: 2 }}>
          <Typography variant="h6" sx={{ px: 2, mb: 2, fontWeight: 'bold' }}>
            FineGuard Menu
          </Typography>
          <Divider />
          <List>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    selected={isActive}
                    onClick={() => {
                      navigate(item.path);
                      setDrawerOpen(false);
                    }}
                  >
                    <ListItemIcon>
                      <Icon color={isActive ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 'bold' : 'normal'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, mt: 8 }}>
        <Outlet />
      </Box>

      {/* Speed Dial for Quick Navigation */}
      <SpeedDial
        ariaLabel="Quick Navigation"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<MapIcon />}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>
    </Box>
  );
}
