import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useSnackbar } from '../../context/SnackbarContext';

const CustomSnackbar = () => {
  const { open, message, severity, autoHideDuration, hideSnackbar } = useSnackbar();

  return (
    <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={hideSnackbar}>
      <Alert onClose={hideSnackbar} severity={severity} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;