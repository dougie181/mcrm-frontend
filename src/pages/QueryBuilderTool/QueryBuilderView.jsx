import React, { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Button,
  Box,
  Paper,
  Typography,
  Divider,
  Grid,
} from "@mui/material";
import QueryBuilderResults from "./QueryBuilderResults";
import RenderInputControl from "../../components/RenderImportControl/RenderInputControl";

const QueryBuilderView = () => {
  const { templateId } = useParams();
  const [values, setValues] = useState({});
  const [parameters, setParameters] = useState([]);
  const [results, setResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasRunQuery, setHasRunQuery] = useState(false);
  const [queryName, setQueryName] = useState("Query");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      try {
        const response = await axiosInstance.get(`/queries/${templateId}`);
        const fetchedParameters = JSON.parse(response.data.params) || [];

        setErrorMessage(null); // Clear any previous errors
        let initialValues = {};

        for (let param of fetchedParameters) {
          if (param.type === "boolean") {
            initialValues[param.name] = param.value || false;
            setValues(initialValues);          }

          if (
            (param.type === "dropdown" ||
              param.type === "autocomplete" ||
              param.type === "multi-select") &&
            param.source === "api"
          ) {
            try {
              const optionsResponse = await axiosInstance.get(
                param.apiEndpoint
              );
              param.options = optionsResponse.data; // Set the fetched options to param.options
            } catch (error) {
              console.error("Error fetching dropdown options:", error);
              setErrorMessage(
                error.response?.data?.message ||
                  "An error occurred while fetching dropdown options"
              );
            }
          }
        }

        setParameters(fetchedParameters);
        
        setQueryName(response.data.name);
      } catch (error) {
        console.error("Error fetching template details:", error);
        setErrorMessage(
          error.response?.data?.message ||
            "An error occurred while fetching template details"
        );
      }
    };

    fetchTemplateDetails();
  }, [templateId]);

  useEffect(() => {
    setResults([]); // Reset results and hasRunQuery if any parameter value changes
    setHasRunQuery(false);
  }, [values]);

  const handleRunQuery = async () => {
    const queryValues = { ...values};

    console.log("Running query with values:", queryValues);
    try {
      const response = await axiosInstance.post(`/queries/run/${templateId}`, {
        queryValues: values,
      });
      setResults(response.data);
      setErrorMessage(null); // Clear any previous errors
      setHasRunQuery(true);
    } catch (error) {
      console.error("Error:", error.response?.data || error);
      setErrorMessage(error.response?.data?.message || "An error occurred");
    }
  };

  const handleBackClick = () => {
    navigate("/query-builder");
  };

  return (
    <Container maxWidth="lg">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        marginBottom={3}
        marginTop={3}
      >
        <Typography variant="h5">SQL Template Testing & Viewing</Typography>
        <Button variant="outlined" onClick={handleBackClick}>
          Back
        </Button>
      </Box>

      <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
        {parameters.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              Input Parameters
            </Typography>
            <Divider style={{ marginBottom: "20px" }} />
            <Grid container spacing={2} alignItems="center">
              {parameters.map((param, index) => (
                <Grid key={index} item xs={6}>
                  <Box key={index} marginBottom={2}>
                    <RenderInputControl
                      param={param}
                      index={index}
                      values={values}
                      setValues={setValues}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <Box marginBottom={3} display="flex" alignItems="center">
          <Button variant="contained" color="primary" onClick={handleRunQuery}>
            Run Query
          </Button>
          {errorMessage && (
            <Typography
              variant="body2"
              color="error"
              style={{ marginLeft: "20px", marginBottom: "0px" }}
            >
              {errorMessage}
            </Typography>
          )}
          {hasRunQuery && !errorMessage && results.length > 0 && (
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ marginLeft: "20px", marginBottom: "0px" }}
            >
              {results.length} records found.
            </Typography>
          )}
        </Box>

        {results.length > 0 && (
          <>
            <Divider style={{ marginBottom: "20px" }} />
            <QueryBuilderResults
              displayedColumns={Object.keys(results[0])}
              results={results}
              queryName={queryName}
            />
          </>
        )}
      </Paper>
    </Container>
  );
};

export default QueryBuilderView;
