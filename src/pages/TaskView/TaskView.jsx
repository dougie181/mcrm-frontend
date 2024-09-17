import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Button,
  IconButton,
  Typography,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
  CircularProgress, // Correct import for CircularProgress
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DropdownIcon from "@mui/icons-material/ArrowDropDown";
import axiosInstance from "../../services/axiosInstance";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import TaskGrid from "./TaskGrid";
import { useLocation, useNavigate } from "react-router-dom";

const TaskView = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [confirmDialog, setConfirmDialog] = useState({
    isDialogOpen: false,
    taskId: null,
  });
  const [bulkActionMenuOpen, setBulkActionMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [refreshLoading, setRefreshLoading] = useState(false); // New state for refresh action

  const [taskFormState, setTaskFormState] = useState({
    isOpen: false,
    mode: "",
    taskData: null,
  });

  const { isOpen, mode, taskData } = taskFormState;
  const { isDialogOpen, taskId } = confirmDialog;

  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);
  const campaignId = query.get("campaignId");

  // Fetch "todo" tasks
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        console.log(
          "Calling backend to get todo tasks for campaignId: ",
          campaignId || "all"
        );
        const response = await axiosInstance.get("/tasks", {
          params: {
            status: "new", // Fetch "new" tasks
            campaign_id: campaignId, // Fetch tasks for a specific campaign if provided
          },
        });
        console.log(
          `Fetched tasks with campaign_id: ${campaignId}`,
          response.data
        );
        setTasks(response.data);
      } catch (error) {
        console.error("An error occurred while fetching tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCampaign = async () => {
      if (campaignId) {
        try {
          const response = await axiosInstance.get(`/campaigns/${campaignId}`);
          console.log("Campaign response: ", response.data);
          setCampaign(response.data);
        } catch (error) {
          console.error("An error occurred while fetching campaign:", error);
        }
      }
    };

    fetchTasks();
    fetchCampaign();
  }, [campaignId]);

  // Trigger the fetch for completed tasks
  const fetchCompletedTasks = async () => {
    try {
      const response = await axiosInstance.get("/tasks", {
        params: {
          status: "done", // Fetch only "done" tasks
          campaign_id: campaignId, // Fetch tasks for a specific campaign if provided
        },
      });
      setCompletedTasks(response.data);
    } catch (error) {
      console.error("An error occurred while fetching completed tasks:", error);
    }
  };

  const triggerEventFetch = async (event_type) => {
    if (refreshLoading) return; // Prevent multiple triggers

    setRefreshLoading(true);
    try {
      const response = await axiosInstance.post("/events/trigger_fetch", {
        event_type,
      });
      console.log(
        `Event fetching and processing started for event type ${event_type}:`,
        response.data
      );

      setTimeout(async () => {
        try {
          const response = await axiosInstance.get("/tasks", {
            params: {
              status: "new", // Refetch the "new" tasks
              campaign_id: campaignId,
            },
          });
          console.log(
            `Fetched tasks with campaign_id: ${campaignId}`,
            response.data
          );
          setTasks(response.data);
        } catch (error) {
          console.error("An error occurred while fetching tasks:", error);
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to start event fetching and processing:", error);
    } finally {
      setRefreshLoading(false); // Reset loading state
    }
  };

  const handleCreateNewTaskClick = () => {
    setTaskFormState({ isOpen: true, mode: "create", taskData: null });
  };

  const showTask = (task) => {
    setTaskFormState({ isOpen: true, mode: "update", taskData: task });
  };

  const handleClose = () => {
    setTaskFormState({ ...taskFormState, isOpen: false });
  };

  const handleSuccess = (data) => {
    if (mode === "create") {
      setTasks([...tasks, data]);
    } else {
      const updatedTasks = tasks.map((task) =>
        task.id === data.id ? data : task
      );
      setTasks(updatedTasks);
    }
    handleClose();
  };

  const markTaskAsCompleted = async (taskId) => {
    try {
      await axiosInstance.post(`/tasks/${taskId}/complete`);
      setTasks(tasks.filter((task) => task.id !== taskId)); // Remove completed task
      setConfirmDialog({ isDialogOpen: false, taskId: null }); // Close the dialog
    } catch (error) {
      console.error(
        "An error occurred while marking the task as completed:",
        error
      );
    }
  };

  const completeSelectedTasks = async () => {
    setBulkActionMenuOpen(false);
    try {
      const promises = Array.from(selectedTasks).map((taskId) =>
        axiosInstance.post(`/tasks/${taskId}/complete`)
      );
      await Promise.all(promises);
      setTasks(tasks.filter((task) => !selectedTasks.has(task.id)));
      setSelectedTasks(new Set());
    } catch (error) {
      console.error("An error occurred while completing the tasks:", error);
    }
  };

  const handleBulkMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
    setBulkActionMenuOpen(true);
  };

  const CampaignDescription = () => {
    if (!campaign) return null;
    const dateText = new Date(campaign.created_date).toLocaleDateString();
    const emailSentText = `${campaign.stats.email_sent} emails sent`;
    const numberReplies =
      campaign.stats.email_replied_no +
      campaign.stats.email_replied_other +
      campaign.stats.email_replied_yes;
    const emailRepliedText =
      numberReplies > 1
        ? `${numberReplies} replies`
        : numberReplies === 1
        ? "1 reply"
        : "No replies";

    return (
      <Typography variant="h6">
        {campaign.name} | {dateText} | {emailSentText} | {emailRepliedText}
      </Typography>
    );
  };

  return (
    <>
      <Dialog
        open={isDialogOpen}
        onClose={() => setConfirmDialog({ isDialogOpen: false, taskId: null })}
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark this task as completed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDialog({ isDialogOpen: false, taskId: null })
            }
            color="primary"
          >
            Cancel
          </Button>
          <Button onClick={() => markTaskAsCompleted(taskId)} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="lg">
        <Box marginTop={4}>
          <Typography variant="h4" gutterBottom>
            Task Management
          </Typography>
          <Box display="flex" justifyContent="space-between" marginBottom={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateNewTaskClick}
            >
              Create New Task
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                fetchCompletedTasks();
                setShowCompleted(!showCompleted);
              }}
            >
              {showCompleted ? "Hide Completed Tasks" : "Show Completed Tasks"}
            </Button>
            <div>
              <Tooltip title="Bulk Actions">
                <Button
                  variant="outlined"
                  startIcon={<DropdownIcon />}
                  onClick={handleBulkMenuClick}
                >
                  Bulk Actions
                </Button>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={bulkActionMenuOpen}
                onClose={() => {
                  setAnchorEl(null);
                  setBulkActionMenuOpen(false);
                }}
              >
                <MenuItem onClick={completeSelectedTasks}>
                  Complete Tasks
                </MenuItem>
              </Menu>
              <Tooltip title="Refresh Tasks">
                <IconButton
                  onClick={() => triggerEventFetch("email_response")}
                  disabled={refreshLoading}
                >
                  {refreshLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <RefreshIcon />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          </Box>

          {campaignId && (
            <Box marginBottom={2}>
              <CampaignDescription />
            </Box>
          )}

          {!campaignId && (
            <Box marginBottom={2}>
              <Typography variant="h6">
                Tasks from all campaigns are showing.
              </Typography>
            </Box>
          )}

          {isOpen && (
            <TaskForm
              mode={mode}
              taskData={taskData}
              onSuccess={handleSuccess}
              onClose={handleClose}
            />
          )}

          {isLoading && <Typography variant="h6">Loading...</Typography>}
          {!isLoading && tasks.length === 0 && (
            <Typography variant="h6">
              No outstanding tasks found for this campaign.
            </Typography>
          )}
          {!isLoading && tasks.length > 0 && (
            <TaskList
              tasks={tasks}
              showTask={showTask}
              selectedTasks={selectedTasks}
              setSelectedTasks={setSelectedTasks}
              setConfirmDialog={setConfirmDialog}
            />
          )}

          {!isLoading && showCompleted && <TaskGrid tasks={completedTasks} />}
        </Box>
      </Container>
    </>
  );
};

export default TaskView;
