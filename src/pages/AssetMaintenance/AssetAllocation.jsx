import React, { useEffect, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import axiosInstance from "../../services/axiosInstance";
import useSnackbar from "../../hooks/useSnackbar";

const AssetAllocation = () => {
  const [riskProfiles, setRiskProfiles] = useState({ formattedResult: {}, sortedAssetTypes: [] });
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isValid, setIsValid] = useState(true);
  const { snackbar, showError, showSuccess, handleCloseSnackbar } = useSnackbar();

  useEffect(() => {
    checkIsValid();
  }, []);

  const checkIsValid = async () => {
    try {
      const response = await axiosInstance.get("/risk_profile/isvalid");
      setIsValid(response.data);
      if (response.data) {
        fetchRiskProfiles();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking risk profile validity:", error);
      showError("Failed to check risk profile validity. Please try again later.");
      setLoading(false);
    }
  };

  const fetchRiskProfiles = async () => {
    try {
      const response = await axiosInstance.get("/risk_profile/");
      const formattedData = formatData(response.data);
      setRiskProfiles(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching risk profiles:", error);
      showError("Failed to load risk profiles. Please try again later.");
      setLoading(false);
    }
  };

  const formatData = (data) => {
    const sortedData = data.sort((a, b) => a.order - b.order);
    const formattedResult = {};
    const assetTypesOrder = {};

    sortedData.forEach((item) => {
      if (!formattedResult[item.risk_profile]) {
        formattedResult[item.risk_profile] = { total: 0, entries: [] };
      }
      formattedResult[item.risk_profile].entries.push({
        id: item.id,
        order: item.order,
        asset_type: item.asset_type,
        percentage: item.percentage,
      });
      formattedResult[item.risk_profile].total += item.percentage;
      
      if (!assetTypesOrder[item.asset_type]) {
        assetTypesOrder[item.asset_type] = item.order % 100; // This is assuming each asset type order is < 100
      }
    });

    // Sort the entries within each risk profile
    Object.keys(formattedResult).forEach((riskProfile) => {
      formattedResult[riskProfile].entries.sort((a, b) => a.order - b.order);
    });

    // Sort asset types based on the order
    const sortedAssetTypes = Object.keys(assetTypesOrder).sort((a, b) => assetTypesOrder[a] - assetTypesOrder[b]);

    return { formattedResult, sortedAssetTypes };
  };

  const handleInputChange = (riskProfile, assetType, value) => {
    value = parseFloat(value) || 0;
    setRiskProfiles((prevProfiles) => {
      const prevFormattedResult = { ...prevProfiles.formattedResult };
      const prevEntries = prevFormattedResult[riskProfile].entries;
      const prevPercentage = prevEntries.find((entry) => entry.asset_type === assetType).percentage;
      const newTotal = prevFormattedResult[riskProfile].total - prevPercentage + value;

      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        [riskProfile]: false,
      }));

      setHasChanges(true);

      return {
        ...prevProfiles,
        formattedResult: {
          ...prevFormattedResult,
          [riskProfile]: {
            ...prevFormattedResult[riskProfile],
            total: newTotal,
            entries: prevEntries.map((entry) =>
              entry.asset_type === assetType
                ? { ...entry, percentage: value }
                : entry
            ),
          },
        },
      };
    });
  };

  const validateTotals = () => {
    const errors = {};
    Object.keys(riskProfiles.formattedResult).forEach((riskProfile) => {
      if (riskProfiles.formattedResult[riskProfile].total !== 100) {
        errors[riskProfile] = true;
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateTotals()) {
      showError("Some rows have totals that are not equal to 100%. Please fix them before saving.");
      return;
    }

    try {
      const updatedProfiles = [];
      const newProfiles = [];

      Object.keys(riskProfiles.formattedResult).forEach((riskProfile) => {
        riskProfiles.formattedResult[riskProfile].entries.forEach((entry) => {
          if (entry.id) {
            updatedProfiles.push({
              id: entry.id,
              risk_profile: riskProfile,
              asset_type: entry.asset_type,
              percentage: entry.percentage,
            });
          } else {
            newProfiles.push({
              risk_profile: riskProfile,
              asset_type: entry.asset_type,
              percentage: entry.percentage,
            });
          }
        });
      });

      // Update existing profiles
      await Promise.all(
        updatedProfiles.map(async (profile) => {
          try {
            await axiosInstance.put(`/risk_profile/`, profile);
          } catch (error) {
            console.error("Error updating profile:", profile, error.response ? error.response.data : error.message);
            throw error;
          }
        })
      );

      // Create new profiles
      await Promise.all(
        newProfiles.map(async (profile) => {
          try {
            await axiosInstance.post(`/risk_profile/`, profile);
          } catch (error) {
            console.error("Error creating profile:", profile, error.response ? error.response.data : error.message);
            throw error;
          }
        })
      );

      showSuccess("Risk profiles updated successfully!");
      setHasChanges(false);
      fetchRiskProfiles(); // Refresh the data
    } catch (error) {
      console.error("Error updating risk profiles:", error);
      showError("Failed to update risk profiles. Please try again.");
    }
  };

  const handleReset = async () => {
    try {
      await axiosInstance.post("/risk_profile/reset");
      showSuccess("Invalid risk profiles removed successfully!");
      fetchRiskProfiles();
      setIsValid(true);
    } catch (error) {
      console.error("Error resetting risk profiles:", error);
      showError("Failed to reset risk profiles. Please try again.");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box p={2} textAlign="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!isValid) {
    return (
      <Container maxWidth="lg">
        <Box p={2} textAlign="center">
          <Typography variant="h6" color="error">
            The risk profile table contains invalid entries.
          </Typography>
          <Button variant="contained" color="secondary" onClick={handleReset}>
            Reset Risk Profiles
          </Button>
        </Box>
      </Container>
    );
  }

  const { formattedResult, sortedAssetTypes } = riskProfiles;

  return (
    <Container maxWidth="lg">
      <Box p={2}>
        <Typography variant="h4">Asset Allocation</Typography>
        <TableContainer component={Paper} sx={{ marginTop: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Risk Profile</TableCell>
                {sortedAssetTypes.map((assetType) => (
                  <TableCell key={assetType}>{assetType}</TableCell>
                ))}
                <TableCell>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(formattedResult).map((riskProfile) => (
                <TableRow
                  key={riskProfile}
                  sx={{
                    backgroundColor: validationErrors[riskProfile]
                      ? "rgba(255, 0, 0, 0.1)"
                      : "inherit",
                  }}
                >
                  <TableCell>{riskProfile}</TableCell>
                  {sortedAssetTypes.map((assetType) => {
                    const entry = formattedResult[riskProfile].entries.find(
                      (entry) => entry.asset_type === assetType
                    );
                    return (
                      <TableCell key={assetType} sx={{ width: "100px" }}> {/* Set the width to the desired value */}
                        <TextField
                          type="number"
                          value={entry ? entry.percentage : 0}
                          onChange={(e) =>
                            handleInputChange(riskProfile, assetType, e.target.value)
                          }
                          fullWidth
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell
                    sx={{
                      fontWeight: formattedResult[riskProfile].total !== 100 ? "bold" : "normal",
                      color: formattedResult[riskProfile].total !== 100 ? "red" : "inherit",
                    }}
                  >
                    {formattedResult[riskProfile].total}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box textAlign="center" mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AssetAllocation;