import React, { useState, useEffect, Fragment } from 'react';
import axiosInstance from '../../services/axiosInstance';
import { useParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Container,
  Box,
  Card,
  CardContent,
  Button,
  Collapse,
  IconButton,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

const ImportChangeLog = () => {
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { importId } = useParams();

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const url = `/change_log/?import_id=${importId}`;
        console.log('url:', url);
        const response = await axiosInstance.get(url);
        setLogs(response.data);
      } catch (error) {
        console.error('There was an error fetching the logs!', error);
      }
      setIsLoading(false);
    };

    fetchLogs();
  }, [importId]);

  const handleToggleExpand = (accountId) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [accountId]: !prevExpanded[accountId],
    }));
  };

  const groupedLogs = logs.reduce((acc, log) => {
    const { account_id } = log;
    if (!acc[account_id]) {
      acc[account_id] = [];
    }
    acc[account_id].push(log);
    return acc;
  }, {});

  const onHandleBackClick = () => {
    window.history.back();
  };

  return (
    <Container maxWidth="lg">
      <Box p={2}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          marginBottom={2}
        >
          <Typography variant="h4">
            <Button variant="outlined" onClick={onHandleBackClick}>
              Back
            </Button>
          </Typography>
        </Box>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Change Logs
              </Typography>
              {isLoading && <Typography variant="body1">Loading...</Typography>}
              {!isLoading && logs.length === 0 && (
                <Typography variant="body1">
                  No change logs found for this import.
                </Typography>
              )}
              {!isLoading && logs.length > 0 && (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Account ID</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Field</TableCell>
                        <TableCell>Old Value</TableCell>
                        <TableCell>New Value</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(groupedLogs).map(([accountId, changes]) => (
                        <Fragment key={accountId}>
                          <TableRow>
                            <TableCell>{accountId}</TableCell>
                            <TableCell>
                              {changes.length === 1
                                ? changes[0].action
                                : 'Multiple changes'}
                            </TableCell>
                            <TableCell>
                              {changes.length === 1
                                ? changes[0].field
                                : `${changes.length} fields`}
                            </TableCell>
                            <TableCell>
                              {changes.length === 1
                                ? changes[0].old_value
                                : ''}
                            </TableCell>
                            <TableCell>
                              {changes.length === 1
                                ? changes[0].new_value
                                : ''}
                            </TableCell>
                            <TableCell>
                              {changes.length > 1 && (
                                <IconButton
                                  onClick={() => handleToggleExpand(accountId)}
                                  size="small"
                                >
                                  {expanded[accountId] ? (
                                    <ExpandLess />
                                  ) : (
                                    <ExpandMore />
                                  )}
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                          {changes.length > 1 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                style={{ paddingBottom: 0, paddingTop: 0 }}
                              >
                                <Collapse
                                  in={expanded[accountId]}
                                  timeout="auto"
                                  unmountOnExit
                                >
                                  <Box margin={1}>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Field</TableCell>
                                          <TableCell>Old Value</TableCell>
                                          <TableCell>New Value</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {changes.map((change) => (
                                          <TableRow key={change.id}>
                                            <TableCell>{change.field}</TableCell>
                                            <TableCell>{change.old_value}</TableCell>
                                            <TableCell>{change.new_value}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default ImportChangeLog;
