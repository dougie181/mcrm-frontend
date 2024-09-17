import React, { useState, useRef, useEffect } from "react";
import {
  TextField,
  MenuItem,
  Drawer,
  Box,
  Button,
  Grid,
  Typography,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';

import ClientSearchDialog from "../Clients/ClientSearchDialog";
import axiosInstance from "../../services/axiosInstance";

dayjs.extend(utc);

// Default task data
const newDefaultTaskData = {
  type: "",
  title: "",
  description: "",
  notes: "",
  data: {
    bcc_id: null,
    client_name: null,
  },
  due_date: null,
  priority: "Medium", // Default value as string
  status: "new", // Automatically set to "new"
};
const TaskForm = ({ mode, taskData, onSuccess, onClose }) => {
  const [localTaskData, setLocalTaskData] = useState(newDefaultTaskData);
  const [errors, setErrors] = useState({});
  const [openClientDialog, setOpenClientDialog] = useState(false);
  const [clientLinked, setClientLinked] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [taskTypes, setTaskTypes] = useState([]);

  const linkingClientRef = useRef(false);
  const initialTaskData = useRef(localTaskData);

  useEffect(() => {
    const updateData = () => {
      if (taskData) {
        setLocalTaskData((prevTaskData) => ({
          ...prevTaskData,
          ...taskData,
          // Convert the existing due_date from UTC to local time for display purposes
          due_date: taskData.due_date ? dayjs.utc(taskData.due_date).local() : null,
          // Set a default priority if it's null
          priority: taskData.priority || "Medium",
        }));
        if (taskData.client_id) {
          setClientLinked(true);
        }
      }
    };

    const fetchTaskTypes = async () => {
      try {
        const response = await axiosInstance.get("/lookup_values/taskType");
        setTaskTypes(response.data);
      } catch (error) {
        console.error("An error occurred while fetching task types:", error);
      }
    };

    const fetchData = async () => {
      await fetchTaskTypes();
      updateData();
    };

    fetchData();
  }, [taskData]);

  useEffect(() => {
    setIsChanged(
      JSON.stringify(initialTaskData.current) !== JSON.stringify(localTaskData)
    );
  }, [localTaskData]);

  const handleClientDialogOpen = () => {
    linkingClientRef.current = true;
    setOpenClientDialog(true);
  };

  const handleClientUnlink = () => {
    setShowUnlinkDialog(true);
  };

  const handleClientLink = (clientData) => {
    setClientLinked(true);

    if (linkingClientRef.current) {
      setOpenClientDialog(false);
      setLocalTaskData((prevTaskData) => {
        return {
          ...prevTaskData,
          client_id: clientData.id,
          data: {
            ...prevTaskData.data,
            bcc_id: clientData.bccID,
            client_name: clientData.preferredFirstName + " " + clientData.contactPersonSurname,
          },
        };
      });
    }
  };

  const handleClientDialogClose = () => {
    setOpenClientDialog(false);
    if (!clientLinked) {
      //setClientLinked(false);
    }
  };

  const isReadOnly = mode === "view" || localTaskData.status === "done";
  const isSystemGenerated = localTaskData.system_generated;
  const hideLinkCheckbox = localTaskData.client_id && localTaskData.data.hard_linked ? true : false;
  const checked = localTaskData.client_id !== null && localTaskData.client_id !== undefined;

  // Determine the title based on the mode
  let title;
  switch (mode) {
    case "create":
      title = "Create New Task";
      break;
    case "update":
      title = "Update Task";
      break;
    case "view":
      title = "View Task";
      break;
    default:
      title = "Task";
  }

  const validateForm = () => {
    const tempErrors = {};
    if (!localTaskData.type) {
      tempErrors.type = "Task Type is required";
    }
    if (!localTaskData.title) {
      tempErrors.title = "Title is required";
    }
    if (!localTaskData.due_date) {
      tempErrors.due_date = "Due Date is required";
    }
    if (!localTaskData.priority) {
      tempErrors.priority = "Priority is required";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (key, value) => {
    if (key === "due_date") {
      // Convert to a Day.js object when user selects a date
      value = dayjs(value);
    }

    setLocalTaskData((prevTaskData) => {
      return {
        ...prevTaskData,
        [key]: value,
      };
    });
  };

  const handleSaveOrUpdate = async () => {
    if (validateForm()) {
      try {
        let taskDataToSend = { ...localTaskData };

        // Check if due_date exists and convert it to UTC before sending it to the backend
        if (localTaskData.due_date) {
          taskDataToSend.due_date = dayjs(localTaskData.due_date).utc().toISOString();
        }

        let response;
        if (mode === "create") {
          response = await axiosInstance.post("/tasks/", taskDataToSend);
        } else {
          response = await axiosInstance.put(`/tasks/${taskData.id}`, taskDataToSend);
        }

        if (response.status === 200 || response.status === 201) {
          onSuccess(response.data);
        }
      } catch (error) {
        console.error("An error occurred while saving the task:", error);
      }
    }
  };

  const handleUnlinkClient = () => {
    setShowUnlinkDialog(false);
    setClientLinked(false);
    setLocalTaskData((prevTaskData) => ({
      ...prevTaskData,
      client_id: null,
      data: {
        ...prevTaskData.data,
        bcc_id: null,
        client_name: null,
      },
    }));
  };

  const renderConfirmUnlinkDialog = () => {
    return (
      <Dialog open={showUnlinkDialog} onClose={() => setShowUnlinkDialog(false)}>
        <DialogTitle>Unlink Client</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to unlink the client to this task. Are you sure you would like to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUnlinkDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleUnlinkClient} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Drawer anchor="right" open={true} onClose={onClose}>
      <Box sx={{ width: 600, padding: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              {title}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Task Type"
              select
              variant="outlined"
              fullWidth
              value={localTaskData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
              error={!!errors.type}
              helperText={errors.type}
              disabled={localTaskData.system_generated} // Disable if the task is system-generated
            >
              {taskTypes.map((taskType) => (
                <MenuItem key={taskType.id} value={taskType.name}>
                  {taskType.display_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Title"
              variant="outlined"
              fullWidth
              value={localTaskData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              value={localTaskData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </Grid>
          {!isSystemGenerated && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={clientLinked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleClientDialogOpen();
                      } else {
                        handleClientUnlink();
                      }
                    }}
                  />
                }
                label="Link Client Account"
              />
              {localTaskData.client_id && localTaskData.data.client_name && (
                <Typography variant="body2" color="textSecondary">
                  Client Name: {localTaskData.data.client_name}
                </Typography>
              )}
            </Grid>
          )}
          {isSystemGenerated && localTaskData.client_id && localTaskData.data.client_name && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Client Name: {localTaskData.data.client_name}
              </Typography>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              label="Notes"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              rowsmax={10}
              value={localTaskData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-au">
              <DatePicker
                label="Due Date"
                inputFormat="DD/MM/YYYY"
                value={localTaskData.due_date}
                onChange={(newValue) => handleInputChange("due_date", newValue)}
                components={{
                  textField: TextField,
                }}
                componentsProps={{
                  textField: {
                    variant: "outlined",
                    fullWidth: true,
                    error: !!errors.due_date,
                    helperText: errors.due_date,
                    disabled: isReadOnly,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Priority"
              select
              variant="outlined"
              fullWidth
              value={localTaskData.priority}
              onChange={(e) => handleInputChange("priority", e.target.value)}
              error={!!errors.priority}
              helperText={errors.priority}
            >
              <MenuItem key="High" value="High">
                High
              </MenuItem>
              <MenuItem key="Medium" value="Medium">
                Medium
              </MenuItem>
              <MenuItem key="Low" value="Low">
                Low
              </MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <Button variant="outlined" color="secondary" fullWidth size="large" onClick={onClose}>
              Cancel
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleSaveOrUpdate}
              disabled={!isChanged}
            >
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </Grid>
          <ClientSearchDialog
            open={openClientDialog}
            onClose={handleClientDialogClose}
            onLink={handleClientLink}
          />
          {renderConfirmUnlinkDialog()}
        </Grid>
      </Box>
    </Drawer>
  );
};

export default TaskForm;