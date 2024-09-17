import React, { useState, useEffect } from "react";
import {
  Grid,
  Container,
  Typography,
  FormControl,
  Switch,
  Select,
  MenuItem,
  Box,
  Button,
  TextField,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  AppBar,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import axiosInstance from "../../services/axiosInstance";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../../context/SnackbarContext";

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [originalSettings, setOriginalSettings] = useState([]);
  const [settingsModified, setSettingsModified] = useState(false);
  const [confirmSecretTextChange, setConfirmSecretTextChange] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const category = searchParams.get("category");
  const showBackButton = searchParams.has("showBackButton");
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        let url = "/settings";
        if (category) {
          url += `?category_key=${category}`;
        }
        const response = await axiosInstance.get(url);

        // sort the settings first by category_order and then by display_order
        response.data.sort((a, b) => {
          if (a.display_order < b.display_order) {
            return -1;
          }
          if (a.display_order > b.display_order) {
            return 1;
          }
          return 0;
        });

        response.data.sort((a, b) => {
          if (a.category_order < b.category_order) {
            return -1;
          }
          if (a.category_order > b.category_order) {
            return 1;
          }
          return 0;
        });

        const settingsData = response.data;

        // Initialize related_fields if they exist in the server response
        settingsData.forEach((setting) => {
          if (setting.options) {
            setting.options.forEach((option) => {
              if (option.related_fields) {
                setting.related_fields = setting.related_fields || {};
              }
            });
          }
        });

        setSettings(settingsData);
        setOriginalSettings(JSON.parse(JSON.stringify(settingsData))); // Deep copy
      } catch (error) {
        console.error(error);
      }
    };

    fetchSettings();
  }, [category]);

  const handleInputChange = (id, event, isRelatedField = false) => {
    // Deep copy
    const updatedSettings = [...JSON.parse(JSON.stringify(settings))];

    // Find the setting to update
    const settingToUpdate = updatedSettings.find(
      (setting) => setting.id === id
    );

    // Update the value
    if (settingToUpdate) {
      if (isRelatedField) {
        const fieldName = event.target.name;
        const relatedFieldToUpdate = settingToUpdate.options
          .find((option) => option.key === settingToUpdate.value)
          ?.related_fields.find((field) => field.name === fieldName);

        if (relatedFieldToUpdate) {
          // Check if the field is of type 'secret_text' and has a value
          if (
            relatedFieldToUpdate.type === "secret_text" &&
            relatedFieldToUpdate.value
          ) {
            // If the user has not confirmed the change, ask for confirmation
            if (!confirmSecretTextChange) {
              const proceed = window.confirm(
                "You are about to change a sensitive setting. Are you sure?"
              );
              if (!proceed) {
                return; // Exit the function if the user cancels
              } else {
                setConfirmSecretTextChange(true);
              }
            }
          }
          relatedFieldToUpdate.value = event.target.value;
        }
      } else {
        settingToUpdate.value = event.target.value;
      }
    }
    // Update the state
    setSettings(updatedSettings);
    setSettingsModified(true);
  };

  const handleBooleanChange = (id, event) => {
    // Deep copy
    const updatedSettings = [...JSON.parse(JSON.stringify(settings))];

    // Find the setting to update
    const settingToUpdate = updatedSettings.find(
      (setting) => setting.id === id
    );

    // Update the value
    if (settingToUpdate) {
      settingToUpdate.value = event.target.checked ? "1" : "0";
    }

    // Update the state
    setSettings(updatedSettings);
    setSettingsModified(true);
  };

  const saveSettings = async () => {
    try {
      const postData = settings.map((setting) => ({
        id: setting.id,
        name: setting.name,
        value: setting.value,
        options: setting.options || [],
        related_fields: setting.related_fields || {},
      }));
      const response = await axiosInstance.put("/settings/update", postData);
      if (response.status === 200 && response.data.success) {
        setOriginalSettings([...settings]);
        setSettingsModified(false);
        showSnackbar("Settings successfully saved!", "success");
      } else {
        showSnackbar("Failed to save settings. Please try again.", "error");
      }
    } catch (error) {
      console.error(error);
      showSnackbar("An error occurred. Please try again.", "error");
    }
  };

  const handleCancel = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings))); // Deep copy of original settings
    setSettingsModified(false);
  };

  const onHandleBackClick = () => {
    navigate(-1);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {});

  const allCategories = Object.keys(groupedSettings); // Get all categories from the grouped settings

  return (
    <Container maxWidth="lg">
      <Box
        marginTop={4}
        padding={3}
        border="1px solid #e0e0e0"
        borderRadius={4}
      >
        <Typography variant="h4">
          {showBackButton && (
            <Button variant="outlined" onClick={onHandleBackClick}>
              Back
            </Button>
          )}{" "}
          Application Settings
        </Typography>
        <Box marginTop={2}>
          <AppBar position="static" color="default" elevation={0}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              aria-label="settings tabs"
            >
              {allCategories.map((categoryName, index) => (
                <Tab label={categoryName} key={categoryName} />
              ))}
            </Tabs>
          </AppBar>
          <Box
            sx={{
              marginBottom: 4,
            }}
          >
            {allCategories.map((categoryName, index) => (
              <div
                key={categoryName}
                role="tabpanel"
                hidden={selectedTab !== index}
                id={`settings-tabpanel-${index}`}
                aria-labelledby={`settings-tab-${index}`}
              >
                {selectedTab === index && (
                  <form>
                    <Box
                      key={categoryName}
                      sx={{
                        marginBottom: 4,
                        padding: 2,
                        borderRadius: "8px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {groupedSettings[categoryName].map((setting, index) => (
                        <div key={`${categoryName}-${setting.name}`}>
                          <FormControl fullWidth margin="normal">
                            <Grid container spacing={3}>
                              <Grid item xs={5} container alignItems="center">
                                <Typography variant="body1">
                                  {setting.label}
                                </Typography>
                              </Grid>
                              <Grid item xs={7}>
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  width="100%"
                                >
                                  {setting.type === "dropdown" ? (
                                    <FormControl fullWidth>
                                      <Select
                                        id={`${setting.name}-input`}
                                        name={setting.name}
                                        value={setting.value}
                                        onChange={(e) =>
                                          handleInputChange(setting.id, e)
                                        }
                                        fullWidth
                                      >
                                        {setting.options.map((option) => (
                                          <MenuItem
                                            key={option.key}
                                            value={option.key}
                                          >
                                            {option.value}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  ) : setting.type === "toggle" ? (
                                    <FormControl fullWidth>
                                      <Switch
                                        id={`${setting.name}-input`}
                                        name={setting.name}
                                        checked={setting.value === "1"}
                                        onChange={(e) =>
                                          handleBooleanChange(setting.id, e)
                                        }
                                      />
                                    </FormControl>
                                  ) : (
                                    <TextField
                                      id={`${setting.name}-input`}
                                      name={setting.name}
                                      value={setting.value}
                                      onChange={(e) =>
                                        handleInputChange(setting.id, e)
                                      }
                                      type={setting.type}
                                      fullWidth
                                    />
                                  )}
                                  <Tooltip
                                    title={
                                      setting.info_text ||
                                      "No description available"
                                    }
                                  >
                                    <IconButton>
                                      <InfoIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Grid>
                            </Grid>
                          </FormControl>
                          {setting.type === "dropdown" &&
                            setting.options.map((option) => {
                              if (
                                option.key === setting.value &&
                                option.related_fields
                              ) {
                                return option.related_fields.map(
                                  (field, idx) => (
                                    <FormControl
                                      fullWidth
                                      margin="normal"
                                      key={idx}
                                    >
                                      <Grid container spacing={3}>
                                        <Grid
                                          item
                                          xs={5}
                                          container
                                          alignItems="center"
                                        >
                                          <Typography variant="body1">
                                            {field.label}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={7}>
                                          <Box
                                            display="flex"
                                            alignItems="center"
                                            width="100%"
                                          >
                                            {field.type === "date" ? (
                                              <TextField
                                                label={field.value ? field.label : ""}  // Only show the label if there's a value
                                                name={field.name}
                                                type={field.type}
                                                value={field.value || ""}
                                                onChange={(e) =>
                                                  handleInputChange(
                                                    setting.id,
                                                    e,
                                                    true
                                                  )
                                                }
                                                fullWidth
                                              />
                                            ) : (
                                              <TextField
                                                label={field.label}
                                                name={field.name}
                                                type={field.type}
                                                value={
                                                  field.value ? field.value : ""
                                                }
                                                onChange={(e) =>
                                                  handleInputChange(
                                                    setting.id,
                                                    e,
                                                    true
                                                  )
                                                }
                                                fullWidth
                                              />
                                            )}
                                            <Tooltip
                                              title={
                                                field.info_text ||
                                                "No description available"
                                              }
                                            >
                                              <IconButton>
                                                <InfoIcon />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        </Grid>
                                      </Grid>
                                    </FormControl>
                                  )
                                );
                              }
                              return null;
                            })}
                        </div>
                      ))}
                    </Box>

                    <Box mt={3} display="flex" justifyContent="flex-end">
                      {settingsModified && (
                        <Button
                          onClick={handleCancel}
                          style={{ marginRight: "8px" }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        onClick={saveSettings}
                        variant="contained"
                        color="success"
                        disabled={!settingsModified}
                      >
                        Save Settings
                      </Button>
                    </Box>
                  </form>
                )}
              </div>
            ))}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Settings;
