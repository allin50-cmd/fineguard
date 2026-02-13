import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import { Home as HomeIcon, NavigateNext as NavigateNextIcon } from '@mui/icons-material';

const routeMap = {
  '/admin': 'Admin',
  '/admin/dashboard': 'Dashboard',
  '/admin/companies': 'Companies',
  '/admin/accountants': 'Accountants',
  '/admin/enrichment': 'Email Enrichment',
  '/admin/documents': 'Documents',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
  '/portal': 'Portal',
  '/portal/dashboard': 'Dashboard',
  '/portal/cases': 'Cases',
  '/portal/deadlines': 'Deadlines',
  '/portal/documents': 'Documents'
};

export default function Breadcrumbs() {
  const navigate = useNavigate();
  const location = useLocation();

  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return null;
  }

  const breadcrumbItems = [];
  let currentPath = '';

  pathnames.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathnames.length - 1;
    const label = routeMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);

    breadcrumbItems.push({
      path: currentPath,
      label,
      isLast
    });
  });

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          bgcolor: 'white',
          p: 1.5,
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => navigate('/')}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        {breadcrumbItems.map((item, index) => (
          item.isLast ? (
            <Typography key={item.path} color="text.primary" fontWeight="bold">
              {item.label}
            </Typography>
          ) : (
            <Link
              key={item.path}
              underline="hover"
              color="inherit"
              onClick={() => navigate(item.path)}
              sx={{ cursor: 'pointer' }}
            >
              {item.label}
            </Link>
          )
        ))}
      </MuiBreadcrumbs>
    </Box>
  );
}
