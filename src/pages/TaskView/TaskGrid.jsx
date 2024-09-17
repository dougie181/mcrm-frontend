import React from "react";
import {
  Paper,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const TaskGrid = ({ tasks }) => {

  console.log("tasks:", tasks);
  return (
    <Paper elevation={3}>
      <Typography
        variant="h6"
        style={{
          backgroundColor: "grey",
          color: "white",
          padding: "8px 16px",
        }}
      >
        Completed Tasks
      </Typography>
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={tasks}
          columns={[
            { field: "id", headerName: "ID", width: 70 },
            { field: "type", headerName: "Type", width: 150 },
            { field: "title", headerName: "Title", width: 200 },
            {
              field: "description",
              headerName: "Description",
              width: 350,
            },
            {
              field: "due_date",
              headerName: "Due Date",
              width: 150,
            },
            {
              field: "priority",
              headerName: "Priority",
              width: 150,
            },
          ]}
        />
      </div>
    </Paper>
  );
};

export default TaskGrid;
