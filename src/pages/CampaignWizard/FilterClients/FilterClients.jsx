import React, { useState, useEffect } from "react";
import CampaignWizardNavigation from "../Navigation/CampaignWizardNavigation";
import ClientsTable from "./ClientsTable";
import {
  Box,
  Container,
  Typography,
  Snackbar,
  Drawer,
  IconButton,
} from "@mui/material";
import axiosInstance from "../../../services/axiosInstance";
import CloseIcon from "@mui/icons-material/Close";
import FilterPanel from "./FilterPanel";

const FilterClients = ({
  stepsData,
  setCurrentStep,
  id,
  setId,
  stepNumber,
}) => {
  const [newFilter, setNewFilter] = useState({
    type: "",
    params: { column: "", operator: "", value: "" },
  });
  const [filteredClientsPerRule, setFilteredClientsPerRule] = useState([]);
  const [filters, setFilters] = useState([]);
  const [clients, setClients] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showFilterPane, setShowFilterPane] = useState(false);

  useEffect(() => {
    const fetchListOfFilteredClients = async () => {
      try {
        const response = await axiosInstance.post(
          `queries/campaign/clientList/${id}`,
          {
            filters: { filters: filters ? filters : [] },
          }
        );
        setFilteredClientsPerRule(response.data);
        console.log("List of filtered clients per rule:", response.data);
      } catch (error) {
        console.error("Error fetching list of filtered clients:", error);
      }
    };

    fetchListOfFilteredClients();
  }, [filters]);

  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const response = await axiosInstance.post(`/queries/campaign/${id}`, {
          applyFilters: false,
        });
        setClients(response.data);

        if (response.data.length > 0) {
          setColumns(Object.keys(response.data[0]));
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoadingClients(false);
      }
    };

    const fetchCampaignData = async () => {
      if (id) {
        try {
          const campaignResponse = await axiosInstance.get(`/campaigns/${id}`);
          const campaignData = campaignResponse.data;

          if (filters.length === 0 && campaignData.filter_exclusions?.filters) {
            setFilters(campaignData.filter_exclusions.filters);
          } else if (filters.length === 0) {
            setFilters([]);
          }
        } catch (error) {
          console.error("Error fetching campaign data:", error);
        }
      }
    };

    fetchCampaignData().then(fetchClients);
  }, [id]);

  const toggleShowFilterPane = () => setShowFilterPane((prev) => !prev);

  const handleApplyManualInclusions = () => {
    console.log("handleApplyManualInclusions for clients:", selectedClients);
    setFilters((prevFilters) => {
      const clientsToInclude = selectedClients;

      const manualInclusionFilterIndex = prevFilters.findIndex(
        (filter) => filter.type === "manual_inclusions"
      );

      const updatedFilters = [...prevFilters];

      const clientsStillExcluded = clientsToInclude.filter((clientId) =>
        Object.entries(filteredClientsPerRule).some(([ruleType, clientIds]) => {
          if (ruleType === "manual_exclusions") return false;
          return clientIds.includes(clientId);
        })
      );

      if (clientsStillExcluded.length > 0) {
        if (manualInclusionFilterIndex !== -1) {
          const existingFilter = updatedFilters[manualInclusionFilterIndex];
          const updatedClientIds = [
            ...new Set([
              ...existingFilter.params.client_ids,
              ...clientsStillExcluded,
            ]),
          ];

          updatedFilters[manualInclusionFilterIndex] = {
            ...existingFilter,
            params: { ...existingFilter.params, client_ids: updatedClientIds },
          };
        } else {
          updatedFilters.push({
            type: "manual_inclusions",
            params: { client_ids: clientsStillExcluded },
            order: prevFilters.length + 1,
          });
        }
      } else if (manualInclusionFilterIndex !== -1) {
        const existingFilter = updatedFilters[manualInclusionFilterIndex];
        const updatedClientIds = existingFilter.params.client_ids.filter(
          (id) => !clientsToInclude.includes(id)
        );

        if (updatedClientIds.length > 0) {
          updatedFilters[manualInclusionFilterIndex] = {
            ...existingFilter,
            params: { ...existingFilter.params, client_ids: updatedClientIds },
          };
        } else {
          updatedFilters.splice(manualInclusionFilterIndex, 1);
        }
      }

      const updatedFiltersWithRemovals = updatedFilters.map((filter) => {
        if (filter.type === "manual_exclusions") {
          const updatedExclusionClientIds = filter.params.client_ids.filter(
            (id) => !clientsToInclude.includes(id)
          );

          return {
            ...filter,
            params: { ...filter.params, client_ids: updatedExclusionClientIds },
          };
        }

        return filter;
      });

      // Remove any filters with empty client IDs
      return updatedFiltersWithRemovals.filter(
        (filter) =>
          !(filter.params.client_ids && filter.params.client_ids.length === 0)
      );
    });

    setSelectedClients([]);
    setShowSnackbar(true);
  };

  const handleApplyManualExclusions = () => {
    console.log("handleApplyManualExclusions for clients:", selectedClients);

    setFilters((prevFilters) => {
      const manualExclusionFilterIndex = prevFilters.findIndex(
        (filter) => filter.type === "manual_exclusions"
      );

      const manualInclusionFilterIndex = prevFilters.findIndex(
        (filter) => filter.type === "manual_inclusions"
      );

      const updatedFilters = [...prevFilters];

      // Remove clients from manual_inclusions if they're being manually excluded
      if (manualInclusionFilterIndex !== -1) {
        const existingInclusionFilter =
          updatedFilters[manualInclusionFilterIndex];
        const updatedInclusionClientIds =
          existingInclusionFilter.params.client_ids.filter(
            (id) => !selectedClients.includes(id)
          );

        if (updatedInclusionClientIds.length > 0) {
          updatedFilters[manualInclusionFilterIndex] = {
            ...existingInclusionFilter,
            params: {
              ...existingInclusionFilter.params,
              client_ids: updatedInclusionClientIds,
            },
          };
        } else {
          updatedFilters.splice(manualInclusionFilterIndex, 1); // Remove the manual_inclusions filter if no clients remain
        }
      }

      // Add to manual_exclusions or update it
      if (manualExclusionFilterIndex !== -1) {
        const existingExclusionFilter =
          updatedFilters[manualExclusionFilterIndex];
        const updatedClientIds = [
          ...new Set([
            ...existingExclusionFilter.params.client_ids,
            ...selectedClients,
          ]),
        ];

        updatedFilters[manualExclusionFilterIndex] = {
          ...existingExclusionFilter,
          params: {
            ...existingExclusionFilter.params,
            client_ids: updatedClientIds,
          },
        };
      } else {
        updatedFilters.push({
          type: "manual_exclusions",
          params: { client_ids: selectedClients },
          order: prevFilters.length + 1,
        });
      }

      // Remove any filters with empty client IDs
      return updatedFilters.filter(
        (filter) =>
          !(filter.params.client_ids && filter.params.client_ids.length === 0)
      );
    });

    setSelectedClients([]);
    setShowSnackbar(true);
  };

  const handleAddFilter = () => {
    setFilters((prevFilters) => {
      // Find if there's already an exclude_previous_campaigns filter
      const existingCampaignFilterIndex = prevFilters.findIndex(
        (filter) => filter.type === "exclude_previous_campaigns"
      );
  
      const updatedFilters = [...prevFilters];
  
      if (newFilter.type === "exclude_previous_campaigns") {
        if (existingCampaignFilterIndex !== -1) {
          // Merge with existing exclude_previous_campaigns filter
          const existingFilter = updatedFilters[existingCampaignFilterIndex];
          const newCampaignIds = newFilter.params.campaign_ids || [];
          const mergedCampaignIds = [
            ...new Set([...existingFilter.params.campaign_ids, ...newCampaignIds]),
          ];
  
          updatedFilters[existingCampaignFilterIndex] = {
            ...existingFilter,
            params: { ...existingFilter.params, campaign_ids: mergedCampaignIds },
          };
        } else {
          // Add as new filter
          updatedFilters.push({ ...newFilter, order: prevFilters.length + 1 });
        }
      } else {
        // For other filter types, simply add the new filter
        updatedFilters.push({ ...newFilter, order: prevFilters.length + 1 });
      }
  
      return updatedFilters;
    });
  
    // Reset newFilter state
    setNewFilter({
      type: "",
      params: { column: "", operator: "", value: "" },
    });
  };

  const handleRemoveFilter = (index) => {
    setFilters((prevFilters) => prevFilters.filter((_, i) => i !== index));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const paramName = name.split(".")[1] || name;
    setNewFilter((prev) => ({
      ...prev,
      [name.includes("params.") ? "params" : "type"]: name.includes("params.")
        ? { ...prev.params, [paramName]: value }
        : value,
    }));
  };

  const handleNext = async () => {
    try {
      await saveCampaign();
      setCurrentStep((prevStep) => prevStep + 1);
    } catch (error) {
      console.error("Error saving campaign:", error);
    }
  };

  const handleStepButtonClick = (step) => {
    //console.log("click", step);
    setCurrentStep(step);
  };

  const handleBack = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const saveCampaign = async () => {
    const campaignData = {
      step: stepNumber + 1,
      filter_exclusions: { filters : filters },
    };

    if (id) {
      try {
        await axiosInstance.put(`/campaigns/${id}`, campaignData);
        setFilters([]);
      } catch (error) {
        console.error("Error saving campaign data:", error);
      }
    } else {
      console.error("Error: no campaign ID");
    }
  };

  const closeSnackbar = () => setShowSnackbar(false);

  return (
    <Container maxWidth="lg">
      <Box textAlign="center" my={4}>
        <CampaignWizardNavigation
          stepsData={stepsData}
          stepNumber={stepNumber}
          onClickBack={handleBack}
          onClickNext={handleNext}
          onStepClick={handleStepButtonClick}
        />
        {/* Drawer for filter controls and current filters */}
        <Drawer
          anchor="left"
          open={showFilterPane}
          onClose={toggleShowFilterPane}
        >
          <Box width={700} p={2} position="relative">
            <IconButton
              onClick={toggleShowFilterPane}
              sx={{ position: "absolute", top: 8, right: 8 }}
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" gutterBottom>
              Filter Controls
            </Typography>
            <FilterPanel
              newFilter={newFilter}
              handleFilterChange={handleFilterChange}
              columns={columns}
              handleAddFilter={handleAddFilter}
              filters={filters}
              handleRemoveFilter={handleRemoveFilter}
            />
          </Box>
        </Drawer>

        {loadingClients && <Typography>Loading clients...</Typography>}
        {!loadingClients && (
          <>
            {/* Clients Table */}
            <ClientsTable
              clients={clients}
              columns={columns}
              selectedClients={selectedClients}
              setSelectedClients={setSelectedClients}
              handleApplyManualExclusions={handleApplyManualExclusions}
              handleApplyManualInclusions={handleApplyManualInclusions}
              page={page}
              rowsPerPage={rowsPerPage}
              setPage={setPage}
              setRowsPerPage={setRowsPerPage}
              isSelected={(clientId) => selectedClients.includes(clientId)}
              filters={filters}
              filteredClientsPerRule={filteredClientsPerRule}
              setFilterOpen={toggleShowFilterPane}
            />
          </>
        )}

        {/* Snackbar for feedback */}
        <Snackbar
          open={showSnackbar}
          autoHideDuration={3000}
          onClose={closeSnackbar}
          message="Filter applied successfully"
        />
      </Box>
    </Container>
  );
};

export default FilterClients;
