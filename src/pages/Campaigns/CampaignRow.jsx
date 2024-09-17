import React, { useState } from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  Popover,
  Button,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import { styled } from "@mui/system";
import { tooltipClasses } from '@mui/material/Tooltip';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BarChartIcon from '@mui/icons-material/BarChart';
import CopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';

// Set the edit available setting
const editAvailableForAllRows = true;

const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#fff',
    color: '#000',
    maxWidth: 350,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
    boxShadow: theme.shadows[1],
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: '#fff',
  },
}));

const CampaignRow = ({
  campaign,
  handleEdit,
  handleViewStats,
  handleDuplicateCampaignInitiate,
  initiateDelete,
  toggleFavourite,
  handleSaveCampaign,
}) => {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editValues, setEditValues] = useState({ name: campaign.name, description: campaign.description || "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditValues({
      ...editValues,
      [name]: value,
    });
  };

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setPopoverOpen(false);
    setEditValues({ name: campaign.name, description: campaign.description || "" });
  };

  const saveChanges = () => {
    handleSaveCampaign(campaign.id, editValues);  // Call the function to save changes
    setPopoverOpen(false);
  };

  const convertToLocalTime = (utcDateString) => {
    const options = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };
    return new Date(utcDateString + "Z").toLocaleString(undefined, options);
  };

  const renderCriteriaTooltip = (params) => {
    const criteria = transformCriteria(params);
    return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell style={{ fontWeight: 'bold' }}>Criteria</TableCell>
            <TableCell style={{ fontWeight: 'bold' }}>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {criteria.map(([key, value], index) => (
            <TableRow key={index}>
              <TableCell>{key}</TableCell>
              <TableCell>{Array.isArray(value) ? value.join(", ") : value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const transformCriteria = (params) => {
    if (!params) return [];

    const parsedParams = JSON.parse(params);
    return Object.entries(parsedParams)
      .filter(([key]) => !key.endsWith('_ids'))
      .map(([key, value]) => {
        if (key === 'searchTerm_param') key = 'searchTerm';
        return [key, value];
      });
  };

  const truncateText = (text, maxLength) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const canEdit = editAvailableForAllRows || campaign.status === "completed";

  return (
    <TableRow>
      <TableCell>
        <IconButton onClick={() => toggleFavourite(campaign.id)}>
          {campaign.favourite ? (
            <StarIcon style={{ color: "gold" }} />
          ) : (
            <StarBorderIcon />
          )}
        </IconButton>
      </TableCell>
      <TableCell
        component="th"
        scope="row"
        onClick={canEdit ? handlePopoverOpen : undefined}
        style={{ cursor: canEdit ? 'pointer' : 'default' }}
      >
        {campaign.name}
        {campaign.hasAttachments > 0 && (
          <Tooltip title="Has Attachments">
            <IconButton size="small">
              <AttachFileIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {campaign.params && (
          <CustomTooltip
            title={renderCriteriaTooltip(campaign.params)}
            placement="top"
            arrow
          >
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </CustomTooltip>
        )}
      </TableCell>

      <TableCell
        onClick={canEdit ? handlePopoverOpen : undefined}
        style={{ cursor: canEdit ? 'pointer' : 'default' }}
      >
        <Tooltip title={campaign.description || ""} placement="top">
          <span>{truncateText(campaign.description || "...", 30)}</span>
        </Tooltip>
      </TableCell>

      <TableCell>
        {convertToLocalTime(campaign.created_date)}
      </TableCell>
      {campaign.status === "completed" && campaign.start_date ? (
        <TableCell>
          {convertToLocalTime(campaign.start_date)}
        </TableCell>
      ) : (
        <>
          <TableCell>{campaign.step}</TableCell>
          <TableCell>{""}</TableCell>
        </>
      )}
      <TableCell>
        {campaign.status === "completed" ? (
          <>
            <Tooltip title="View Stats">
              <IconButton
                onClick={() => handleViewStats(campaign.id)}
                color="primary"
              >
                <BarChartIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Duplicate Campaign">
              <IconButton
                onClick={() => handleDuplicateCampaignInitiate(campaign.id)}
                color="primary"
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip title="Edit">
              <IconButton
                onClick={() => handleEdit(campaign.id, campaign.currentStep)}
                color="primary"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={() => initiateDelete(campaign.id)}
                color="secondary"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </TableCell>

      <Popover
        open={isPopoverOpen}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <div style={{ padding: 16, maxWidth: 450 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Edit campaign name and description
            </Typography>
            <IconButton onClick={handlePopoverClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          <TextField
            label="Name"
            name="name"
            value={editValues.name}
            onChange={handleInputChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Description"
            name="description"
            value={editValues.description}
            onChange={handleInputChange}
            fullWidth
            margin="dense"
            multiline
            rows={4}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
            <Button variant="contained" color="primary" onClick={saveChanges} style={{ marginRight: 8 }}>
              Save
            </Button>
            <Button variant="outlined" color="secondary" onClick={handlePopoverClose}>
              Cancel
            </Button>
          </Box>
        </div>
      </Popover>
    </TableRow>
  );
};

export default CampaignRow;