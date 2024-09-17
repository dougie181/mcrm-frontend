import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Button,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  CircularProgress,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Switch,
  Divider
} from "@mui/material";
import DropdownIcon from "@mui/icons-material/ArrowDropDown";
import axiosInstance from "../../services/axiosInstance";
import CampaignTaskList from "./CampaignTaskList";
import { useNavigate, useLocation } from "react-router-dom";
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CampaignTaskForm from "./CampaignTaskForm";


import { useCounters } from '../../context/CountersContext';


const CampaignTaskView = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkActionMenuOpen, setBulkActionMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null); // To hold the task being completed
  const [responseType, setResponseType] = useState(""); // To hold 'Yes', 'No', or 'Follow-up' response
  const [showCompleted, setShowCompleted] = useState(true); // State to toggle completed tasks
  const [showWarning, setShowWarning] = useState(false); // State to show a warning if no response

  const { recalculateCounters } = useCounters(); // Get recalculateCounters from context

  // Task Form stats
  const [taskFormState, setTaskFormState] = useState({
    isOpen: false,
    mode: "",
    taskData: null,
  });

  const { isOpen, mode, taskData } = taskFormState;
  

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const campaignId = query.get("campaignId");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get("/tasks/campaign", {
          params: { campaign_id: campaignId },
        });
        // order the tasks showing the completed ones last
        response.data.tasks.sort((a, b) => {
          if (a.status === "done" && b.status !== "done") {
            return 1;
          } else if (a.status !== "done" && b.status === "done") {
            return -1;
          }
          return 0;
        });

        setTasks(response.data.tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCampaign = async () => {
      if (campaignId) {
        try {
          const response = await axiosInstance.get(`/campaigns/${campaignId}`);
          setCampaign(response.data);
        } catch (error) {
          console.error("Error fetching campaign:", error);
        }
      }
    };

    fetchTasks();
    fetchCampaign();
  }, [campaignId]);

  const handleBulkMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
    setBulkActionMenuOpen(true);
  };

  const handleBulkMenuClose = () => {
    setAnchorEl(null);
    setBulkActionMenuOpen(false);
  };

  const handleUpdateSelectedTasks = async (responseValue) => {
    setBulkActionMenuOpen(false);
    try {
      const promises = Array.from(selectedTasks).map(async (taskId) => {
        const response = await axiosInstance.put(`/tasks/campaign/${taskId}`, { response: responseValue });

        // Create an event for each task update
        await postEvent(taskId, responseValue);
        
        return response.data;
      });

      const updatedTasksData = await Promise.all(promises); // Get all updated task data

      //todo: updateTaskListState(updatedTasksData); // Refactored to update the state
      
      // Update the tasks in the state with the new data from the backend
      const updatedTasks = tasks.map((task) => {
        const updatedTask = updatedTasksData.find((utask) => utask.id === task.id);
        return updatedTask ? { ...task, ...updatedTask } : task;
      });

      // Reorder the tasks showing the completed ones last
      // order the tasks showing the completed ones last
      updatedTasks.sort((a, b) => {
        if (a.status === "done" && b.status !== "done") {
          return 1;
        } else if (a.status !== "done" && b.status === "done") {
          return -1;
        }
        return 0;
      });
      
      setTasks(updatedTasks);
      setSelectedTasks(new Set()); // Reset selected tasks after update
      recalculateCounters(); // Recalculate counters after updating tasks

    } catch (error) {
      console.error("Error updating tasks:", error);
    }
  };

  const handleCompleteSelectedTasks = async () => {
    setBulkActionMenuOpen(false);
    try {
      const promises = Array.from(selectedTasks).map(async (taskId) => {
        await axiosInstance.post(`/tasks/${taskId}/complete`);
        return taskId; // Return the task ID after it's completed
      });
  
      const completedTaskIds = await Promise.all(promises); // Get all completed task IDs
      
      // Optimistically update the tasks by setting their status to 'done'
      const updatedTasks = tasks.map((task) => {
        return completedTaskIds.includes(task.id) ? { ...task, status: 'done' } : task;
      });

      // Reorder the tasks showing the completed ones last
      // order the tasks showing the completed ones last
      updatedTasks.sort((a, b) => {
        if (a.status === "done" && b.status !== "done") {
          return 1;
        } else if (a.status !== "done" && b.status === "done") {
          return -1;
        }
        return 0;
      });
      
      setTasks(updatedTasks);
      setSelectedTasks(new Set()); // Reset selected tasks after update
      recalculateCounters(); // Recalculate counters after updating tasks
  
    } catch (error) {
      console.error("Error completing tasks:", error);
    }
  };

  const handleUpdateIndividualTask = async (taskId, responseValue) => {
    try {
      const response = await axiosInstance.put(`/tasks/campaign/${taskId}`, { response: responseValue });

      // Create an event for the task update
      await postEvent(taskId, responseValue);

      // Update the task in the list
      console.log("Updated task:", response.data);
      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, ...response.data } : task
      );
      setTasks(updatedTasks);
      
    } catch (error) {
      console.error("Error updating individual task:", error);
    }
  };

  const handleCompleteIndividualTask = async (taskId) => {
    try {
      const response = await axiosInstance.post(`/tasks/${taskId}/complete`);
      
      // Update the task in the list
      console.log("Completed task:", response.data);

      // update the task status to be 'done' 
      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, status: 'done' } : task
      );
      setTasks(updatedTasks);

    } catch (error) {
      console.error("Error completing individual task:", error);
    }
  };

  const handleTaskFormSubmit = async (taskData) => {
    try {
      // Exclude client information from the request
      const { client, ...taskDataToSend } = taskData;

      let response;
      if (taskData.id) {
        // Update existing task
        response = await axiosInstance.put(`/tasks/campaign/${taskData.id}`, taskDataToSend);
      } else {
        // Create new task
        response = await axiosInstance.post("/tasks/campaign", taskDataToSend);
      }

      if (response.status === 200 || response.status === 201) {
        // Add client data back to the response before updating state
        const taskWithClient = { ...response.data, client: taskData.client };

        // Update the task list with the new or updated task
        handleSuccess(taskWithClient);
        recalculateCounters(); // Recalculate counters after updating tasks
      }
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const postEvent = async (taskId, responseValue) => {
    // make the responseValue lowercase
    const response_value = responseValue.toLowerCase();
    const id = taskId;
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0]; // Remove 'T' and milliseconds
    //const timestamp = new Date().toISOString()

    // retrieve the client account ID from the task
    const task = tasks.find((t) => t.id === taskId);
    const client = task.client;

    const campaign_account_id = campaign.id + "_" + client.accountId;

    const eventData = {
      event_type: "client_response",
      timestamp: timestamp,
      data: { id, response_value , timestamp: timestamp, campaign_account_id },
    };
  
    try {
      // Create the event in the backend
      const response = await axiosInstance.post("/events/", eventData);
      const eventId = response.data.id;
  
      console.log(`Event for task ${taskId} created with event ID: ${eventId}`);
  
      // Now mark the event as processed after task update
      await markEventAsProcessed(eventId);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };
  
  // Helper function to mark the event as processed
  const markEventAsProcessed = async (eventId) => {
    try {
      await axiosInstance.put(`/events/${eventId}`, { processed: 1 });
      console.log(`Event ${eventId} marked as processed.`);
    } catch (error) {
      console.error("Error marking event as processed:", error);
    }
  };

  const openUpdateDialog = (taskId) => {
    setCurrentTaskId(taskId);
    setUpdateDialogOpen(true);
  };

  const closeUpdateDialog = () => {
    setUpdateDialogOpen(false);
    setCurrentTaskId(null);
    setResponseType("");
  };
  
  const openConfirmDialog = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    const hasResponse = task?.data?.response;

    setCurrentTaskId(taskId);
    setShowWarning(!hasResponse); // Show warning if no response
    setConfirmDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setCurrentTaskId(null);
    setResponseType("");
  };

  const confirmUpdate = () => {
    console.log("Updating task...");  
    if (currentTaskId && responseType) {
      handleUpdateIndividualTask(currentTaskId, responseType);
      recalculateCounters(); // Recalculate counters after updating tasks
    }
    closeUpdateDialog();
  };

  const confirmCompletion = () => {
    console.log("Completing task...");
    if (currentTaskId) {
      handleCompleteIndividualTask(currentTaskId);
      recalculateCounters(); // Recalculate counters after updating tasks
    }
    closeConfirmDialog();
  };

  const handleSendEmailForTask = async (task_id) => {
    console.log("Sending follow-up email for task:", task_id);
    const routeMap = {
      email: "campaign-email-task"
    };
    const task = tasks.find((t) => t.id === task_id);
    const route = "campaign-email-task";
    navigate(route, { state: { task } });
  }; 

  // task form handlers
  const showTask = (task) => {
    setTaskFormState({ isOpen: true, mode: "update", taskData: task });
  };

  const handleClose = () => {
    setTaskFormState({ ...taskFormState, isOpen: false });
  };

  const handleSuccess = (data) => {
    const taskExists = tasks.some(task => task.id === data.id);
  
    let updatedTasks;
    if (taskExists) {
      // Update the task if it exists
      updatedTasks = tasks.map((task) =>
        task.id === data.id ? data : task
      );
    } else {
      // Add new task if it doesn't exist
      updatedTasks = [...tasks, data];
    }
  
    setTasks(updatedTasks);
    handleClose();
  };

  return (
    <Container maxWidth="lg">
      <Box marginTop={4} marginBottom={2}>
        {/* Main Campaign Title */}
        <Typography variant="h4" gutterBottom>
          Campaign report for: {campaign?.name}
        </Typography>

        {/* Subtext Description */}
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Below are the tasks created for this campaign to manage the client responses, sending of follow up emails and outstanding actions.
        </Typography>

        <Divider sx={{ marginY: 2 }} />

        {/* Campaign Information */}
        {campaign && (
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Campaign email subject:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {campaign.subject}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Date emails sent:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {new Date(campaign.created_date).toLocaleDateString()}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Query parameters used:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {campaign.params}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Total emails sent:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {tasks.length}
              </Typography>
            </Grid>
          </Grid>
        )}

        <Divider sx={{ marginY: 2 }} />

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          marginBottom={2}
          marginTop={2}
        >
          <FormControlLabel
            control={
              <Switch
                checked={showCompleted}
                onChange={() => setShowCompleted(!showCompleted)}
              />
            }
            label="Show Completed"
            style={{ marginLeft: 16 }}
          />
          <div>
            <Tooltip title="Bulk Actions">
              <span>
                <Button
                  disabled={selectedTasks.size === 0}
                  variant="contained"
                  startIcon={<DropdownIcon />}
                  onClick={handleBulkMenuClick}
                >
                  Bulk Actions
                </Button>
              </span>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={bulkActionMenuOpen}
              onClose={handleBulkMenuClose}
            >
              <MenuItem onClick={() => handleUpdateSelectedTasks("No")}>
                Update Tasks with client response of No
              </MenuItem>
              <MenuItem onClick={() => handleUpdateSelectedTasks("Yes")}>
                Update Tasks with client response of Yes
              </MenuItem>
              <MenuItem onClick={() => handleUpdateSelectedTasks("Follow-up")}>
                Update tasks with Follow-up required
              </MenuItem>
              <MenuItem onClick={() => handleCompleteSelectedTasks()}>
                Complete selected tasks
              </MenuItem>
            </Menu>
          </div>
        </Box>

        {isLoading && <CircularProgress />}

        {!isLoading && tasks.length === 0 && (
          <Typography variant="h6">
            No tasks found for this campaign.
          </Typography>
        )}

        {!isLoading && tasks.length > 0 && (
          <CampaignTaskList
            tasks={tasks}
            selectedTasks={selectedTasks}
            setSelectedTasks={setSelectedTasks}
            openConfirmDialog={openConfirmDialog}
            openUpdateDialog={openUpdateDialog}
            showCompleted={showCompleted}
            handleTaskActionClick={handleSendEmailForTask}
            showTask={showTask}
          />
        )}

        {/* Confirmation Dialog for task completion */}
        <Dialog open={confirmDialogOpen} onClose={closeConfirmDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              {showWarning && (
                <WarningAmberOutlinedIcon color="error" sx={{ marginRight: 1 }} />
              )}
              Complete Task
            </Box>
          </DialogTitle>

          <DialogContent>
            <DialogContentText>
              {showWarning
                ? "Warning: This task has no recorded client response. Are you sure you want to complete it?"
                : "Please confirm you have performed the action the client requested and now would like to complete this task."}
            </DialogContentText>
          </DialogContent>

          <DialogActions sx={{ padding: "16px 24px", justifyContent: "flex-end" }}>
            <Button
              onClick={closeConfirmDialog}
              color="primary"
              sx={{ marginRight: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCompletion}
              color="primary"
              variant="contained"
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Task Form Dialog */}
        {isOpen && (
          <CampaignTaskForm
            mode={mode}
            taskData={taskData}
            onSubmit={handleTaskFormSubmit}
            onClose={handleClose}
          />
        )}

        {/* Confirmation Dialog for individual task update */}
        <Dialog
          open={updateDialogOpen}
          onClose={closeUpdateDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Record the client response to email sent</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please select the client's response for this task.
            </DialogContentText>
            <Box mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant={responseType === "Yes" ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => setResponseType("Yes")}
                  >
                    Yes, Please proceed
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant={responseType === "No" ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => setResponseType("No")}
                  >
                    No, Not interested
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant={
                      responseType === "Follow-up" ? "contained" : "outlined"
                    }
                    color="primary"
                    onClick={() => setResponseType("Follow-up")}
                  >
                    Follow-up please
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{ padding: "16px 24px", justifyContent: "flex-end" }}
          >
            <Button
              onClick={closeUpdateDialog}
              color="primary"
              sx={{ marginRight: 3 }}
            >
              Cancel
            </Button>
            <Button onClick={confirmUpdate} color="primary" variant="contained">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default CampaignTaskView;