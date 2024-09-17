import React from "react";
import { NavLink } from "react-router-dom"; 
import { Button, Badge, Tooltip } from "@mui/material"; 
import NotificationsIcon from "@mui/icons-material/Notifications";

const RepliesAvailableCounter = ({ counter }) => {
  return counter > 0 ? (
    <Tooltip title="New client messages received"> 
      <Button
        color="inherit"
        component={NavLink}
        to="/reports"
        className="notifications"
      >
        <Badge badgeContent={counter} color="error">
          <NotificationsIcon />
        </Badge>
      </Button>
    </Tooltip>
  ) : null;
};

export default RepliesAvailableCounter;