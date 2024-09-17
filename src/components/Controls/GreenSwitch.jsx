import React from 'react';
import { Switch } from '@mui/material';
import { styled } from "@mui/system";

const GreenSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: 'green',
    '&:hover': {
      backgroundColor: 'rgba(0, 255, 0, 0.08)',
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: 'green',
  },
}));

export default GreenSwitch