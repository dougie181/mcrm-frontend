import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axiosInstance from "../../services/axiosInstance";
import { DataGrid } from "@mui/x-data-grid";
import { useSearch } from "../../context/SearchContext";
import { parse, format } from "date-fns";
import styles from "./ClientSearchDialog.module.css";

const columns = [
  { field: "accountID", headerName: "Account ID", width: 90 },
  { field: "contactPersonFirstName", headerName: "First Name", width: 105 },
  { field: "contactPersonSurname", headerName: "Surname", width: 105 },
  { field: "email", headerName: "Email", width: 180 },
  { field: "riskProfile", headerName: "Risk Profile", width: 120 },
  {
    field: "soaDate",
    headerName: "SOA Date",
    width: 100,
    editable: true,
    renderCell: (params) => {
      if (!params.value || isNaN(new Date(params.value).getTime())) {
        return "Invalid Date"; // or return null or a placeholder text
      }
      const date = parse(params.value, 'yyyy-MM-dd', new Date());
      return format(date, "dd/MM/yyyy");
    },
  },
  {
    field: "date",
    headerName: "Updated",
    width: 100,
    renderCell: (params) => {
      if (!params.value || isNaN(new Date(params.value).getTime())) {
        return "Invalid Date"; // or return null or a placeholder text
      }
      const date = parse(params.value, 'yyyy-MM-dd', new Date());
      return format(date, "dd/MM/yyyy");
    },
  },
  { field: "customerType", headerName: "Customer Type", width: 120 },
];

const ClientSearchDialog = ({ open, onClose, onLink }) => {
  const [clients, setClients] = useState([]);
  const { search, setSearch } = useSearch();
  const [selectedClient, setSelectedClient] = useState(null);

  const handleSelectionChange = (newSelection) => {
    const lastSelectedId = newSelection[newSelection.length - 1] || null;
    const lastSelectedClient =
      clients.find((client) => client.id === lastSelectedId) || null;
    setSelectedClient(lastSelectedClient);
  };

  useEffect(() => {
    const hideSelectAllCheckbox = () => {
      const checkboxHeader = document.querySelector(
        ".MuiDataGrid-checkboxInputHeader"
      );
      if (checkboxHeader) {
        checkboxHeader.style.display = "none";
      }
    };

    hideSelectAllCheckbox();
  }, []);

  useEffect(() => {
    setSelectedClient(null);
  }, [open]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axiosInstance.get("/clients/");
        const data = response.data;
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    fetchClients();
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredClients = clients.filter((client) => {
    const searchParts = search
      .toLowerCase()
      .split(" ")
      .filter((part) => part.length > 0);

    const clientData = [
      client.contactPersonFirstName.toLowerCase(),
      client.contactPersonSurname.toLowerCase(),
      client.email.toLowerCase(),
      client.accountID
    ].join(" ");

    return searchParts.every((part) => clientData.includes(part));
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg">
      <DialogTitle>Search for a Client</DialogTitle>
      <DialogContent>
        <Box sx={{ width: 600, padding: 4 }}>
          <Grid item xs={12}>
            <TextField
              label="Search"
              variant="outlined"
              value={search}
              onChange={handleSearch}
              style={{ width: 300 }}
              placeholder="Search name or email address"
              InputProps={{
                endAdornment: (
                  <SearchIcon
                    style={{ color: "rgba(0, 0, 0, 0.54)", marginRight: "8px" }}
                  />
                ),
              }}
            />
            <DataGrid
              className={styles.dataGridCell}
              style={{ height: "400px" }}
              rows={filteredClients}
              columns={columns}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              sx={{
                "& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-columnHeaderTitleContainer":
                  {
                    display: "none",
                  },
              }}
              rowsPerPage={5}
              checkboxSelection
              getRowId={(row) => row.id}
              editMode="cell"
              disableSelectionOnClick
              onSelectionModelChange={handleSelectionChange}
              onRowClick={(params) => {
                console.log("row clicked", params.row.id);
              }}
              selectionModel={[selectedClient ? selectedClient.id : null]}
            />
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onLink(selectedClient)} disabled={!selectedClient}>Link</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientSearchDialog;
