import { Outlet, Link as RouterLink, Navigate } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import TaskIcon from '@mui/icons-material/Task';
import FolderIcon from '@mui/icons-material/Folder';
import SupportIcon from '@mui/icons-material/Support';
import PaymentIcon from '@mui/icons-material/Payment';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

export default function Layout() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap>FineGuard</Typography>
          <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
        <Toolbar />
        <List>
          <ListItem button component={RouterLink} to="/dashboard">
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button component={RouterLink} to="/companies/123">
            <ListItemIcon><BusinessIcon /></ListItemIcon>
            <ListItemText primary="Company Overview" />
          </ListItem>
          <ListItem button component={RouterLink} to="/tasks">
            <ListItemIcon><TaskIcon /></ListItemIcon>
            <ListItemText primary="Tasks" />
          </ListItem>
          <ListItem button component={RouterLink} to="/documents">
            <ListItemIcon><FolderIcon /></ListItemIcon>
            <ListItemText primary="Documents" />
          </ListItem>
          <ListItem button component={RouterLink} to="/support">
            <ListItemIcon><SupportIcon /></ListItemIcon>
            <ListItemText primary="Support" />
          </ListItem>
          <ListItem button component={RouterLink} to="/billing">
            <ListItemIcon><PaymentIcon /></ListItemIcon>
            <ListItemText primary="Billing" />
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
