import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TaskIcon from "./TaskIcon";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Typography,
  Tooltip,
  Box,
} from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/en-au";

dayjs.locale("en-au");

const TaskList = ({
  tasks,
  showTask,
  selectedTasks,
  setSelectedTasks,
  setConfirmDialog,
}) => {
  const navigate = useNavigate();
  const currentDate = useMemo(() => new Date(), []);

  const handleTaskActionClick = (task) => {
    const routeMap = {
      email: "email-task",
      call: "call-task",
    };
    const route = routeMap[task.type] || "other-task";
    navigate(route, { state: { task } });
  };

  const toggleTask = (taskId) => {
    setSelectedTasks((prevSelectedTasks) => {
      const newSelectedTasks = new Set(prevSelectedTasks);
      newSelectedTasks.has(taskId)
        ? newSelectedTasks.delete(taskId)
        : newSelectedTasks.add(taskId);
      return newSelectedTasks;
    });
  };

  const toggleAllTasks = (tasksToToggle) => {
    setSelectedTasks((prevSelectedTasks) => {
      const newSelectedTasks = new Set(prevSelectedTasks);
      tasksToToggle.forEach((task) => {
        newSelectedTasks.has(task.id)
          ? newSelectedTasks.delete(task.id)
          : newSelectedTasks.add(task.id);
      });
      return newSelectedTasks;
    });
  };

  const listItemSecondaryText = (task) => {
    //console.log("task", task);

    // extract the client_name from the task.data if it and and task.client_id exists
    const client_name = task.data && task.client_id ? task.data.client_name : null;
    
    
    const { priority, type, system_generated, due_date } = task;
    
    // Parse the due_date as UTC and then convert it to local time
    const localDueDate = dayjs.utc(due_date).local().format("DD/MM/YYYY");

    return `
      ${client_name ? `Client: ${client_name}, ` : ""}
      Due: ${localDueDate}, 
      Priority: ${priority}, 
      Type: ${type}, 
      System Generated: ${system_generated ? "Yes" : "No"}
    `;
  };

  const renderTaskList = (title, style, taskFilter) => {
    const filteredTasks = tasks.filter(taskFilter);

    const checkboxStyle = {
      marginRight: "10px",
      color: style.color,
    };

    return (
      <>
        <Typography variant="h6" style={style}>
          <Checkbox
            onClick={() => toggleAllTasks(filteredTasks)}
            style={checkboxStyle}
          />
          {title}
        </Typography>
        <List>
          {filteredTasks.map((task) => (
            <ListItem key={task.id} button onClick={() => showTask(task)}>
              <Checkbox
                checked={selectedTasks.has(task.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTask(task.id);
                }}
              />
              <TaskIcon type={task.type} />
              <ListItemText
                primary={task.title}
                secondary={listItemSecondaryText(task)}
              />
              <ListItemSecondaryAction>
                <Box display="flex" alignItems="center">
                  {task.notes && (
                    <Typography
                      variant="body2"
                      color="error"
                      style={{ marginRight: 16 }}
                    >
                      Please refer to notes!
                    </Typography>
                  )}
                  <IconButton
                    edge="end"
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmDialog({ isDialogOpen: true, taskId: task.id });
                    }}
                  >
                    <Tooltip title="Mark as Completed">
                      <CheckCircleIcon />
                    </Tooltip>
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleTaskActionClick(task);
                    }}
                  >
                    <Tooltip title="Perform task action">
                      <ArrowForwardIcon />
                    </Tooltip>
                  </IconButton>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </>
    );
  };

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          dayjs.utc(task.due_date).local().isBefore(currentDate, 'day') &&
          task.status === "new"
      ),
    [tasks, currentDate]
  );
  
  const todaysTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          dayjs.utc(task.due_date).local().isSame(currentDate, 'day') &&
          task.status === "new"
      ),
    [tasks, currentDate]
  );
  
  const upcomingTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          dayjs.utc(task.due_date).local().isAfter(currentDate, 'day') &&
          task.status === "new"
      ),
    [tasks, currentDate]
  );

  if (
    overdueTasks.length === 0 &&
    todaysTasks.length === 0 &&
    upcomingTasks.length === 0
  ) {
    return (
      <Typography variant="h6">There are no tasks to be completed.</Typography>
    );
  }

  const taskSections = [
    { title: "Overdue Tasks", tasks: overdueTasks, style: { backgroundColor: "#FF7F50", color: "black", padding: "4px 16px" } },
    { title: "Tasks due today", tasks: todaysTasks, style: { backgroundColor: "#40E0D0", color: "black", padding: "4px 16px" } },
    { title: "Upcoming Tasks", tasks: upcomingTasks, style: { backgroundColor: "#E6E6FA", color: "black", padding: "4px 16px" } },
  ];

  return (
    <>
      {taskSections.map(
        ({ title, tasks, style }) =>
          tasks.length > 0 && (
            <Paper elevation={3} key={title}>
              {renderTaskList(title, style, (task) => tasks.includes(task))}
            </Paper>
          )
      )}
    </>
  );
};

export default TaskList;
