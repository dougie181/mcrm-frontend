import React, {useState} from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";
import TablePagination from "@mui/material/TablePagination";

const SearchResults = ({ loadingClients, clients }) => {
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	
	return(
		<Box mt={4}>
			<Typography variant="h6">Search Results</Typography>
			<Typography variant="h6">{`Number of Records: ${clients.length}`}</Typography>
			{loadingClients ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ marginTop: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Firstname</TableCell>
                    <TableCell>Surname</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>RiskProfile</TableCell>
                    <TableCell>soa Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.id}</TableCell>
                        <TableCell>{client.contactPersonFirstName}</TableCell>
                        <TableCell>{client.contactPersonSurname}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.riskProfile}</TableCell>

                        <TableCell>{client.soaDate}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={clients.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </TableContainer>
          )}
		</Box>
	);
};

export default SearchResults;
