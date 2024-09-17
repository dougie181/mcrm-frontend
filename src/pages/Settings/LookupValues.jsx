import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  IconButton,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import axiosInstance from "../../services/axiosInstance";
import { useSnackbar } from "../../context/SnackbarContext";

const LookupValues = () => {
  const [lookupValues, setLookupValues] = useState([]);
  const [lookupTypeOptions, setLookupTypeOptions] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [selectedLookupType, setSelectedLookupType] = useState("");
  const [selectedDisplayName, setSelectedDisplayName] = useState("");
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedDisplayOrder, setSelectedDisplayOrder] = useState("");
  const [newRow, setNewRow] = useState({
    name: "",
    display_name: "",
    description: "",
    display_order: "",
  });
  const [nameError, setNameError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const fetchLookupValues = async () => {
    if (selectedLookupType) {
      setLoading(true);
      try {
        const result = await axiosInstance.get(`/lookup_values/${selectedLookupType}`);
        setLookupValues(result.data);
      } catch (err) {
        showSnackbar("Failed to fetch lookup values.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const fetchLookupTypes = async () => {
      try {
        const result = await axiosInstance.get("/lookup_values/list_types");
        setLookupTypeOptions(result.data);
        if (result.data.length > 0) {
          setSelectedLookupType(result.data[0]); // Select the first lookup type
        }
      } catch (err) {
        showSnackbar("Failed to fetch lookup types.", "error");
      }
    };

    fetchLookupTypes();
  }, []);

  useEffect(() => {
    fetchLookupValues();
  }, [selectedLookupType]);

  const handleEditClick = (index, currentDisplayName, currentDescription, currentDisplayOrder) => {
    setEditIndex(index);
    setSelectedDisplayName(currentDisplayName || "");
    setSelectedDescription(currentDescription || "");
    setSelectedDisplayOrder(currentDisplayOrder || "");
  };

  const handleSaveClick = async (index, id) => {
    const updatedLookupValues = [...lookupValues];
    updatedLookupValues[index].display_name = selectedDisplayName;
    updatedLookupValues[index].description = selectedDescription;
    updatedLookupValues[index].display_order = selectedDisplayOrder;

    setLookupValues(updatedLookupValues);
    setEditIndex(null);

    try {
      await axiosInstance.patch(`/lookup_values/${selectedLookupType}`, {
        id: id,
        display_name: selectedDisplayName,
        description: selectedDescription,
        display_order: selectedDisplayOrder,
      });
      showSnackbar("Lookup value updated successfully.", "success");
    } catch (err) {
      showSnackbar("Failed to update lookup value.", "error");
    }
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setSelectedDisplayName("");
    setSelectedDescription("");
    setSelectedDisplayOrder("");
  };

  const handleDeleteClick = async (id) => {
    try {
      await axiosInstance.delete(`/lookup_values/${id}`);
      await fetchLookupValues(); // Fetch updated lookup values after delete
      showSnackbar("Lookup value deleted successfully.", "success");
    } catch (err) {
      showSnackbar("Failed to delete lookup value.", "error");
    }
  };

  const handleAddRow = async () => {
    setNameError(""); // Clear previous name error
    setDisplayNameError(""); // Clear previous display name error
    try {
      const theNewRow = { ...newRow };

      let calculatedDisplayOrder = null;
      if (lookupValues.some((item) => item.display_order !== null)) {
        const lastDisplayOrder = lookupValues
          .filter((item) => item.display_order !== null)
          .map((item) => item.display_order)
          .reduce((a, b) => Math.max(a, b), 0);
        calculatedDisplayOrder = lastDisplayOrder + 1;
      }
      theNewRow.display_order = calculatedDisplayOrder;

      const result = await axiosInstance.post(`/lookup_values/`, {
        lookup_type: selectedLookupType,
        ...theNewRow,
      });

      setLookupValues([...lookupValues, result.data]);
      setNewRow({
        name: "",
        display_name: "",
        description: "",
        display_order: "",
      });
      showSnackbar("Lookup value added successfully.", "success");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const errorField = err.response.data.field;
        if (errorField === "name") {
          setNameError(err.response.data.message);
        } else if (errorField === "display_name") {
          setDisplayNameError(err.response.data.message);
        }
      } else {
        showSnackbar("Failed to add lookup value.", "error");
      }
    }
  };

  const moveRow = async (index, direction) => {
    const updatedLookupValues = [...lookupValues];
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= updatedLookupValues.length) return;

    const tempOrder = updatedLookupValues[index].display_order;
    updatedLookupValues[index].display_order = updatedLookupValues[targetIndex].display_order;
    updatedLookupValues[targetIndex].display_order = tempOrder;

    const temp = updatedLookupValues[index];
    updatedLookupValues[index] = updatedLookupValues[targetIndex];
    updatedLookupValues[targetIndex] = temp;

    setLookupValues(updatedLookupValues);

    try {
      await axiosInstance.patch(`/lookup_values/${selectedLookupType}/reorder`, {
        reorderedLookupValues: updatedLookupValues.map((item, i) => ({
          id: item.id,
          display_order: item.display_order,
        })),
      });
      showSnackbar("Lookup values reordered successfully.", "success");
    } catch (err) {
      showSnackbar("Failed to reorder lookup values.","error");
    }
  };

  return (
    <Container maxWidth="lg">
      <Box p={2}>
        <Typography variant="h4">Lookup Values</Typography>
        <Box mt={4} mb={4}>
          <Select
            fullWidth
            value={selectedLookupType}
            onChange={(e) => setSelectedLookupType(e.target.value)}
          >
            {lookupTypeOptions.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lookupValues.sort((a, b) => a.display_order - b.display_order).map((lookupValue, index) => (
                  <TableRow key={lookupValue.id}>
                    <TableCell>{lookupValue.name}</TableCell>
                    <TableCell>
                      {editIndex === index ? (
                        <TextField
                          value={selectedDisplayName}
                          onChange={(e) => setSelectedDisplayName(e.target.value)}
                        />
                      ) : (
                        lookupValue.display_name
                      )}
                    </TableCell>
                    <TableCell>
                      {editIndex === index ? (
                        <TextField
                          value={selectedDescription}
                          onChange={(e) => setSelectedDescription(e.target.value)}
                        />
                      ) : (
                        lookupValue.description
                      )}
                    </TableCell>
                    <TableCell>{lookupValue.display_order !== null ? lookupValue.display_order : "N/A"}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {lookupValue.system ? (
                          <Typography color="textSecondary">System Value</Typography>
                        ) : (
                          <>
                            {editIndex === index ? (
                              <>
                                <IconButton
                                  color="primary"
                                  onClick={() => handleSaveClick(index, lookupValue.id)}
                                >
                                  <CheckIcon />
                                </IconButton>
                                <IconButton color="secondary" onClick={handleCancelClick}>
                                  <CloseIcon />
                                </IconButton>
                              </>
                            ) : (
                              <>
                                <Button
                                  color="secondary"
                                  onClick={() =>
                                    handleEditClick(
                                      index,
                                      lookupValue.display_name,
                                      lookupValue.description,
                                      lookupValue.display_order
                                    )
                                  }
                                >
                                  Edit
                                </Button>
                                <IconButton
                                  color="secondary"
                                  onClick={() => handleDeleteClick(lookupValue.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                                {lookupValue.display_order !== null && (
                                  <>
                                    <IconButton
                                      color="primary"
                                      onClick={() => moveRow(index, -1)}
                                      disabled={index === 0 || lookupValue.display_order === null}
                                    >
                                      <ArrowUpwardIcon />
                                    </IconButton>
                                    <IconButton
                                      color="primary"
                                      onClick={() => moveRow(index, 1)}
                                      disabled={index === lookupValues.length - 1 || lookupValue.display_order === null}
                                    >
                                      <ArrowDownwardIcon />
                                    </IconButton>
                                  </>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {selectedLookupType && (
                  <TableRow>
                    <TableCell>
                      <TextField
                        placeholder="Name"
                        value={newRow.name}
                        onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                        error={!!nameError}
                        helperText={nameError}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        placeholder="Display Name"
                        value={newRow.display_name}
                        onChange={(e) => setNewRow({ ...newRow, display_name: e.target.value })}
                        error={!!displayNameError}
                        helperText={displayNameError}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        placeholder="Description"
                        value={newRow.description}
                        onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                      />
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={handleAddRow}>
                        <AddIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default LookupValues;
