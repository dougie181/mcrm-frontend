  import React from "react";
  import { useNavigate } from "react-router-dom";
  import {
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
  } from "@mui/material";

  // Utility function to format date as dd/mm/yyyy HH:MM
  const formatDate = (dateString) => {

    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Australia/Brisbane", // Specify the correct timezone
    };
  
    // Convert the date string to a Date object
    const date = new Date(dateString+"+0000");
  
    // Use Intl.DateTimeFormat to properly format the date for the specified timezone
    return new Intl.DateTimeFormat("en-AU", options).format(date);
  };

  const ImportHistoryTable = ({
    status,
    rows,
    showMultiSelect,
    selectedRows,
    setSelectedRows,
  }) => {
    const navigate = useNavigate();

    const handleCheckboxChange = (event, row) => {
      if (showMultiSelect) {
        if (event.target.checked) {
          setSelectedRows([...selectedRows, row]);
        } else {
          setSelectedRows(
            selectedRows.filter((selectedRow) => selectedRow.id !== row.id)
          );
        }
      } else {
        if (event.target.checked) {
          setSelectedRows([row]);
        } else {
          setSelectedRows([]);
        }
      }
    };

    const handleSelectAllClick = (event) => {
      if (event.target.checked) {
        setSelectedRows(rows);
      } else {
        setSelectedRows([]);
      }
    };

    const handleStatClick = (importId) => {
      navigate(`/import-data/change-log/${importId}`);
    };

    // No need to manually parse ISO 8601 date strings; JavaScript's Date can handle them
    const sortedRows = [...rows].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {showMultiSelect && (
                <TableCell padding="checkbox">
                  <Checkbox
                    onChange={handleSelectAllClick}
                    checked={
                      selectedRows.length === rows.length && rows.length > 0
                    }
                    indeterminate={
                      selectedRows.length > 0 && selectedRows.length < rows.length
                    }
                  />
                </TableCell>
              )}
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Filename</TableCell>
              <TableCell>Processed</TableCell>
              <TableCell>New</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Removed</TableCell>
              <TableCell>Errors</TableCell>
              <TableCell>Changes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow key={row.id}>
                {showMultiSelect && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.some(
                        (selectedRow) => selectedRow.id === row.id
                      )}
                      onChange={(event) => handleCheckboxChange(event, row)}
                    />
                  </TableCell>
                )}
                <TableCell>{row.type}</TableCell>
                <TableCell>{formatDate(row.date)}</TableCell>
                <TableCell>{row.filename}</TableCell>
                <TableCell>{row.processed}</TableCell>
                <TableCell>{row.newRecords}</TableCell>
                <TableCell>{row.updatedRecords}</TableCell>
                <TableCell>{row.removedRecords}</TableCell>
                <TableCell>{row.errorCount}</TableCell>
                {(row.newRecords !== 0 ||
                  row.updatedRecords !== 0 ||
                  row.removedRecords !== 0 ||
                  row.errorCount !== 0) && (
                  <TableCell
                    onClick={() => handleStatClick(row.id)}
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    View Changes
                  </TableCell>
                )}
                {row.newRecords === 0 &&
                  row.updatedRecords === 0 &&
                  row.removedRecords === 0 &&
                  row.errorCount === 0 && <TableCell></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  export default ImportHistoryTable;
