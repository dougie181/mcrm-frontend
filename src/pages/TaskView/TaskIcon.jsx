import React from "react";
import EmailIcon from "@mui/icons-material/Email";
import MeetingIcon from "@mui/icons-material/MeetingRoom";
import CallIcon from "@mui/icons-material/Call";
import ReviewIcon from "@mui/icons-material/RateReview";
import CampaignIcon from "@mui/icons-material/Campaign";
import AssignmentIcon from "@mui/icons-material/Assignment";

//import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
//import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";

const TaskIcon = ( { type } ) => {
  //console.log("TaskIcon type: ", type)
  switch (type) {
    case "email":
      return <EmailIcon style={{ marginRight: "10px" }} />;
    case "meeting":
      return <MeetingIcon style={{ marginRight: "10px" }} />;
    case "call":
      return <CallIcon style={{ marginRight: "10px" }} />;
    case "review":
      return <ReviewIcon style={{ marginRight: "10px" }} />;
    case "campaign":
      return <CampaignIcon style={{ marginRight: "10px" }} />;
    default:
      return <AssignmentIcon style={{ marginRight: "10px" }} />;
  }
};

export default TaskIcon;