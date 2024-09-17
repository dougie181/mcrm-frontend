import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Container,
  FormControlLabel,
} from "@mui/material";
import axiosInstance from "../../services/axiosInstance";
import Autocomplete from "@mui/material/Autocomplete";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/en-au";
import AttachmentsTable from "./AttachmentsTable";
import EmailRecords from "./EmailRecords";
import Notes from "./Notes";
import TaskForm from "../TaskView/TaskForm";
import GreenSwitch from "../../components/Controls/GreenSwitch"; // Import the GreenSwitch component

const ClientDetails = () => {
  const [client, setClient] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [riskProfiles, setRiskProfiles] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);

  const { id } = useParams();
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1); // Navigate back to the previous page
  };

  // Function to toggle the TaskForm visibility
  const handleCreateTaskClick = () => {
    setShowTaskForm(!showTaskForm);
  };

  useEffect(() => {
    const fetchRiskProfileLookupValues = async () => {
      try {
        const response = await axiosInstance.get("/lookup_values/riskProfile");
        setRiskProfiles(
          response.data.sort((a, b) => a.display_order - b.display_order)
        );
      } catch (error) {
        console.error("Error fetching risk profile:", error);
      }
    };

    const fetchCustomerTypesLookupValues = async () => {
      try {
        const response = await axiosInstance.get(
          "/lookup_values/customer_type"
        );
        setCustomerTypes(response.data);
      } catch (error) {
        console.error("Error fetching customer types:", error);
      }
    };

    fetchRiskProfileLookupValues();
    fetchCustomerTypesLookupValues();
  }, []);

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const clientResponse = await axiosInstance.get(`/clients/${id}`);
        const updatedClient = {
          ...clientResponse.data,
          soaDate: dayjs(clientResponse.data.soaDate, "YYYY-MM-DD"),
        };
        setClient(updatedClient);
      } catch (error) {
        console.error("Error fetching client data:", error);
      }
    };

    fetchClientDetails();
  }, [id]);

  const handleEditButtonClick = () => {
    setEditMode(!editMode);
  };

  // Add a function to handle form field changes and update the client state
  const handleFieldChange = (e) => {
    const { name, value } = e.target || {};
    if (value !== undefined) {
      setClient({ ...client, [name]: value });
    }
  };

  // Function to handle form submission and save updates to the server
  const handleFormSubmit = async (e) => {};

  // Implement this function to save the updated client data to the server
  const handleSaveClick = async () => {
    try {
      const soaDateValue =
        client.soaDate &&
        dayjs.isDayjs(client.soaDate) &&
        client.soaDate.isValid()
          ? client.soaDate.format("YYYY-MM-DD")
          : "";
  
      const lastAdviceDateValue = client.lastAdviceDate
        ? dayjs(client.lastAdviceDate).format("YYYY-MM-DDTHH:mm:ss.SSSSSS")
        : "";
  
      const updatedClient = {
        ...client,
        soaDate: soaDateValue,
        lastAdviceDate: lastAdviceDateValue,
        email: client.email.toLowerCase(), // Convert email to lowercase on save
      };
  
      await axiosInstance.put(`/clients/${id}`, updatedClient);
      setClient({
        ...updatedClient,
        soaDate: dayjs(updatedClient.soaDate, "YYYY-MM-DD"),
        lastAdviceDate: dayjs(updatedClient.lastAdviceDate),
      });
      setEditMode(false);
    } catch (error) {
      console.error("Error updating client data:", error);
    }
  };  

  const handleSuccess = () => {
    setShowTaskForm(false);
  };

  const handleClose = () => {
    setShowTaskForm(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-au">
      <Container maxWidth="lg">
        <Box>
          {/* Title section with Back icon */}
          <Box
            display="flex"
            alignItems="center"
            marginBottom={0}
            marginTop={2}
          >
            <Button variant="outlined" onClick={handleBackClick}>
              Back
            </Button>
          </Box>
          <Card>
            {/* Client details section */}
            {client && (
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="flex-end"
                  paddingRight={2}
                  paddingTop={2}
                ></Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  paddingBottom={2}
                >
                  <Typography variant="h5" component="div">
                    Client Details
                  </Typography>
                  <Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCreateTaskClick}
                      sx={{ marginRight: 1 }}
                    >
                      Create Task
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={
                        editMode ? handleSaveClick : handleEditButtonClick
                      }
                    >
                      {editMode ? "Save" : "Edit"}
                    </Button>
                  </Box>
                </Box>
                <form onSubmit={handleFormSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="First Name"
                        name="contactPersonFirstName"
                        value={client.contactPersonFirstName}
                        onChange={handleFieldChange}
                        fullWidth
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Surname"
                        name="contactPersonSurname"
                        value={client.contactPersonSurname}
                        onChange={handleFieldChange}
                        fullWidth
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Preferred First Name"
                        name="preferredFirstName"
                        value={client.preferredFirstName || ""}
                        onChange={handleFieldChange}
                        fullWidth
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        name="email"
                        value={client.email}
                        onChange={handleFieldChange}
                        fullWidth
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        value={
                          riskProfiles.find(
                            (profile) => profile.name === client.riskProfile
                          ) || null
                        } // Default to "None" if no value
                        onChange={(event, newValue) => {
                          handleFieldChange({
                            target: {
                              name: "riskProfile",
                              value: newValue ? newValue.name : "",
                            },
                          });
                        }}
                        options={riskProfiles}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Risk Profile"
                            fullWidth
                          />
                        )}
                        disabled={!editMode}
                        getOptionLabel={(option) =>
                          option.display_name || "None"
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        value={
                          customerTypes.find(
                            (type) => type.name === client.customerType
                          ) || null
                        }
                        onChange={(event, newValue) => {
                          handleFieldChange({
                            target: {
                              name: "customerType",
                              value: newValue ? newValue.name : "",
                            },
                          });
                        }}
                        options={customerTypes}
                        getOptionLabel={(option) => option.display_name}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Customer Type"
                            fullWidth
                          />
                        )}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <DatePicker
                        label="Last SOA Date"
                        value={client.soaDate ? dayjs(client.soaDate) : null}
                        disabled={!editMode}
                        onChange={(newValue) => {
                          handleFieldChange({
                            target: { name: "soaDate", value: newValue },
                          });
                        }}
                        textField={<TextField fullWidth disabled={!editMode} />}
                        format="DD/MM/YYYY"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box display="flex" justifyContent="flex-end">
                        <DatePicker
                          label="Last Advice Date"
                          value={
                            client.lastAdviceDate
                              ? dayjs(client.lastAdviceDate)
                              : null
                          }
                          disabled={!editMode}
                          onChange={(newValue) => {
                            const formattedDate = newValue
                              ? newValue.format("YYYY-MM-DDTHH:mm:ss.SSS")
                              : "";
                            handleFieldChange({
                              target: {
                                name: "lastAdviceDate",
                                value: formattedDate,
                              },
                            });
                          }}
                          textField={<TextField fullWidth disabled={!editMode} />}
                          format="DD/MM/YYYY"
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="BCC ID"
                        name="bccID"
                        value={client.bccID || ""}
                        onChange={handleFieldChange}
                        fullWidth
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <GreenSwitch
                            name="active"
                            checked={client.active === 1}
                            onChange={(e) =>
                              handleFieldChange({
                                target: {
                                  name: "active",
                                  value: e.target.checked ? 1 : 0,
                                },
                              })
                            }
                            disabled={!editMode}
                          />
                        }
                        label={client.active === 1 ? "Active Client" : "Inactive Client"}
                      />
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            )}
            <Notes clientId={id} />
            <EmailRecords clientId={id} />
            <AttachmentsTable clientId={id} />
          </Card>
        </Box>
        {showTaskForm && (
          <TaskForm
            mode="create"
            taskData={{
              client_id: id,
              data: {
                account_id: client.accountID,
                hard_linked: true,
              },
            }}
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default ClientDetails;
