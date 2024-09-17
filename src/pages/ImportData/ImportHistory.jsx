import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../services/axiosInstance";
import ImportHistoryTable from "./ImportHistoryTable";
import {
  Snackbar,
  Alert,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

const ImportHistory = () => {
  const [importHistory, setImportHistory] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedSuccessRows, setSelectedSuccessRows] = useState([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState("");

  const fetchImportHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/import_history/");
      const sortedData = response.data.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setImportHistory(sortedData);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchImportHistory();
  }, [fetchImportHistory]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Group rows by status
  const statusGroups = {};
  importHistory.forEach((row) => {
    if (statusGroups[row.status]) {
      statusGroups[row.status].push(row);
    } else {
      statusGroups[row.status] = [row];
    }
  });

  const sortedStatusGroups = {};
  ["ready to process", "uploading", "success"].forEach((status) => {
    if (statusGroups[status]) {
      sortedStatusGroups[status] = statusGroups[status];
    }
  });

  // Function to compare files by type and date for sorting
  const compareFiles = (a, b) => {
    const typeOrder = { clients: 1, accounts: 2, products: 3, risk_profile: 4 };
    if (typeOrder[a.type] < typeOrder[b.type]) return -1;
    if (typeOrder[a.type] > typeOrder[b.type]) return 1;

    // If types are the same, compare dates
    return new Date(a.date) - new Date(b.date);
  };

  const processSelectedRows = async () => {
    // Sort selectedRows by type and then by date
    const sortedSelectedRows = [...selectedRows].sort(compareFiles);

    let processedCount = 0;
    let failedCount = 0;
    let errorOccurred = false;
    let errorMessage = "";

    for (const row of sortedSelectedRows) {
      if (errorOccurred) break; // Stop processing if an error has occurred

      try {
        const processResponse = await axiosInstance.post(
          `/import_history/${row.id}/process`
        );
        console.log("processResponse:", processResponse);
        processedCount++;
      } catch (error) {
        console.log("error: ", error);
        errorMessage = "Error processing file.";
        // lets see if we can get more info on the error
        if ( error.response && error.response.data && error.response.data.details && error.response.data.details.error ) {
          errorMessage += ` Details: ${error.response.data.details.error}`;
        } else if (error.response && error.response.data && error.response.data.error) {
          errorMessage += ` Details: ${error.response.data.error}`;
        }

        console.log("errorMessage:", errorMessage);
        showSnackbar(errorMessage, "error");
        console.error(`Error processing record with ID ${row.id}:`, error);
        failedCount++;
        errorOccurred = true; // Set flag to true to stop further processing
      }
    }

    // Clear the selected rows after processing
    setSelectedRows([]);

    // Refresh the import history
    const importHistoryResponse = await axiosInstance.get("/import_history/");
    const sortedData = importHistoryResponse.data.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    setImportHistory(sortedData);

    // Show success and failure notifications
    if (processedCount > 0) {
      showSnackbar(
        `${processedCount} records processed successfully!`,
        "success"
      );
    }
    if (failedCount > 0) {
      // Adjust message to reflect early termination on error
      let message = `Processing stopped due to an error. ${failedCount} records failed to process. Please check the logs for details.`;

      if (errorMessage !=='') {
        message = `Processing stopped due to an error. ${failedCount} records failed to process with error: ${errorMessage}.`;
      }

      showSnackbar(
        message,
        "error"
      );
    }
  };

  const handleProcessClick = async () => {
    setDialogType("process");
    setIsDialogOpen(true);
  };

  const clearHistory = async () => {
    console.log("Clearing history");
    //selectedSuccessRows.forEach((row)
    let deleteCount = 0;

    for (const row of selectedSuccessRows) {
      try {
        // Assuming each row has an 'id' that can be used to delete
        const response = await axiosInstance.delete(
          `/import_history/${row.id}`
        );
        console.log("Delete response:", response.data);
        deleteCount++;
      } catch (error) {
        console.error("Error deleting record:", error);
        showSnackbar(
          "An error occurred during deletion. Please try again.",
          "error"
        );
        break; // Stop attempting to delete if an error occurs
      }
    }

    // Clear the selected rows after deletion
    setSelectedSuccessRows([]);

    fetchImportHistory();
    // Show success and failure notifications
    if (deleteCount > 0) {
      showSnackbar(`${deleteCount} records deleted successfully!`, "success");
    }
  };

  const handleClearHistory = async () => {
    setDialogType("clearHistory");
    setIsDialogOpen(true);
  };

  const deleteSelectedRows = async () => {
    let deleteCount = 0;

    for (const row of selectedRows) {
      try {
        // Assuming each row has an 'id' that can be used to delete
        const response = await axiosInstance.delete(
          `/import_history/${row.id}`
        );
        console.log("Delete response:", response.data);
        deleteCount++;
      } catch (error) {
        console.error("Error deleting record:", error);
        showSnackbar(
          "An error occurred during deletion. Please try again.",
          "error"
        );
        break; // Stop attempting to delete if an error occurs
      }
    }

    // Clear the selected rows after deletion
    setSelectedRows([]);

    // Refresh the import history
    try {
      const importHistoryResponse = await axiosInstance.get("/import_history/");
      const sortedData = importHistoryResponse.data.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setImportHistory(sortedData);
      if (deleteCount > 0) {
        showSnackbar(`${deleteCount} records deleted successfully!`, "success");
      }
    } catch (fetchError) {
      console.error("Error refreshing import history:", fetchError);
      showSnackbar("Failed to refresh import history after deletion.", "error");
    }
  };

  const handleDeleteClick = async () => {
    setDialogType("delete");
    setIsDialogOpen(true);
  };

  const ConfirmationDialog = () => {
    const getDialogMessage = () => {
      switch (dialogType) {
        case "process":
          return "process the selected records";
        case "delete":
          return "delete the selected records";
        case "clearHistory":
          return "clear the history";
        default:
          return "complete this action";
      }
    };

    const handleClose = (confirmed) => {
      setIsDialogOpen(false);
      if (confirmed) {
        if (dialogType === "process") {
          processSelectedRows();
        } else if (dialogType === "delete") {
          deleteSelectedRows();
        } else if (dialogType === "clearHistory") {
          clearHistory();
        }
      }
    };

    return (
      <Dialog
        open={isDialogOpen}
        onClose={() => handleClose(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to {getDialogMessage()}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={() => handleClose(true)} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Import History
      </Typography>
      {Object.entries(sortedStatusGroups).map(([status, rows]) => (
        <Card key={status} style={{ marginBottom: "20px" }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={8}>
                <Typography variant="h6" gutterBottom>
                  {status}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                {status === "ready to process" && (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleDeleteClick} // Updated to call the modified handleDeleteClick
                      style={{ float: "right", marginLeft: "8px" }}
                      disabled={selectedRows.length === 0} // Enable button if one or more rows are selected
                    >
                      Delete
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleProcessClick}
                      style={{ float: "right" }}
                      disabled={selectedRows.length === 0} // Enable button if one or more rows are selected
                    >
                      Process
                    </Button>
                  </>
                )}
                {status === "success" && (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleClearHistory}
                      style={{ float: "right", marginLeft: "8px" }}
                      disabled={selectedSuccessRows.length === 0}
                    >
                      Clear History
                    </Button>
                  </>
                )}
              </Grid>
              <Grid item xs={12}>
                <ImportHistoryTable 
                  status={status}
                  rows={rows}
                  showMultiSelect={
                    status === "ready to process" || status === "success"
                  }
                  selectedRows={
                    status === "success" ? selectedSuccessRows : selectedRows
                  }
                  setSelectedRows={
                    status === "success"
                      ? setSelectedSuccessRows
                      : setSelectedRows
                  }
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <ConfirmationDialog />
    </>
  );
};

export default ImportHistory;
