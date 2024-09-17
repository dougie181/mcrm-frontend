import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ImportHistory from "./ImportHistory";

import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Button,
} from "@mui/material";

const ImportData = () => {
  const location = useLocation();
	const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const showBackButton = searchParams.has("showBackButton");

	const onHandleBackClick = () => {
    navigate(-1);
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
            {showBackButton && (
              <Button variant="outlined" onClick={onHandleBackClick}>
                Back
              </Button>
            )}{" "}
            Data import
          </Typography>
          <Link to="/import-data/start">
            <Button variant="contained" color="primary">
              Start Import
            </Button>
          </Link>
        </Box>

        <Box>
          <Card>
            {/* section */}
            <CardContent>
              <div style={{ marginTop: "50px" }}>
                <ImportHistory />
              </div>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default ImportData;
