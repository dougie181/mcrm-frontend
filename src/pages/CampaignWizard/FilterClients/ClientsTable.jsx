import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  TablePagination,
  Box,
  Typography,
  IconButton,
  TextField,
  Tooltip,
  Button,
  Switch
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import InfoIcon from "@mui/icons-material/Info";
import * as XLSX from "xlsx";
import styles from "./ClientsTable.module.css";

const ClientsTable = ({
  clients,
  columns,
  selectedClients,
  setSelectedClients,
  handleApplyManualExclusions,
  handleApplyManualInclusions,
  page,
  rowsPerPage,
  setPage,
  setRowsPerPage,
  isSelected,
  filters,
  filteredClientsPerRule,
  setFilterOpen,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilteredClientsOnly, setShowFilteredClientsOnly] = useState(false);
  const [animateFilterIcon, setAnimateFilterIcon] = useState(false);
  const [hasWobbled, setHasWobbled] = useState(false);
  const [filterClicked, setFilterClicked] = useState(false);
  const timerRef = useRef(null);

  const handleSelectClient = (clientId) => {
    setSelectedClients((prevSelected) =>
      prevSelected.includes(clientId)
        ? prevSelected.filter((id) => id !== clientId)
        : [...prevSelected, clientId]
    );
    resetTimer();
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const allVisibleClientIds = sortedAndFilteredClients
        .map((client) => client["clients.id"])
        .filter(Boolean);
      setSelectedClients(allVisibleClientIds);
    } else {
      setSelectedClients([]);
    }
    resetTimer();
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(clients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, `Clients_${new Date().toISOString()}.xlsx`);
    resetTimer();
  };

  const handleSort = (column) => {
    let direction = "asc";
    if (sortConfig.key === column && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: column, direction });
    resetTimer();
  };

  const resetTimer = () => {
    clearTimeout(timerRef.current); 
    if (!hasWobbled && !filterClicked) { 
      setAnimateFilterIcon(false); 
      timerRef.current = setTimeout(() => {
        setAnimateFilterIcon(true); 
        setHasWobbled(true); 
      }, 5000);
    }
  };

  useEffect(() => {
    resetTimer();

    return () => clearTimeout(timerRef.current);
  }, []);

  const handleFilterButtonClick = () => {
    setFilterOpen(true);
    setFilterClicked(true);
    clearTimeout(timerRef.current);
    setAnimateFilterIcon(false);
  };

  const sortedAndFilteredClients = useMemo(() => {
    let filteredClients = clients;

    if (searchQuery) {
      filteredClients = filteredClients.filter((client) =>
        columns.some((column) =>
          client[column]
            ?.toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      );
    }

    if (sortConfig.key) {
      filteredClients.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    // Show only filtered clients if the toggle is active
    if (showFilteredClientsOnly) {
      filteredClients = filteredClients.filter((client) =>
        Object.values(filteredClientsPerRule).some((rule) =>
          rule.includes(client["clients.id"])
        )
      );
    } else {
      // Default case when toggle is off
      filteredClients = filteredClients.filter(
        (client) =>
          !Object.values(filteredClientsPerRule).some((rule) =>
            rule.includes(client["clients.id"])
          )
      );
    }

    return filteredClients;
  }, [
    clients,
    columns,
    searchQuery,
    sortConfig,
    showFilteredClientsOnly,
    filteredClientsPerRule,
  ]);

  // Determine the background color based on the filtering rule
  const getRowBackgroundColor = (clientId) => {
    if (!filteredClientsPerRule) return "inherit";

    if (filteredClientsPerRule.manual_exclusions?.includes(clientId)) {
      return "rgba(255, 0, 0, 0.1)";
    } else if (
      filteredClientsPerRule.exclude_previous_campaigns?.includes(clientId)
    ) {
      return "rgba(0, 0, 255, 0.1)";
    }
    return "inherit"; // Default color if not filtered
  };

  // Determine the button label based on the selection
  const getButtonLabel = () => {
    const selectedAreFiltered = selectedClients.some((clientId) =>
      Object.values(filteredClientsPerRule).some((rule) =>
        rule.includes(clientId)
      )
    );
    const selectedAreNotFiltered = selectedClients.some((clientId) =>
      Object.values(filteredClientsPerRule).every(
        (rule) => !rule.includes(clientId)
      )
    );

    if (selectedAreFiltered && selectedAreNotFiltered) {
      return "Amend filters";
    } else if (selectedAreFiltered) {
      return "Override filter";
    }
    return "Exclude Selected Records";
  };

  const calculateFilteredClientsNumber = () => {
    // Return the total unique number of clients that are filtered
    const listOfClientIds = Object.values(filteredClientsPerRule).flat();
    return [...new Set(listOfClientIds)].length;
  };

  // Calculate the number of filtered clients
  const totalFilteredClients = Object.values(filteredClientsPerRule).flat().length;
  const totalClients = clients.length;


  const applyManualExclusions = () => {
    console.log("Apply manual exclusions")
    handleApplyManualExclusions()
  };
    
  const applyManualInclusions = () => {
    console.log("Apply manual inclusions");
  
    // Check how many clients are selected and if they represent all remaining viewable clients
    const allVisibleClientIds = sortedAndFilteredClients
      .map((client) => client["clients.id"])
      .filter(Boolean);
  
    const allSelected = selectedClients.length === allVisibleClientIds.length;
  
    // If all selected clients represent all visible clients, disable the toggle switch
    if (allSelected) {
      setShowFilteredClientsOnly(false);
    }
  
    // Call the existing inclusion logic
    handleApplyManualInclusions();
  };

  return (
    <Box mt={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <TextField
          variant="outlined"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 300 }}
        />
        {totalFilteredClients > 0 && (
          <Box display="flex" alignItems="center" ml={2}>
            <Switch
              checked={showFilteredClientsOnly}
              onChange={() => setShowFilteredClientsOnly((prev) => !prev)}
            />
            <Typography>
              Show excluded clients only
              {showFilteredClientsOnly && ` (${totalFilteredClients})`}
            </Typography>
          </Box>
        )}
        {totalFilteredClients === 0 && totalClients > 0 && (
          <Box display="flex" alignItems="center" ml={3}>
            <InfoIcon />
            <Typography ml={1}>
              No filters have been applied
            </Typography>
          </Box>
        )}
        <Box display="flex" justifyContent="right" ml="auto">
          {selectedClients.length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                onClick={() =>
                  selectedClients.some((clientId) =>
                    Object.values(filteredClientsPerRule).some((rule) =>
                      rule.includes(clientId)
                    )
                  )
                    ? applyManualInclusions()
                    : applyManualExclusions()
                }
                sx={{ mr: 2, marginY: 1 }}
              >
                {getButtonLabel()}
              </Button>
            )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleExport}
            sx={{ mr: 2, marginY: 1 }}
          >
            Export to Excel
          </Button>
          <Tooltip title="Show filters">
            <IconButton
              onClick={handleFilterButtonClick}
              className={animateFilterIcon ? styles.wobble : ""}
            >
              <Typography mr={1}>Filters</Typography>
              <FilterListIcon />
              {filters.length > 0 && (
                <Box
                  component="span"
                  sx={{
                    backgroundColor: "red",
                    color: "white",
                    borderRadius: "50%",
                    padding: "0 5px",
                    fontSize: "0.75rem",
                    position: "relative",
                    bottom: 10,
                    left: -8,
                  }}
                >
                  {filters.length}
                </Box>
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ marginTop: 0, maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                sx={{
                  position: "sticky",
                  left: 0,
                  top: 0,
                  zIndex: 2,
                  backgroundColor: "white",
                }}
              >
                <Checkbox
                  indeterminate={
                    selectedClients.length > 0 &&
                    selectedClients.length < sortedAndFilteredClients.length
                  }
                  checked={
                    sortedAndFilteredClients.length > 0 &&
                    selectedClients.length === sortedAndFilteredClients.length
                  }
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              {columns.map((header) => (
                <TableCell
                  key={header}
                  onClick={() => handleSort(header)}
                  sx={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "white",
                    zIndex: 1,
                  }}
                >
                  {header}
                  {sortConfig.key === header
                    ? sortConfig.direction === "asc"
                      ? " 🔼"
                      : " 🔽"
                    : null}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAndFilteredClients
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                const isItemSelected = isSelected(row["clients.id"]);
                const rowBackgroundColor = getRowBackgroundColor(
                  row["clients.id"]
                );
                return (
                  <TableRow
                    key={row["clients.id"]}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    selected={isItemSelected}
                    onClick={() => handleSelectClient(row["clients.id"])}
                    sx={{
                      backgroundColor: rowBackgroundColor,
                      opacity:
                        !showFilteredClientsOnly &&
                        Object.values(filteredClientsPerRule).some((rule) =>
                          rule.includes(row["clients.id"])
                        )
                          ? 0.5
                          : 1,
                    }}
                  >
                    <TableCell
                      padding="checkbox"
                      sx={{
                        position: "sticky",
                        left: 0,
                        backgroundColor: "white",
                        zIndex: 1,
                      }}
                    >
                      <Checkbox
                        checked={isItemSelected}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => handleSelectClient(row["clients.id"])}
                      />
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell key={`${row["clients.id"]}-${col}`}>
                        {row[col]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={sortedAndFilteredClients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          sx={{ 
            position: "sticky", 
            bottom: 0, 
            backgroundColor: "white", 
            zIndex: 2
          }}
        />
      </TableContainer>
      {sortedAndFilteredClients.length === 0 && (
        <Typography>No clients available</Typography>
      )}
    </Box>
  );
};

export default ClientsTable;