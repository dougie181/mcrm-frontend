import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Container,
  LinearProgress,
  Grid,
  Snackbar,
  Alert,
  Modal,
  Backdrop,
  Fade,
} from "@mui/material";
import CampaignWizardNavigation from "./Navigation/CampaignWizardNavigation";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import axios from "axios";

const EmailProcessing = ({ stepsData, setCurrentStep, id, stepNumber }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [job, setJob] = useState(null);
  const [jobRecordExists, setJobRecordExists] = useState(false);
  const [autoSend, setAutoSend] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const fetchAutoSendFlag = async () => {
      const keys = ["auto_send"];

      try {
        const response = await axiosInstance.post("/settings/get-settings", {
          keys,
        });
        setAutoSend(+response.data.auto_send.value);
      } catch (error) {
        console.error("Error fetching settings:", error);
        setError("Error fetching settings: ", error);
      }
    };
    fetchAutoSendFlag();
  }, []);

  const intervalId = useRef(null);

  const fetchJobStatus = useCallback(() => {
    axiosInstance
      .get(`jobs/campaign/${id}`)
      .then((response) => {
        setJob(response.data);
        setLoading(false);
        setJobRecordExists(true);
        if (response.data.status === "completed") {
          clearInterval(intervalId.current);
          setOpenModal(true); // Open modal when job is completed
        } else if (response.data.status === "error") {
          setError(response.data.error_details);
          clearInterval(intervalId.current);
        } else if (response.data.status === "stopped") {
          clearInterval(intervalId.current);
          setError("Background process was stopped");
        } else {
          setError(null);
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          setJobRecordExists(false);
        } else {
          console.error(error);
          setError(error.message);
          clearInterval(intervalId.current);
        }
      });
  }, [id, intervalId]);

  const startMergeProcess = async () => {
    setLoading(true);
    setError(null);
    axiosInstance
      .post(`/jobs/campaign/${id}/start`, { auto_send: autoSend })
      .then((response) => {
        if (response.data.status === "error") {
          setError(response.data.error_details);
        } else {
          fetchJobStatus();
        }
      })
      .catch((error) => {
        console.error(error);
        if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
          navigate("/network_error");
        } else {
          setError(error.message);
        }
      });
  };

  const pauseResumeProcess = async () => {
    // call your Flask API to pause/resume the process
  };

  const cancelProcess = async () => {
    setLoading(false);
    setError(null);
    axiosInstance
      .delete(`/jobs/campaign/${id}/cancel`)
      .then((response) => {
        if (response.data.status === "error") {
          setError(response.data.error_details);
        } else {
          fetchJobStatus();
        }
      })
      .catch((error) => {
        console.error(error);
        setError(error.message);
      });
  };

  const restartProcess = async () => {
    setLoading(true);
    setError(null);
    axiosInstance
      .post(`/jobs/campaign/${id}/restart`)
      .then((response) => {
        if (response.data.status === "error") {
          setError(response.data.error_details);
        } else {
          fetchJobStatus();
        }
      })
      .catch((error) => {
        console.error(error);
        if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
          setError(
            "Network Error: The backend API has stopped unexpectedly, please restart the application and press restart again. If the problem persists, please contact support."
          );
        } else {
          setError(error.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobStatus();
    return () => clearInterval(intervalId.current);
  }, [fetchJobStatus]);

  useEffect(() => {
    if (!error && jobRecordExists) {
      intervalId.current = setInterval(fetchJobStatus, 500);
    }
    return () => clearInterval(intervalId.current);
  }, [fetchJobStatus, error, jobRecordExists]);

  const saveCampaign = useCallback(async () => {

    // retrieve the date of the last email sent
    const fetchLastEmailSentDate = async () => {
      try {
        const response = await axiosInstance.get(`/email_records/campaign/${id}/last_date`)
        return response.data.last_date;
      } catch (error) {
        console.error("Error fetching last email sent date:", error);
        setWarning(error.message);
        setOpenSnackbar(true);
      }
    };
    
    const lastEmailSentDate = await fetchLastEmailSentDate();

    const campaignData = {
      status: "completed",
      start_date: lastEmailSentDate || new Date().toISOString(),
      step: stepNumber + 1,
    };

    try {
      await axiosInstance.put(`/campaigns/${id}`, campaignData);
    } catch (error) {
      console.error(error);
      setWarning(error.message);
      setOpenSnackbar(true);
    }
  }, [id, stepNumber]);

  const handleBack = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleNext = async () => {
    if (job && job.status === "completed") {
      try {
        await saveCampaign();
        setCurrentStep((prevStep) => prevStep + 1);
      } catch (error) {
        console.error("Failed to save campaign:", error);
        setWarning(error.message);
        setOpenSnackbar(true);
      }
    } else {
      const errorMessage =
        "Cannot proceed until the email merge process is completed.";
      console.error(errorMessage);
      setWarning(errorMessage);
      setOpenSnackbar(true);
    }
  };

  const handleCancel = () => {
    navigate("/campaigns");
  };

  const handleStepButtonClick = (step) => {
    setCurrentStep(step);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      setOpenSnackbar(false);
      setWarning(null);
      return;
    }
    setOpenSnackbar(false);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    handleNext();
  };

  return (
    <Container maxWidth="lg">
      <Box textAlign="center" my={4}>
        <CampaignWizardNavigation
          stepsData={stepsData}
          stepNumber={stepNumber}
          onClickCancel={handleCancel}
          onClickBack={handleBack}
          onClickNext={handleNext}
          onStepClick={handleStepButtonClick}
        />
        <Box mt={4}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Process Control" />
                <CardContent>
                  {loading ? (
                    <Box my={2}>
                      <Button
                        variant="outlined"
                        onClick={pauseResumeProcess}
                        disabled={!!error || !(job && job.paused)}
                      >
                        {job && job.paused ? "Resume" : "Pause"}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={cancelProcess}
                        disabled={!error}
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={startMergeProcess}
                        disabled={!!error || jobRecordExists}
                      >
                        Start Merge Process
                      </Button>
                      {jobRecordExists && error && (
                        <Button
                          variant="outlined"
                          onClick={restartProcess}
                          disabled={!error}
                        >
                          Restart
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Process Status" />
                <CardContent>
                  <Typography variant="subtitle1">
                    {job ? `Current stage: ${job.status}` : "No job running."}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      job ? (job.processed_count / job.total_count) * 100 : 0
                    }
                  />
                  <Typography variant="body1">{job && job.status}</Typography>
                </CardContent>
              </Card>
            </Grid>
            {job && job.status === "completed" && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardHeader title="Process Summary" />
                  <CardContent>
                    <Typography variant="subtitle1">
                      Total emails processed: {job.processed_count}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Box>
      </Box>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="warning"
          sx={{ width: "100%" }}
        >
          {warning}
        </Alert>
      </Snackbar>
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={openModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              outline: "none",
              textAlign: "center", // Center the text
            }}
          >
            <Typography variant="h6" component="h2">
              Campaign Processed
            </Typography>
            <Typography sx={{ mt: 2 }}>
              The campaign has processed a total of 
            </Typography>
            <Typography sx={{ mt: 2 }}>
              {job?.processed_count} emails.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleCloseModal}
              sx={{ mt: 2 }}
            >
              Continue
            </Button>
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
};

export default EmailProcessing;
