import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  IconButton,
  InputAdornment,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import axiosInstance from "../../services/axiosInstance";
import SearchIcon from "@mui/icons-material/Search";

const ParametersTable = ({
  params,
  parameterErrors,
  handleInputChange,
  handleTypeChange,
  handleOperationChange,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [apiEndpoints, setApiEndpoints] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const fetchApiEndpoints = async (selectable) => {
    try {
      const response = await axiosInstance("/lookup_data/");
      const allEndpoints = response.data;
      if (!selectable) {
        response.data = allEndpoints.filter(
          (endpoint) => !endpoint.selectable
        );
      } else {
        response.data = allEndpoints.filter(
          (endpoint) => endpoint.selectable
        );
      }
      setApiEndpoints(response.data);

    } catch (error) {
      console.error("Failed to fetch API endpoints:", error);
    }
  };

  const handleOpenDialog = (index, selectable) => {
    setActiveIndex(index);
    fetchApiEndpoints(selectable);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setActiveIndex(-1);
    setOpenDialog(false);
  };

  const handleSelectEndpoint = (endpoint) => {
    if (activeIndex >= 0) {
      // Ensure we have a valid index
      handleInputChange(activeIndex, "apiEndpoint", endpoint);
      handleCloseDialog();
    }
  };

  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Options/Value</TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {params.map((param, index) => (
            <TableRow key={index}>
              <TableCell>{param.name}</TableCell>
              <TableCell>
                <TextField
                  error={!!parameterErrors[index]?.description}
                  helperText={parameterErrors[index]?.description}
                  value={param.description}
                  onChange={(e) =>
                    handleInputChange(index, "description", e.target.value)
                  }
                />
              </TableCell>

              <TableCell>
                <FormControl error={!!parameterErrors[index]?.type} fullWidth>
                  <Select
                    value={param.type}
                    onChange={(e) => handleTypeChange(index, e.target.value)}
                  >
                    <MenuItem value="text">Text Input</MenuItem>
                    <MenuItem value="numeric">Numeric Input</MenuItem>
                    <MenuItem value="integer">Integer Input</MenuItem>
                    <MenuItem value="dropdown">Dropdown</MenuItem>
                    <MenuItem value="multi-select">Multi-Select</MenuItem>
                    <MenuItem value="autocomplete">Autocomplete</MenuItem>
                    <MenuItem value="date">Date Picker</MenuItem>
                    <MenuItem value="boolean">Boolean</MenuItem>
                    <MenuItem value="search">Search</MenuItem>
                  </Select>
                  <FormHelperText>
                    {parameterErrors[index]?.type}
                  </FormHelperText>
                </FormControl>
              </TableCell>

              {(param.type === "dropdown" ||
                param.type === "multi-select" ||
                param.type === "autocomplete") && (
                <>
                  <TableCell>
                    <FormControl variant="outlined" fullWidth>
                      <Select
                        error={!!parameterErrors[index]?.source}
                        value={param.source}
                        onChange={(e) =>
                          handleInputChange(index, "source", e.target.value)
                        }
                      >
                        <MenuItem value="static">Static</MenuItem>
                        <MenuItem value="api">API</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {param.source === "static" ? (
                      <TextField
                        error={!!parameterErrors[index]?.options}
                        helperText={parameterErrors[index]?.options}
                        label="Options (comma separated)"
                        fullWidth
                        value={param.options.join(",")}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "options",
                            e.target.value
                              .split(",")
                              .map((option) => option.trim())
                          )
                        }
                      />
                    ) : (
                      <TextField
                        error={!!parameterErrors[index]?.apiEndpoint}
                        helperText={parameterErrors[index]?.apiEndpoint}
                        label="API Endpoint"
                        fullWidth
                        value={param.apiEndpoint}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "apiEndpoint",
                            e.target.value
                          )
                        }
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="lookup api endpoint"
                                onClick={() => handleOpenDialog(index, true)}
                              >
                                <SearchIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  </TableCell>
                </>
              )}
              {param.type === "search" && (
                <TableCell>
                  <TextField
                    error={!!parameterErrors[index]?.apiEndpoint}
                    helperText={parameterErrors[index]?.apiEndpoint}
                    label="API Endpoint"
                    fullWidth
                    value={param.apiEndpoint}
                    onChange={(e) =>
                      handleInputChange(index, "apiEndpoint", e.target.value)
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="lookup api endpoint"
                            onClick={() => handleOpenDialog(index, false)}
                          >
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </TableCell>
              )}
              {param.type === "operation" && (
                <TableCell>
                  <FormControl>
                    <Select
                      error={!!parameterErrors[index]?.operation}
                      value={param.value}
                      onChange={(e) =>
                        handleOperationChange(index, e.target.value)
                      }
                    >
                      <MenuItem value="<">&lt;</MenuItem>
                      <MenuItem value="<=">&lt;=</MenuItem>
                      <MenuItem value="=">=</MenuItem>
                      <MenuItem value=">">&gt;</MenuItem>
                      <MenuItem value=">=">&gt;=</MenuItem>
                      <MenuItem value="<>">&lt;&gt;</MenuItem>
                      <MenuItem value="in">IN</MenuItem>
                      <MenuItem value="like">LIKE</MenuItem>
                    </Select>
                    <FormHelperText>
                      {!!parameterErrors[index]?.operation}
                    </FormHelperText>
                  </FormControl>
                </TableCell>
              )}
              {/* have a blank cell for operation to balance out the table */}

              {param.type !== "dropdown" &&
                param.type !== "multi-select" &&
                param.type !== "operation" &&
                param.type !== "search" && <TableCell></TableCell>}

              <TableCell>
                {parameterErrors[index] &&
                  Object.keys(parameterErrors[index]).length > 0 && (
                    <ErrorIcon color="error" />
                  )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Select an Endpoint</DialogTitle>
        <DialogContent>
          <List>
            {apiEndpoints.map((option) => (
              <ListItem
                key={option.id}
                onClick={() => handleSelectEndpoint(option.endpoint)}
              >
                <ListItemText
                  primary={option.display_name}
                  secondary={option.description}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParametersTable;
