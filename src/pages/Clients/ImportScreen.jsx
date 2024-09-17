import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Button, Container, Typography } from '@mui/material';
import axiosInstance from '../../services/axiosInstance';

const columns = [
  { field: 'name', headerName: 'Name', width: 200 },
  { field: 'processed', headerName: 'Read', width: 200}
  { field: 'newRecords', headerName: 'New Records', width: 200 },
  { field: 'updatedRecords', headerName: 'Updated Records', width: 200 },
  { field: 'source', headerName: 'Source', width: 200 },
  { field: 'createdDate', headerName: 'Created Date', width: 200 },
];

const ImportScreen = () => {
  const [imports, setImports] = useState([]);

  // You can replace this with an API call to fetch the import history
  const fetchImports = async () => {
    // Replace this with your API call
		const response = await axiosInstance.get('/import_history');
    const data = await response.json();

    console.log(data);
    setImports(data);
  };

  useEffect(() => {
    fetchImports();
  }, []);

  const handleStartImport = () => {
    // Your import logic here
  };

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="center" marginTop={4}>
        <Button variant="contained" color="primary" onClick={handleStartImport}>
          Start an Import
        </Button>
      </Box>
      <Box marginTop={4}>
        <Typography variant="h4">Previous Imports</Typography>
        <Box marginTop={2}>
          <div style={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={imports}
              columns={columns}
              rowsPerPageOptions={[5, 10, 25]}
              pagination
              getRowId={(row) => row.id}
              disableSelectionOnClick
            />
          </div>
        </Box>
      </Box>
    </Container>
  );
};

export default ImportScreen;
