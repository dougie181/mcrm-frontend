import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Container } from "@mui/material";
import axiosInstance from "../../services/axiosInstance";
import useSnackbar from "../../hooks/useSnackbar";
import CampaignEmailTaskForm from "./CampaignEmailTaskForm";

const CampaignEmailTask = () => {
  const [loading, setLoading] = useState(true);
  const [emailData, setEmailData] = useState({
    task_id: "",
    client_id: "",
    campaign_id: "",
    firstname: "",
    preferredFirstName: "",
    surname: "",
    to: "",
    cc: "",
    sendtoBCC: true,
    subject: "",
    content: "",
  });

  const { snackbar, showError, showWarning, showSuccess, handleCloseSnackbar } =
    useSnackbar();
  //const { state: { task } } = useLocation();
  // Memoizing the task data from location state
  const location = useLocation();
  const task = useMemo(() => location.state.task, [location.state.task]);

  useEffect(() => {
    const fetchClientData = async (clientID) => {
      //console.log("fetchClientData called")
      try {
        const response = await axiosInstance.get(`/clients/${clientID}`);
        if (response.status === 200 || response.status === 201) {
          return response.data;
        }
        showError("Error retrieving client data.");
      } catch (error) {
        showError("Failed to fetch client data.");
        throw error;
      }
    };

    const fetchCampaignName = async (campaignID) => {
      //console.log("fetchCampaignName called")
      try {
        const response = await axiosInstance.get(`/campaigns/${campaignID}`);
        if (response.status === 200 || response.status === 201) {
          return response.data.name;
        }
        showError("Error retrieving campaign data.");
      } catch (error) {
        showError("Failed to fetch campaign data.");
        throw error;
      }
    };

    const updateFormFields = async () => {
      if (!task || task.data === null) {
        setLoading(false);
        return;
      }

      setLoading(true);

      let newData = {
        task_id: task.id,
        client_id: task.client_id,
        campaign_id: task.campaign_id,
        followup_count: task.data.followup_count,
        firstname: "",
        preferredFirstName: "",
        surname: "",
        to: "",
        cc: "",
        sendtoBCC: true,
        subject: "",
        content: "",
      };

      try {
        if (task && task.client_id) {
          
            const clientDataResponse = await fetchClientData(task.client_id);
            if (clientDataResponse) {
              newData = {
                ...newData,
                firstname: clientDataResponse.firstname,
                surname: clientDataResponse.surname,
                to: clientDataResponse.email,
                cc: clientDataResponse.ccEmail,
                preferredFirstName: clientDataResponse.preferredFirstName,
                content: "Dear " + clientDataResponse.preferredFirstName+",",
              };
            }

          const emailSubjectPrefix = task.data.campaign_id
            ? await fetchCampaignName(task.data.campaign_id)
            : task.title;
          newData.subject = `RE: ${emailSubjectPrefix}`;

        }
      } catch (error) {
        // Handle any errors that occur during the fetch
      } finally {
          setEmailData(newData);
      }
    };

    updateFormFields().finally(() => {
      setLoading(false);
    });
  }, [task, showError]);

  return (
    <Container maxWidth="md">
      <CampaignEmailTaskForm
        emailData={emailData}
        setEmailData={setEmailData}
        snackbar={snackbar}
        handleCloseSnackbar={handleCloseSnackbar}
        showError={showError}
        showSuccess={showSuccess}
        showWarning={showWarning}
        loading={loading}
      />
    </Container>
  );
};

export default CampaignEmailTask;
