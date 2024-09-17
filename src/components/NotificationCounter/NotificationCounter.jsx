import React from "react";
import { NavLink } from "react-router-dom";
import { Button, Badge, Tooltip } from "@mui/material";
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';

const NotificationCounter = ({ counter }) => {

  if (counter <= 0 || counter === null) {
    return null;
  }
  return (
    <Tooltip title="Overdue tasks">
        <Button
          color="inherit"
          component={NavLink}
          to="/reports"
          className="notifications"
        >
          <Badge badgeContent={counter} color="error">
            <WatchLaterOutlinedIcon />
          </Badge>
        </Button>
    </Tooltip>
  )
};

export default NotificationCounter;