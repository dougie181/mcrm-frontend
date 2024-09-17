import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  Collapse,
  Box,
  IconButton,
  TableBody,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CampaignRow from "./CampaignRow";

const groupFriendlyNames = {
  draftAndReady: "Draft and Ready to Send",
  completedToday: "Sent Today",
  lastMonth: "Sent within last Month",
  lastThreeMonths: "Sent within last 3 Months",
  older: "Sent older than 3 Months",
};

const CampaignGroup = ({
  group,
  groupName,
  collapsedGroups,
  toggleGroup,
  handleEdit,
  handleViewStats,
  handleDuplicateCampaignInitiate,
  initiateDelete,
  toggleFavourite,
  handleSaveCampaign
}) => {
  return (
    <Table>
      <TableHead>
        <TableRow
          key={`group-header-${groupName}`}
          onClick={() => toggleGroup(groupName)}
          style={{ cursor: "pointer", backgroundColor: "#f5f5f5" }}
        >
          <TableCell colSpan={6}>
            <Box display="flex" alignItems="center">
              <IconButton
                aria-label="expand row"
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the row click from toggling twice
                  toggleGroup(groupName);
                }}
              >
                {collapsedGroups[groupName] ? (
                  <KeyboardArrowDownIcon />
                ) : (
                  <KeyboardArrowUpIcon />
                )}
              </IconButton>
              {groupFriendlyNames[groupName]}
            </Box>
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        <TableRow key={`group-collapse-${groupName}`}>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse
              in={!collapsedGroups[groupName]}
              timeout="auto"
              unmountOnExit
            >
              <Box margin={1}>
                <Table size="small" aria-label={groupName}>
                  <TableHead>
                    <TableRow key={`group-title-${groupName}`}>
                      <TableCell style={{ width: "1%" }} />
                      {groupName === "completedToday" ||
                      groupName === "lastMonth" ||
                      groupName === "lastThreeMonths" ||
                      groupName === "older" ? (
                        <>
                        <TableCell style={{ fontWeight: "bold", width: "19%" }}>
                          Name
                        </TableCell>
                        <TableCell style={{ fontWeight: "bold", width: "27%" }}>
                        Description
                      </TableCell>
                      </>
                      ) : (
                        <>
                        <TableCell style={{ fontWeight: "bold", width: "18%" }}>
                          Name
                        </TableCell>
                        <TableCell style={{ fontWeight: "bold", width: "25%" }}>
                        Description
                      </TableCell>
                      </>
                      )}
                      <TableCell style={{ fontWeight: "bold", width: "12%" }}>
                        Created
                      </TableCell>
                      {groupName === "completedToday" ||
                      groupName === "lastMonth" ||
                      groupName === "lastThreeMonths" ||
                      groupName === "older" ? (
                        <TableCell style={{ fontWeight: "bold", width: "12%" }}>
                          Sent
                        </TableCell>
                      ) : (
                        <>
                          <TableCell
                            style={{ fontWeight: "bold", width: "6%" }}
                          >
                            Step
                          </TableCell>
                          <TableCell
                            style={{ fontWeight: "bold", width: "5%" }}
                          ></TableCell>
                        </>
                      )}
                      {groupName === "completedToday" ||
                      groupName === "lastMonth" ||
                      groupName === "lastThreeMonths" ||
                      groupName === "older" ? (
                        <TableCell style={{ fontWeight: "bold", width: "10%" }}>
                          Actions
                        </TableCell>
                      ) : (
                        <TableCell style={{ fontWeight: "bold", width: "9%" }}>
                          Actions
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.map((campaign) => (
                      <CampaignRow
                        key={campaign.id}
                        campaign={campaign}
                        handleEdit={handleEdit}
                        handleViewStats={handleViewStats}
                        handleDuplicateCampaignInitiate={
                          handleDuplicateCampaignInitiate
                        }
                        initiateDelete={initiateDelete}
                        toggleFavourite={toggleFavourite}
                        handleSaveCampaign={handleSaveCampaign}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default CampaignGroup;
