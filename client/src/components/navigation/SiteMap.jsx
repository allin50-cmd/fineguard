import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  Business as CompaniesIcon,
  AccountBalance as AccountantsIcon,
  Psychology as EnrichmentIcon,
  Description as DocumentsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Portal as PortalIcon,
  Folder as FolderIcon
} from '@mui/icons-material';

const siteStructure = [
  {
    title: 'Admin Portal',
    icon: FolderIcon,
    children: [
      {
        title: 'Dashboard',
        path: '/admin/dashboard',
        icon: DashboardIcon,
        description: 'Overview, metrics, and quick actions'
      },
      {
        title: 'Companies Database',
        path: '/admin/companies',
        icon: CompaniesIcon,
        description: '5.4M UK companies from Companies House'
      },
      {
        title: 'Accountants Database',
        path: '/admin/accountants',
        icon: AccountantsIcon,
        description: '390 London accounting firms across 34 boroughs'
      },
      {
        title: 'Email Enrichment',
        path: '/admin/enrichment',
        icon: EnrichmentIcon,
        description: 'AI-powered email discovery with Perplexity'
      },
      {
        title: 'Documents',
        path: '/admin/documents',
        icon: DocumentsIcon,
        description: 'Document management and file storage'
      },
      {
        title: 'Reports & Analytics',
        path: '/admin/reports',
        icon: ReportsIcon,
        description: 'Generate reports and view analytics'
      },
      {
        title: 'Settings',
        path: '/admin/settings',
        icon: SettingsIcon,
        description: 'API keys, notifications, and system config'
      }
    ]
  },
  {
    title: 'Client Portal',
    icon: PortalIcon,
    children: [
      {
        title: 'Portal Dashboard',
        path: '/portal/dashboard',
        icon: DashboardIcon,
        description: 'Client-facing compliance dashboard'
      }
    ]
  }
];

export default function SiteMap() {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = React.useState({
    'Admin Portal': true,
    'Client Portal': false
  });

  const handleToggle = (section) => {
    setOpenSections({
      ...openSections,
      [section]: !openSections[section]
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Site Map - All Features & Services
      </Typography>

      {siteStructure.map((section, sectionIndex) => {
        const SectionIcon = section.icon;
        return (
          <Box key={section.title} sx={{ mb: 2 }}>
            <ListItemButton onClick={() => handleToggle(section.title)}>
              <ListItemIcon>
                <SectionIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="h6" fontWeight="bold">
                    {section.title}
                  </Typography>
                }
              />
              {openSections[section.title] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={openSections[section.title]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {section.children.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <ListItem key={item.path} disablePadding>
                      <ListItemButton
                        sx={{ pl: 4 }}
                        onClick={() => navigate(item.path)}
                      >
                        <ListItemIcon>
                          <ItemIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography fontWeight="600">{item.title}</Typography>
                          }
                          secondary={item.description}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>

            {sectionIndex < siteStructure.length - 1 && <Divider sx={{ my: 2 }} />}
          </Box>
        );
      })}

      <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          System Statistics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 8 Total Pages Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 5.4M Companies in Database
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 390 Accountants Across 34 London Boroughs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 856 Enriched Email Records
        </Typography>
      </Box>
    </Paper>
  );
}
