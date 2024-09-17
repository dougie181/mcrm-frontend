import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TableContainer,
  Paper,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  FormControlLabel,
  Checkbox,
  TextField,
} from "@mui/material";
import { useSnackbar } from "../../context/SnackbarContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import SearchBar from "./SearchBar";
import CampaignGroup from "./CampaignGroup";
import CircularProgress from "@mui/material/CircularProgress";


const DIALOG_MESSAGES = {
  RISK_PROFILE_INCOMPLETE: {
    title: "Warning: Risk Profile not completed",
    message: "The Risk profile is incomplete. Please check your risk profile and update accordingly.",
    link: "/asset-maintenance/allocation",
  },
  ASSET_TYPES_NOT_ALLOCATED: {
    title: "Warning: Asset Types not allocated",
    message: "There are products that do not have an asset type associated. Please check that all products have been correctly assigned an asset type.",
    link: "/asset-maintenance/mapping",
  },
  CLIENT_RISK_PROFILES_INVALID: {
    title: "Warning: Clients Risk Profiles not accurate",
    message: "There are clients that either have an invalid risk profile or do not have one associated at all. Please check that all clients have an valid risk profile assigned.",
    link: "/clients",
  }
};


const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({
    draftAndReady: false,
    lastMonth: false,
    lastThreeMonths: true,
    older: true,
    completedToday: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [dialogInfo, setDialogInfo] = useState({});
  const [performValidation, setPerformValidation] = useState(true);
  const [newCampaignDescription, setNewCampaignDescription] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");

  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const fetchCampaigns = async () => {
    try {
      const response = await axiosInstance.get("/campaigns/");

      // Sort campaigns
      response.data.sort((a, b) => {
        // Handle sorting for completed campaigns by start_date (most recent first)
        if (a.status === "completed" && b.status === "completed") {
          return new Date(b.start_date || b.created_date) - new Date(a.start_date || a.created_date);
        }

        // Sort non-completed campaigns by created_date (most recent first)
        return new Date(b.created_date) - new Date(a.created_date);
      });

      setCampaigns(response.data);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      const errorDetails = error.response?.data?.error || "Please try again later.";
      showSnackbar("Failed to load campaigns. "+errorDetails, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchValidationRule = async () => {
    const keys = ["campaign_data_validation"]

    try {
      const response = await axiosInstance.post("/settings/get-settings", { keys } );
      setPerformValidation(+response.data.campaign_data_validation.value);
    } catch (error) {
      console.error("Failed to fetch validation setting:", error);
      setPerformValidation(false);
      showSnackbar("Failed to read validation setting. Have turned off data validation checking for now.", "error");
    }
  };

  useEffect(() => {
    fetchValidationRule();
    fetchCampaigns();
  }, []);

  const checkApiResponses = async () => {
    const checks = [
      { endpoint: "/risk_profile/completed", dialogInfo: DIALOG_MESSAGES.RISK_PROFILE_INCOMPLETE },
      { endpoint: "/products/assetTypesAllocated", dialogInfo: DIALOG_MESSAGES.ASSET_TYPES_NOT_ALLOCATED },
      { endpoint: "/clients/validate_risk_profiles", dialogInfo: DIALOG_MESSAGES.CLIENT_RISK_PROFILES_INVALID },
    ];
  
    for (let check of checks) {
      try {
        const response = await axiosInstance.get(check.endpoint);
        if (!response.data) {
          setDialogInfo(check.dialogInfo);
          setOpenErrorDialog(true);
          return false;
        }
      } catch (error) {
        setDialogInfo(DIALOG_MESSAGES.ERROR_UNABLE_TO_COMPLETE);
        setOpenErrorDialog(true);
        return false;
      }
    }
    return true;
  };
  

  const handleNewCampaign = async () => { 
    const canProceed = await checkApiResponses();
    if (canProceed || !performValidation) {
      navigate("/campaign/new");
    }
  };

  const handleEdit = async (id, currentStep) => {
    
    const canProceed = await checkApiResponses();
    if (canProceed || !performValidation) {
      navigate(`/campaign/${id}`, { currentStep });
    }
  };

  const toggleGroup = (group) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const groupCampaigns = (campaigns) => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);

    const grouped = {
      draftAndReady: [],

      completedToday: [],
      lastMonth: [],
      lastThreeMonths: [],
      older: [],
    };

    campaigns.forEach((campaign) => {
      const createdDate = new Date(campaign.created_date);
  
      if (campaign.status === "draft" || campaign.status === "ready") {
        grouped.draftAndReady.push(campaign);
      } else if (createdDate.toDateString() === now.toDateString()) {
        grouped.completedToday.push(campaign);
      } else if (createdDate >= oneMonthAgo) {
        grouped.lastMonth.push(campaign);
      } else if (createdDate >= threeMonthsAgo && createdDate < oneMonthAgo) {
        grouped.lastThreeMonths.push(campaign);
      } else {
        grouped.older.push(campaign);
      }
    });
  
    return grouped;
  };

  const groupedCampaigns = groupCampaigns(
    campaigns
      .filter((campaign) =>
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((campaign) => (showFavorites ? campaign.favourite : true))
  );

  const handleViewStats = (id) => {
    //navigate("/reports?campaignId=" + id);
    navigate("/campaign-tasks?campaignId="+id)
  };

  const handleCampaignReport = () => {
    navigate("/reports");
  };

  const handleDuplicateCampaignInitiate = (id) => {
    setDuplicateCandidate(id);
    setOpenDuplicateDialog(true);
  };

  const handleSaveCampaign = async (campaignId, editValues) => {
    try {
      console.log("saving campaign with id:", campaignId);
      console.log("editValues:", editValues);

      await axiosInstance.put(`/campaigns/${campaignId}`, editValues);
      fetchCampaigns();
    } catch (error) {
      console.error("Failed to save campaign:", error);
      const errorDetails = error.response?.data?.error || "Please try again later.";
      showSnackbar("Failed to save campaign. " + errorDetails, "error");
    }
  };

  const handleDuplicateCampaignConfirm = async () => {
    if (duplicateCandidate !== null) {
      try {
        const response = await axiosInstance.post(
          `/campaigns/${duplicateCandidate}/duplicate`,
          {
            include_attachments: includeAttachments,
            new_name: newCampaignName,
            new_description: newCampaignDescription,
          }
        );
        if (response.status === 200 || response.status === 201) {
          showSnackbar("Campaign duplicated successfully", "success");
        } else {
          const errorMessage =
            response.data.error || "Failed to duplicate campaign";
          throw new Error(errorMessage);
        }
        fetchCampaigns();
      } catch (error) {
        console.error("Failed to duplicate campaign:", error);
        const errorDetails = error.response?.data?.error || "Please try again later.";
        let errorMessage = "Failed to duplicate campaign. " + errorDetails;
        showSnackbar(errorMessage, "error");
      }
    }
    setOpenDuplicateDialog(false);
    setDuplicateCandidate(null);
    setNewCampaignName(""); // Reset the name and description
    setNewCampaignDescription("");
  };

  const initiateDelete = (id) => {
    setDeleteCandidate(id);
    setOpenDialog(true);
  };

  const confirmDelete = async () => {
    if (deleteCandidate !== null) {
      try {
        await axiosInstance.delete(`/campaigns/${deleteCandidate}`);
        fetchCampaigns();
      } catch (error) {
        console.error("Failed to delete campaign:", error);
        const errorDetails = error.response?.data?.error || "Please try again later.";
        showSnackbar("Failed to delete campaign. "+errorDetails, "error");
      }
    }
    setOpenDialog(false);
    setDeleteCandidate(null);
  };

  const toggleFavourite = async (id) => {
    try {
      await axiosInstance.patch(`/campaigns/${id}/toggle-favourite`);
      fetchCampaigns();
    } catch (error) {
      console.error("Failed to toggle favourite:", error);
      const errorDetails = error.response?.data?.error || "Please try again later.";
      showSnackbar("Failed to toggle favourite. "+errorDetails, "error");
    }
  };

  if (isLoading) {
    return <CircularProgress />
  }

  return (
    <Container maxWidth="lg">
      <Box p={2}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          marginBottom={2}
        >
          <Typography variant="h4">Campaigns</Typography>
          <Box>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleCampaignReport}
              style={{ marginRight: "8px" }}
            >
              Campaign Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNewCampaign}
            >
              Create New Campaign
            </Button>
          </Box>
        </Box>
        {campaigns.length > 0 && (
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showFavorites={showFavorites}
            setShowFavorites={setShowFavorites}
          />
        )}
        {Object.entries(groupedCampaigns).map(
          ([groupName, group]) =>
            group.length > 0 && (
              <TableContainer
                key={`group-container-${groupName}`}
                component={Paper}
              >
                <CampaignGroup
                  group={group}
                  groupName={groupName}
                  collapsedGroups={collapsedGroups}
                  toggleGroup={toggleGroup}
                  handleEdit={handleEdit}
                  handleViewStats={handleViewStats}
                  handleDuplicateCampaignInitiate={handleDuplicateCampaignInitiate}
                  initiateDelete={initiateDelete}
                  toggleFavourite={toggleFavourite}
                  handleSaveCampaign={handleSaveCampaign}
                />
              </TableContainer>
            )
        )}
        <Dialog
          open={openDuplicateDialog}
          onClose={() => setOpenDuplicateDialog(false)}
          aria-labelledby="duplicate-dialog-title"
          aria-describedby="duplicate-dialog-description"
        >
          <DialogTitle id="duplicate-dialog-title">
            Duplicate Campaign
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please provide a new name and description for the duplicated campaign.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Campaign Name"
              type="text"
              fullWidth
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Campaign Description"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={newCampaignDescription}
              onChange={(e) => setNewCampaignDescription(e.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeAttachments}
                  onChange={(e) => setIncludeAttachments(e.target.checked)}
                />
              }
              label="Include Attachments"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateCampaignConfirm}
              color="primary"
              autoFocus
              disabled={!newCampaignName}
            >
              Duplicate
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete this campaign? This action cannot
              be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={() => confirmDelete()} color="secondary" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={openErrorDialog}
          onClose={() => setOpenErrorDialog(false)}
          aria-labelledby="error-dialog-title"
          aria-describedby="error-dialog-description"
        >
          <DialogTitle id="error-dialog-title">{dialogInfo.title}</DialogTitle>
          <DialogContent>
            <DialogContentText id="error-dialog-description">
              {dialogInfo.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            {dialogInfo.link && (
              <Button
                onClick={() => {
                  navigate(dialogInfo.link);
                  setOpenErrorDialog(false);
                }}
                color="primary"
              >
                Go to Maintenance
              </Button>
            )}
            <Button onClick={() => setOpenErrorDialog(false)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Campaigns;
