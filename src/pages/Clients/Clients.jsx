import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import CreateClientSidePanel from "./CreateClientSidePanel";
import styles from "./Clients.module.css";
import axiosInstance from "../../services/axiosInstance";
import {
  Box,
  Button,
  TextField,
  Slide,
  Container,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useSearch } from "../../context/SearchContext";
import { format, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const columns = [
  { field: "accountID", headerName: "Account ID", width: 90 },
  { field: "contactPersonFirstName", headerName: "First Name", width: 105 },
  { field: "contactPersonSurname", headerName: "Surname", width: 105 },
  { field: "email", headerName: "Email", width: 180 },
  {
    field: "riskProfile",
    headerName: "Risk Profile",
    width: 120,
    renderCell: (params) => params.value || "N/A",
  },
  {
    field: "soaDate",
    headerName: "SOA Date",
    width: 100,
    editable: true,
    renderCell: (params) => {
      if (params.value && !isNaN(Date.parse(params.value))) {
        const date = parseISO(params.value);
        return format(date, "dd/MM/yyyy");
      }
      return "N/A";
    },
  },
  {
    field: "customerType",
    headerName: "Customer Type",
    width: 120,
    renderCell: (params) => params.value || "N/A",
  },
  {
    field: "date",
    headerName: "Updated",
    width: 100,
    renderCell: (params) => {
      if (params.value && !isNaN(Date.parse(params.value))) {
        const date = new Date(params.value);
        return format(date, "dd/MM/yyyy");
      }
      return "N/A";
    },
  },
];

const Clients = () => {
  const [clients, setClients] = useState([]);
  const { search, setSearch } = useSearch();
  const [showCreateClientPanel, setShowCreateClientPanel] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [showInvalidClients, setShowInvalidClients] = useState(false);
  const [hardDelete, setHardDelete] = useState(false); // State to manage hard delete option
  const [showInactiveClientsOnly, setShowInactiveClientsOnly] = useState(false);
  const [selectionModel, setSelectionModel] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axiosInstance.get(
          showInvalidClients ? "/clients/invalid" : "/clients/"
        );
        const data = response.data;
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    fetchClients();
  }, [showInvalidClients]);

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
      client.accountID,
    ].join(" ");
  
    const matchesSearch = searchParts.every((part) => clientData.includes(part));
    
    // Check if we're only showing inactive clients
    if (showInactiveClientsOnly) {
      return matchesSearch && !client.active;
    }
  
    return matchesSearch;
  });

  const handleEditCellChangeCommit = async ({ id, field, value }) => {
    const formattedValue = value.trim() !== "" ? value : null;

    try {
      const response = await axiosInstance.put(`/clients/${id}`, {
        [field]: formattedValue,
      });

      if (response.status === 200) {
        setClients(
          clients.map((client) =>
            client.id === id ? { ...client, [field]: formattedValue } : client
          )
        );
        console.log("Update successful");
      } else {
        console.error("Update failed");
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleCloseCreateClientPanel = () => {
    setShowCreateClientPanel(false);
  };

  const handleSelectionChange = (newSelection) => {
    setSelectedRows(newSelection);
    setSelectionModel(newSelection); // Keep track of selected rows
  };

  const handleDeleteClientClick = () => {
    setHardDelete(false); // Reset the hard delete checkbox to unchecked
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenConfirmDialog(false);
    for (const id of selectedRows) {
      try {
        // Pass the hard delete flag based on the checkbox
        const url = `/clients/${id}${hardDelete ? "?hard_delete=true" : ""}`;
        const response = await axiosInstance.delete(url);
  
        if (response.status === 200) {
          console.log(
            `${hardDelete ? "Hard delete" : "Soft delete"} successful for client with id: ${id}`
          );
        } else {
          console.error(`${hardDelete ? "Hard delete" : "Soft delete"} failed for client with id: ${id}`);
        }
      } catch (error) {
        console.error(`${hardDelete ? "Hard delete" : "Soft delete"} failed for client with id: ${id}:`, error);
      }
    }
  
    // Clear selected rows and selection model after deletion
    setSelectedRows([]);
    setSelectionModel([]); // Clear the selection model
  
    const fetchClients = async () => {
      try {
        const response = await axiosInstance.get(
          showInvalidClients ? "/clients/invalid" : "/clients/"
        );
        const data = response.data;
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
  
    fetchClients();
  };

  const handleCancelDelete = () => {
    setOpenConfirmDialog(false);
  };

  const handleExport = () => {
    const exportData = clients.map((client) => ({
      "Account Number": client.accountID,
      "Contact Person": `${client.contactPersonFirstName} ${client.contactPersonSurname}`,
      "Preferred Name": client.preferredFirstName || "",
      "SOA Date": client.soaDate
        ? format(parseISO(client.soaDate), "dd/MM/yyyy")
        : "N/A",
      "Risk Profile": client.riskProfile || "N/A",
      "Customer Type": client.customerType || "N/A",
      CC: client.ccEmail || "",
      BCC_ID: client.bccID || "",
      Notes: client.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Client data");

    const currentDate = format(new Date(), "ddMMMyyyy");
    const fileName = `clients_export_${currentDate}.xlsx`;

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };

  const handleInvalidClientsCheckboxChange = (event) => {
    setShowInvalidClients(event.target.checked);
  };

  const handleHardDeleteCheckboxChange = (event) => {
    setHardDelete(event.target.checked);
  };

  const getRowClassName = (params) => {
    return params.row.active ? '' : styles.inactiveClientRow;
  };

  return (
    <Container maxWidth="lg">
      <Box marginTop={4}>
        <Typography variant="h4" gutterBottom>
          Clients
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
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

            <FormControlLabel
              control={
                <Checkbox
                  checked={showInvalidClients}
                  onChange={handleInvalidClientsCheckboxChange}
                  color="primary"
                />
              }
              label="Show Clients with incomplete information"
              style={{ marginLeft: 8 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showInactiveClientsOnly}
                  onChange={(e) => setShowInactiveClientsOnly(e.target.checked)}
                  color="primary"
                />
              }
              label="Show Only Inactive Clients"
              style={{ marginLeft: 8 }}
            />
          </Box>

          <Box display="flex" alignItems="center">
            {selectedRows.length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleDeleteClientClick}
                style={{ marginLeft: 8 }}
              >
                Delete
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleExport}
              style={{ marginLeft: 8 }}
            >
              EXPORT
            </Button>
          </Box>
        </Box>
        <div
          style={{
            height: "calc(100vh - 230px)",
            marginTop: 16,
          }}
        >
          <DataGrid
            className={styles.dataGridCell}
            rows={filteredClients}
            columns={columns}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            rowsPerPage={5}
            checkboxSelection
            getRowId={(row) => row.id}
            editMode="cell"
            onCellEditCommit={handleEditCellChangeCommit}
            disableSelectionOnClick
            selectionModel={selectionModel}  // Bind selection model
            onSelectionModelChange={handleSelectionChange}
            onRowClick={(params) => navigate(`/client-details/${params.row.id}`)}
            cellClassName={styles.dataGridCell}
            getRowClassName={getRowClassName}
          />
        </div>

        <Slide
          direction="left"
          in={showCreateClientPanel}
          mountOnEnter
          unmountOnExit
        >
          <div className={styles.sidePanel}>
            <CreateClientSidePanel onClose={handleCloseCreateClientPanel} />
          </div>
        </Slide>
      </Box>

      <Dialog open={openConfirmDialog} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will mark the client as inactive by default. If you want to permanently delete the client, select the "Hard Delete" option below. Are you sure you want to proceed?
          </DialogContentText>
          <FormControlLabel
            control={
              <Checkbox
                checked={hardDelete}
                onChange={handleHardDeleteCheckboxChange}
                color="secondary"
              />
            }
            label="Hard Delete"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="secondary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Clients;