import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
	List, ListItem, ListItemText
} from "@mui/material";
import axiosInstance from "../../services/axiosInstance";

const EmailRecords = ({ clientId }) => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    // Fetch the email records here using the clientId
    axiosInstance
      .get(`/email_records/client/${clientId}`)
      .then((response) => {
        //console.log("response.data: ", response.data);
        setRecords(response.data);
      })
      .catch((error) => {
        console.error("Error fetching email records:", error);
      });
  }, [clientId]);

  // Function to format datetime to local time
  const formatToLocalTime = (dateTimeString) => {
    const dateTime = new Date(dateTimeString);
    return dateTime.toLocaleString();
  };

  return (
    <CardContent>
      <Box my={1}>
        <Typography variant="h5" gutterBottom>
          Sent email history
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>To Address</TableCell>
              <TableCell>Date Time Sent</TableCell>
              <TableCell>Email Body Link</TableCell>
              <TableCell>Attachments Link</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.slice().reverse().map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.type === "campaign" ? "Campaign" : "Direct"}</TableCell>
                <TableCell>{record.subject}</TableCell>
                <TableCell>{record.to_address}</TableCell>
                <TableCell>{formatToLocalTime(record.date_time_sent)}</TableCell>
                <TableCell>
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL}/email_records/email_body/${record.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Email Body
                  </a>
                </TableCell>
                <TableCell>
                  {record.attachments_link &&
                  record.attachments_link.length > 0 ? (
                    <List dense={true}>
                      {JSON.parse(record.attachments_link).map((attachment) => (
                        <ListItem key={attachment.id}>
                          <ListItemText>
                            <a
                              href={`${import.meta.env.VITE_API_BASE_URL}/email_records/attachment/${record.id}/${attachment.id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {attachment.name}
                            </a>
                          </ListItemText>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    "None"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </CardContent>
  );
};

export default EmailRecords;
