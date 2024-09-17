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
  Checkbox,
  TablePagination,
  Toolbar,
  Tooltip,
  TextField,
  FormControlLabel,
  Grid,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "../../services/axiosInstance";

const AssetMapping = () => {
  const [assetTypes, setAssetTypes] = useState([]);
  const [filteredAssetTypes, setFilteredAssetTypes] = useState([]);
  const [assetTypeOptions, setAssetTypeOptions] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [selectedAssetType, setSelectedAssetType] = useState("");
  const [bulkSelectedAssetType, setBulkSelectedAssetType] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [showWithoutAssetType, setShowWithoutAssetType] = useState(true);

  useEffect(() => {
    const fetchAssetTypes = async () => {
      const result = await axiosInstance.get("/lookup_values/assetType");
      setAssetTypeOptions(result.data);
    };

    const fetchData = async () => {
      const result = await axiosInstance.get("/products/listOfProductsWithAssetTypes");
      setAssetTypes(result.data);
      setFilteredAssetTypes(
        result.data.filter(
          (assetType) => assetType.assetType === 'None' || assetType.assetType === 'Inconsistent'
        )
      );
    };

    fetchAssetTypes().then(() => {
      fetchData();
    });
  }, []);

  const handleEditClick = (index, currentAssetType) => {
    if (editIndex !== index) {
      setEditIndex(index);
      const isValidOption = assetTypeOptions.some(option => option.name === currentAssetType);
      setSelectedAssetType(isValidOption ? currentAssetType : '');
      setSelectedProducts([]);  // Clear selected products
    }
  };

  const handleSaveClick = async (index, productCode) => {
    // Find the correct index in the original assetTypes array
    const originalIndex = assetTypes.findIndex(asset => asset.productCode === productCode);
    if (originalIndex !== -1) {
      const updatedAssetTypes = [...assetTypes];
      updatedAssetTypes[originalIndex].assetType = selectedAssetType;
      setAssetTypes(updatedAssetTypes);
      filterData(searchTerm, showWithoutAssetType);  // Reapply search and filter after saving
      setEditIndex(null);

      await axiosInstance.patch("/products/updateProductWithAssetType", {
        products: [
          {
            productCode: productCode,
            assetType: selectedAssetType,
          },
        ],
      });
    }
  };

  const handleBulkSaveClick = async () => {
    const productsToUpdate = selectedProducts.map((product) => ({
      productCode: product.productCode,
      assetType: bulkSelectedAssetType,
    }));
    await axiosInstance.patch("/products/updateProductWithAssetType", {
      products: productsToUpdate,
    });

    const updatedAssetTypes = [...assetTypes];
    selectedProducts.forEach((product) => {
      const originalIndex = updatedAssetTypes.findIndex(asset => asset.productCode === product.productCode);
      if (originalIndex !== -1) {
        updatedAssetTypes[originalIndex].assetType = bulkSelectedAssetType;
      }
    });

    setAssetTypes(updatedAssetTypes);
    setSelectedProducts([]);
    setBulkSelectedAssetType("");
    filterData(searchTerm, showWithoutAssetType);  // Reapply search and filter
  };

  const handleCancelClick = (event) => {
    event.stopPropagation();
    setEditIndex(null);
    setSelectedAssetType("");
  };

  const handleSelectAllClick = (event) => {
    if (editIndex !== null) {
      setEditIndex(null);  // Cancel inline edit mode
    }
  
    if (event.target.checked) {
      // Select all rows on the current page
      const newSelectedProducts = filteredAssetTypes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      setSelectedProducts(newSelectedProducts);
    } else {
      // Deselect all rows on the current page
      const currentPageProducts = filteredAssetTypes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      const newSelectedProducts = selectedProducts.filter(
        (product) => !currentPageProducts.includes(product)
      );
      setSelectedProducts(newSelectedProducts);
    }
  };
  

  const handleClick = (event, product) => {
    if (editIndex !== null) {
      setEditIndex(null);  // Cancel inline edit mode
    }

    const selectedIndex = selectedProducts.indexOf(product);
    let newSelectedProducts = [];

    if (selectedIndex === -1) {
      newSelectedProducts = newSelectedProducts.concat(selectedProducts, product);
    } else if (selectedIndex === 0) {
      newSelectedProducts = newSelectedProducts.concat(selectedProducts.slice(1));
    } else if (selectedIndex === selectedProducts.length - 1) {
      newSelectedProducts = newSelectedProducts.concat(selectedProducts.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelectedProducts = newSelectedProducts.concat(
        selectedProducts.slice(0, selectedIndex),
        selectedProducts.slice(selectedIndex + 1),
      );
    }

    setSelectedProducts(newSelectedProducts);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    filterData(event.target.value, showWithoutAssetType);
  };

  const handleFilterChange = (event) => {
    // reset the selected products when filter changes
    setSelectedProducts([]);
    setShowWithoutAssetType(event.target.checked);
    filterData(searchTerm, event.target.checked);
  };

  const filterData = (searchTerm, showWithoutAssetType) => {
    let filtered = assetTypes;
    // filter where assetType is None or Inconsistent
    if (showWithoutAssetType) {
      filtered = filtered.filter(assetType =>
        assetType.assetType === 'None' || assetType.assetType === 'Inconsistent'
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(assetType =>
        assetType.productCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredAssetTypes(filtered);
  };

  const isSelected = (product) => selectedProducts.indexOf(product) !== -1;

  return (
    <Container maxWidth="lg">
      <Box p={2}>
        <Typography variant="h4" gutterBottom>Asset Mapping</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField
              label="Search Product"
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={<Checkbox checked={showWithoutAssetType} onChange={handleFilterChange} />}
              label="Show unallocated Asset Type"
            />
          </Grid>
          <Grid item xs={12} md={7} container justifyContent="flex-end">
            {selectedProducts.length > 0 && (
              <Toolbar>
                <Typography variant="subtitle1" style={{ marginRight: '1rem' }}>
                  {selectedProducts.length} selected
                </Typography>
                <Select
                  value={bulkSelectedAssetType}
                  onChange={(e) => setBulkSelectedAssetType(e.target.value)}
                  variant="outlined"
                  displayEmpty
                  renderValue={(value) => value ? assetTypeOptions.find(option => option.name === value)?.display_name : 'Select Asset Type'}
                  style={{ marginRight: '1rem' }}
                >
                  <MenuItem value="" disabled>
                    Select Asset Type
                  </MenuItem>
                  <MenuItem value="None">
                    None
                  </MenuItem>
                  {assetTypeOptions.map((option) => (
                    <MenuItem key={option.id} value={option.name}>
                      {option.display_name}
                    </MenuItem>
                  ))}
                </Select>
                <Tooltip title="Apply Asset Type">
                  <Button variant="contained" color="primary" onClick={handleBulkSaveClick}>
                    Apply to Selected
                  </Button>
                </Tooltip>
              </Toolbar>
            )}
          </Grid>
        </Grid>
        <Box mt={2} mb={4}>
          <TableContainer component={Paper}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedProducts.length > 0 &&
                      selectedProducts.length < filteredAssetTypes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length
                    }
                    checked={
                      filteredAssetTypes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length > 0 &&
                      selectedProducts.length === filteredAssetTypes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length
                    }
                    onChange={handleSelectAllClick}
                    disabled={editIndex !== null}  // Disable if in edit mode
                  />
                </TableCell>
                  <TableCell>Product Code</TableCell>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Asset Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssetTypes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((assetType, index) => (
                  <TableRow
                    key={assetType.productCode}
                    selected={isSelected(assetType)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected(assetType)}
                        onClick={(event) => handleClick(event, assetType)}
                        disabled={editIndex !== null}  // Disable if in edit mode
                      />
                    </TableCell>
                    <TableCell>{assetType.productCode}</TableCell>
                    <TableCell>{assetType.productName}</TableCell>
                    <TableCell
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEditClick(index, assetType.assetType);
                      }}
                    >
                      {editIndex === index ? (
                        <Box display="flex" alignItems="center">
                        <Select
                          value={selectedAssetType}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedAssetType(e.target.value);
                          }}
                          variant="outlined"
                          displayEmpty
                          renderValue={(value) => value ? assetTypeOptions.find(option => option.name === value)?.display_name : 'Select Asset Type'}
                          fullWidth
                        >
                          <MenuItem value="" disabled>
                            Select Asset Type
                          </MenuItem>
                          <MenuItem value="None">
                            None
                          </MenuItem>
                          {assetTypeOptions.map((option) => (
                            <MenuItem key={option.id} value={option.name}>
                              {option.display_name}
                            </MenuItem>
                          ))}
                        </Select>
                          <Tooltip title="Save">
                            <IconButton
                              color="primary"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSaveClick(index, assetType.productCode);
                              }}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton
                              color="secondary"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCancelClick(event);
                              }}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        assetType.assetType === 'None' || assetType.assetType === 'Inconsistent'
                          ? assetType.assetType
                          : assetTypeOptions.find(option => option.name === assetType.assetType)?.display_name
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredAssetTypes.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </Box>
      </Box>
    </Container>
  );
};

export default AssetMapping;
