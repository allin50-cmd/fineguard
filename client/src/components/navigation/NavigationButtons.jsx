import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonGroup } from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Home as HomeIcon
} from '@mui/icons-material';

export default function NavigationButtons() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleForward = () => {
    navigate(1);
  };

  const handleHome = () => {
    navigate('/admin/dashboard');
  };

  return (
    <Box sx={{ mb: 2 }}>
      <ButtonGroup variant="outlined" size="small">
        <Button onClick={handleBack} startIcon={<BackIcon />}>
          Back
        </Button>
        <Button onClick={handleForward} startIcon={<ForwardIcon />}>
          Forward
        </Button>
        <Button onClick={handleHome} startIcon={<HomeIcon />}>
          Dashboard
        </Button>
      </ButtonGroup>
    </Box>
  );
}
