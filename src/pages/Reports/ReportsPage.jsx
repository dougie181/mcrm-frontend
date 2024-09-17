import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Button,
  CircularProgress,
  Snackbar,
  Switch,
  FormControlLabel,
  Tooltip
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import axiosInstance from "../../services/axiosInstance";
import { useNavigate } from "react-router-dom";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const ReportsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [toDos, setToDos] = useState([]);
  const [toDoCount, setToDoCount] = useState(0);
  const [repliesToBeProcessed, setRepliesToBeProcessed] = useState(0);
  const [isFetchingReplies, setIsFetchingReplies] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showAllCampaigns, setShowAllCampaigns] = useState(false); // Add state for toggle

  const intervalRef = useRef(null);

  const navigate = useNavigate();

  /// Fetch todo tasks (tasks with status new or in_progress)
  const fetchToDoTasks = async () => {
    try {
      // const params = new URLSearchParams();
      // params.append("status", "new");
      // params.append("status", "in_progress");

      const response = await axiosInstance.get('/tasks/campaign');
      console.log("Tasks for campaigns:", response.data);
  
      if (Array.isArray(response.data.tasks)) {
        const tasksWithOverdue = response.data.tasks.map((task) => {
          // Parse due_date from UTC and convert to local time
          const dueDateUTC = dayjs.utc(task.due_date);
          const localDueDate = dueDateUTC.tz(dayjs.tz.guess());
  
          // Check if the task is overdue
          const isOverdue = localDueDate.isBefore(dayjs()) && task.status !== 'done';
  
          return { ...task, isOverdue };
        });
  
        setToDos(tasksWithOverdue);
  
        // Calculate and set toDoCount directly after fetching tasks
        const newToDoCount = tasksWithOverdue.filter((task) => task.status !== 'done').length;
        setToDoCount(newToDoCount);
      } else {
        console.error("API returned data that's not an array:", response.data);
        setToDos([]);
        setToDoCount(0); // Reset toDoCount if no valid tasks are returned
      }
    } catch (error) {
      console.error("Failed to fetch tasks for campaigns:", error);
      setToDos([]);
      setToDoCount(0); // Reset toDoCount on error
    }
  };

  const checkRepliesToBeProcessed = async () => {
    try {
      const response = await axiosInstance.get('events/tobeprocessed');
      console.log("Replies to be processed:", response.data);
      setRepliesToBeProcessed(response.data.unprocessed_events_count);
    } catch (error) {
      console.error("Failed to fetch replies to be processed:", error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await axiosInstance.get("/campaigns/");
      const completedCampaigns = response.data.filter(
        (campaign) => campaign.status === "completed"
      );

      const campaignsData = completedCampaigns.map((campaign) => {
        const hasStats = campaign.stats && typeof campaign.stats === "object";
        const getStatValue = (stat) => {
          return typeof stat === "number" && !isNaN(stat) ? stat : 0;
        };

        const emailSent = hasStats ? getStatValue(campaign.stats.email_sent) : 0;
        const emailRepliedYes = hasStats ? getStatValue(campaign.stats.email_replied_yes) : 0;
        const emailReplyCallMe = hasStats ? getStatValue(campaign.stats.email_replied_callme) : 0;
        const emailRepliedNo = hasStats ? getStatValue(campaign.stats.email_replied_no) : 0;
        const emailRepliedOther = hasStats ? getStatValue(campaign.stats.email_replied_other) : 0;
        const totalReplies = hasStats ? getStatValue(campaign.stats.replies) : 0;

        const todoCount = Array.isArray(toDos)
          ? toDos.filter((task) => task.campaign_id === campaign.id && task.status !== 'done').length
          : 0;

          const overdueCount = Array.isArray(toDos)
          ? toDos.filter((task) => task.campaign_id === campaign.id && task.isOverdue).length
          : 0;

        const taskCount = Array.isArray(toDos)
          ? toDos.filter((task) => task.campaign_id === campaign.id).length
          : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description || "",
          date: new Date(campaign.created_date).toLocaleDateString(),
          start_date: new Date(campaign.start_date).toLocaleDateString(),
          rawDate: new Date(campaign.created_date), 
          sent: emailSent,
          responded: totalReplies,
          responseRate: emailSent > 0 ? `${((totalReplies / emailSent) * 100).toFixed(0)}%` : "0%",
          toDo: todoCount,
          taskCount: taskCount,
          overdue: overdueCount,
          emailRepliedYes, 
          emailRepliedNo, 
          emailReplyCallMe, 
          emailRepliedOther
        };
      });
  
      campaignsData.sort((a, b) => b.rawDate - a.rawDate);
  
      setCampaigns(campaignsData);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    }
  };  

  useEffect(() => {
    const startPolling = () => {
      intervalRef.current = setInterval(async () => {
        try {
          await checkRepliesToBeProcessed();
        } catch (error) {
          console.error("An error occurred while fetching replies to be processed:", error);
        }
      }, 5000);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Start polling when component mounts
    startPolling();

    // Cleanup when component unmounts
    return () => {
      stopPolling();
    };
  }, []); // Empty dependency array ensures this runs only once when component mounts

  useEffect(() => {
    fetchToDoTasks();
  }, [repliesToBeProcessed]);

  useEffect(() => {
    fetchCampaigns();
  }, [toDos]);

  const triggerEventFetch = async (event_type) => {
    if (isFetchingReplies) return; // Prevent multiple triggers
  
    setIsFetchingReplies(true);
    try {
      const response = await axiosInstance.post("/events/trigger_fetch", {
        event_type,
      });
      console.log(
        `Event fetching and processing started for event type ${event_type}:`,
        response.data
      );
      
      setRepliesToBeProcessed(0); // Reset replies to be processed after triggering fetch
  
      // Simulate a delay for reply processing and fetching and then refresh the campaigns
      setTimeout(async () => {
        try {
          //await checkRepliesToBeProcessed();
          fetchCampaigns();
        } catch (error) {
          console.error("An error occurred while fetching campaigns:", error);
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to start event fetching and processing:", error);
    } finally {
      setIsFetchingReplies(false);  // Allow button re-enable after fetch
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const handleRowClick = (campaign) => {
    if (campaign.taskCount > 0) {
      navigate(`/campaign-tasks?campaignId=${campaign.id}`);
    } else {
      setSnackbarMessage(`No tasks for campaign: ${campaign.name}`);
      setSnackbarOpen(true);
    }
  };

  // Handle filtering campaigns based on taskCount and toDo
  const filteredCampaigns = showAllCampaigns
    ? campaigns // Show all campaigns
    : campaigns.filter((campaign) =>  campaign.toDo > 0); // Show only campaigns with tasks to do

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" mb={3}>
          Email Campaign Report
        </Typography>
        <p>
          These are the reports for all email campaigns. 
          The response rate is dependant on managing individual email tasks from each client. There are currently{" "}
          {campaigns.length} campaigns.
        </p>
        {repliesToBeProcessed > 0 && !isFetchingReplies && (
          <Box display="flex" justifyContent="space-between" mb={4}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => triggerEventFetch("email_response")}
              disabled={isFetchingReplies}
            >
              Retrieve {repliesToBeProcessed} client responses to email campaign
            </Button>
          </Box>
        )}

        {isFetchingReplies && (
          <Box display="flex" justifyContent="center" mb={4}>
            <CircularProgress size={24} />
          </Box>
        )}
        <Box display="flex" justifyContent="space-between" mb={4}>
          <Paper
            elevation={3}
            sx={{ padding: 2, display: "flex", alignItems: "center" }}
          >
            <TrendingUpIcon
              sx={{ fontSize: 40, marginRight: 1 }}
              color="success"
            />
            <Typography variant="h6">
              Total Sent:{" "}
              {campaigns.reduce((total, campaign) => total + campaign.sent, 0)}
            </Typography>
          </Paper>
          <Paper
            elevation={3}
            sx={{ padding: 2, display: "flex", alignItems: "center" }}
          >
            <PieChartIcon
              sx={{ fontSize: 40, marginRight: 1 }}
              color="warning"
            />
            <Typography variant="h6">
              Total Responses:{" "}
              {campaigns.reduce(
                (total, campaign) => total + campaign.responded,
                0
              )}
            </Typography>
          </Paper>
          <Paper
            elevation={3}
            sx={{ padding: 2, display: "flex", alignItems: "center" }}
          >
            <PendingActionsOutlinedIcon
              sx={{ fontSize: 40, marginRight: 1 }}
              color="primary"
            />
            <Typography variant="h6">
              Total To Do: {toDoCount}{" "}
            </Typography>
          </Paper>
        </Box>
         {/* Toggle for showing all campaigns or only those with tasks */}
         <FormControlLabel
          control={
            <Switch
              checked={showAllCampaigns}
              onChange={() => setShowAllCampaigns(!showAllCampaigns)}
              name="showAllCampaigns"
              color="primary"
            />
          }
          label="Show All Campaigns"
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{width: '50%'}}>Campaign</TableCell>
                <TableCell align="left">Date Sent</TableCell>
                <TableCell align="center">Sent</TableCell>
                <TableCell align="center">Responded</TableCell>
                <TableCell align="center">Response Rate</TableCell>
                <TableCell align="center">To Do</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow 
                  key={campaign.id}
                  onClick={() => handleRowClick(campaign)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar sx={{ bg: "primary.main", marginRight: 1 }}>
                        <PieChartIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {campaign.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {truncateText(campaign.description, 100)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="left">{campaign.start_date}</TableCell>
                  <TableCell align="center">{campaign.sent}</TableCell>
                  <TableCell align="center">
                    {campaign.responded > 0 ? (
                      <Tooltip
                        title={
                          <>
                            <Typography color="inherit">Yes: {campaign.emailRepliedYes}</Typography>
                            <Typography color="inherit">No: {campaign.emailRepliedNo}</Typography>
                            <Typography color="inherit">Other: {campaign.emailRepliedOther}</Typography>
                          </>
                        }
                        arrow
                      >
                        <span
                          style={{
                            color: "blue",
                            cursor: "pointer"
                          }}
                        >
                          {campaign.responded}
                        </span>
                      </Tooltip>
                    ) : (
                      <span>{campaign.responded}</span>
                    )}
                  </TableCell>
                  <TableCell align="center">{campaign.responseRate}</TableCell>
                  <TableCell align="center">
                    {campaign.overdue > 0 ? (
                        <Tooltip title={`${campaign.overdue} Overdue Tasks`} arrow>
                          <span style={{ color: "red", fontWeight: "bold" }}>
                            {campaign.taskCount > 0 ? campaign.toDo : 'N/A'}
                          </span>
                        </Tooltip>
                      ) : (
                        campaign.taskCount > 0 ? campaign.toDo : 'N/A'
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default ReportsPage;