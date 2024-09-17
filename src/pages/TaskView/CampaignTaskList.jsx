import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Tooltip,
  Paper,
  TablePagination,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MailIcon from "@mui/icons-material/Mail";
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const CampaignTaskList = ({
  tasks,
  selectedTasks,
  setSelectedTasks,
  openConfirmDialog,
  openUpdateDialog,
  showCompleted,
  handleTaskActionClick,
  showTask
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25); // Default to 5 rows per page

  // Handle task selection
  const handleTaskSelection = (taskId, isSelected) => {
    setSelectedTasks((prevSelectedTasks) => {
      const updatedSet = new Set(prevSelectedTasks);
      if (isSelected) {
        updatedSet.add(taskId);
      } else {
        updatedSet.delete(taskId);
      }
      return updatedSet;
    });
  };

  // Handle selecting all tasks
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allTaskIds = tasks.map((task) => task.id);
      setSelectedTasks(new Set(allTaskIds));
    } else {
      setSelectedTasks(new Set());
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when changing rows per page
  };

  const formatDueDate = (dueDate) => {
    const now = dayjs();

    if (dueDate) {
      const localDueDate = dayjs.utc(dueDate).local();
      const daysRemaining = localDueDate.diff(now, "day");

      if (daysRemaining > 14 || daysRemaining < -3) {
        return localDueDate.format("DD/MM/YYYY");
      }

      if (daysRemaining > 0) return `In ${daysRemaining} days`;
      if (daysRemaining === 0) {
        if (now.diff(localDueDate, "second") < 60) {
          return "Just now";
        } else {
          return "Today";
        }
      }
      return `${Math.abs(daysRemaining)} days ago`;
    }
    return "N/A";
  };

  const isTaskOverdue = (dueDate) => {
    if (!dueDate) return false;
    const now = dayjs();
    const localDueDate = dayjs.utc(dueDate).local();
    return localDueDate.isBefore(now, "day");
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Checkbox
                  indeterminate={
                    selectedTasks.size > 0 && selectedTasks.size < tasks.length
                  }
                  checked={selectedTasks.size === tasks.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Client Name</TableCell>
              <TableCell>Email Address</TableCell>
              <TableCell>Task Due</TableCell>
              <TableCell>Response</TableCell>
              <TableCell>Follow-ups</TableCell>
              <TableCell>Last Follow-up Sent</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks
              .filter((task) => showCompleted || task.status !== "done") // Filter tasks
              .map((task) => (
                <TableRow
                  key={task.id}
                  style={{
                    backgroundColor: task.status === "done" ? "#f0f0f0" : isTaskOverdue(task.due_date) ? "#ffcccc" : "white",
                  }}
                  hover
                  onClick={() => showTask(task)}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        handleTaskSelection(task.id, e.target.checked)
                      }
                    />
                  </TableCell>
                  <TableCell>{task.client?.contactPersonName || "Unknown"}</TableCell>
                  <TableCell>{task.client?.email || "Unknown"}</TableCell>
                  <TableCell
                    style={{
                      fontWeight: task.status !== "done" && isTaskOverdue(task.due_date) ? "bold" : "normal",
                    }}
                  >
                    {formatDueDate(task.due_date)}
                  </TableCell>
                  <TableCell>{task.data.response || "N/A"}</TableCell>
                  <TableCell>{task.data.followup_count || 0}</TableCell>
                  <TableCell>{formatDueDate(task.data.last_followup_date) || "N/A"}</TableCell>

                  {task.status === "done" ? (
                    <TableCell>Completed</TableCell>
                  ) : (
                    <TableCell>
                      <Tooltip title="Complete Task">
                        <IconButton
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirmDialog(task.id);
                          }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Record client response">
                        <IconButton
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUpdateDialog(task.id);
                          }}
                        >
                          <RuleOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Send Follow-up Email">
                        <IconButton
                          color="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskActionClick(task.id);
                          }}
                        >
                          <MailIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={tasks.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]} // Options for rows per page
      />
    </>
  );
};

export default CampaignTaskList;