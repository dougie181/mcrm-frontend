import React, { useState, useEffect } from "react";
import CampaignWizardNavigation from "../Navigation/CampaignWizardNavigation";
import RenderInputControl from "../../../components/RenderImportControl/RenderInputControl";
import QueryBuilderResults from "../../../components/RenderImportControl/QueryBuilderResults";
import { useSnackbar } from '../../../context/SnackbarContext';

import {
  Box,
  Typography,
  Container,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
} from "@mui/material";
import axiosInstance from "../../../services/axiosInstance";
import CircularProgress from "@mui/material/CircularProgress";

const SelectClients = ({
  stepsData,
  setCurrentStep,
  id,
  setId,
  stepNumber,
}) => {
  const [clients, setClients] = useState([]);
  const [sqlTemplates, setSqlTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [parameters, setParameters] = useState([]);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [hasRunQuery, setHasRunQuery] = useState(false);
  const [selectedTemplateDescription, setSelectedTemplateDescription] =
    useState("");
  const [loadingClients, setLoadingClients] = useState(false);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchCampaignData = async () => {
      // Assuming `id` is the campaign ID
      if (id) {
        const campaignResponse = await axiosInstance.get(`/campaigns/${id}`);
        const campaignData = campaignResponse.data;
        // log the campaignData as a nicely formatted json string
        //console.log("campaignData: ", JSON.stringify(campaignData, null, 2));

        if (campaignData && campaignData.sql_template_id) {
          setSelectedTemplateId(campaignData.sql_template_id);
          setValues(campaignData.params ? JSON.parse(campaignData.params) : {});

          // Initial fetch of SQL templates
          const templatesResponse = await axiosInstance.get("/queries/list");
          let templates = templatesResponse.data;

          // Check if the selected template from the campaign is in the fetched list
          let specificTemplateNeeded = !templates.some(
            (template) => template.id === campaignData.sql_template_id
          );

          if (specificTemplateNeeded) {
            // Fetch specific template version if it's not in the list
            const specificTemplateResponse = await axiosInstance.get(
              `/queries/${campaignData.sql_template_id}`
            );
            const specificTemplate = specificTemplateResponse.data;

            // Append or prepend the specific template to the templates list
            templates = [specificTemplate, ...templates];
          }

          // Sort templates by name and then by version (descending order)
          templates.sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return b.version - a.version;
          });
          //console.log("templates: ", templates);

          // Group templates by name
          const groupedTemplates = templates.reduce((acc, template) => {
            (acc[template.key] = acc[template.key] || []).push(template);
            return acc;
          }, {});

          // Mark each template as "(old version)" or "(newer version)"
          Object.values(groupedTemplates).flatMap(
            (group) => {
              if (group.length === 1) {
                return group; // If only one version exists, no need to append anything.
              } else {
                // Mark all but the last (highest version) as "(old version)"
                group
                  .slice(0, -1)
                  .forEach(
                    (template) =>
                      (template.name = `${template.name} (new version)`)
                  );
                // Mark the last one as "(latest)"
                group[group.length - 1].name = `${
                  group[group.length - 1].name
                } (old version)`;
                return group;
              }
            }
          );

          setSqlTemplates(templates);

          // Fetch parameters for the template
          fetchQueryParameters(campaignData.sql_template_id);
        } else {
          const fetchSQLTemplates = async () => {
            try {
              const templatesResponse = await axiosInstance.get(
                "/queries/list"
              );
              let templates = templatesResponse.data;

              // Sort templates by name and then by version (descending order)
              templates.sort((a, b) => {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return b.version - a.version;
              });

              setSqlTemplates(templates);
            } catch (error) {
              showSnackbar ("Error fetching SQL templates","error");
              console.error("Error fetching SQL templates:", error);
            }
          };
          fetchSQLTemplates();
        }
      }
    };

    fetchCampaignData();
  }, [id, showSnackbar]); // Include other dependencies as necessary

  const fetchQueryParameters = async (templateId) => {
    try {
      const response = await axiosInstance.get(`/queries/${templateId}`);
      let fetchedParameters = JSON.parse(response.data.params || "[]");
      // log the fetched parameters as a nicely formatted json string
      //console.log("fetchedParameters: ", JSON.stringify(fetchedParameters, null, 2));
      
      // Initialize an object to hold the default values for all parameters
      let initialValues = {};

      // Map through parameters to fetch options for those that need it
      fetchedParameters = await Promise.all(
        fetchedParameters.map(async (param) => {
          if (param.type === "boolean") {
            initialValues[param.name] = param.value || false; // Set default value for boolean parameters
          }
          if (
            ["dropdown", "autocomplete", "multi-select"].includes(param.type) &&
            param.source === "api"
          ) {
            try {
              const optionsResponse = await axiosInstance.get(
                param.apiEndpoint
              );
              param.options = optionsResponse.data; // Attach fetched options
            } catch (error) {
              console.error(
                "Error fetching options for parameter:",
                param.name,
                error
              );
              param.options = []; // Ensure options are an empty array if fetch fails
            }
          }
          return param;
        })
      );

      setParameters(fetchedParameters);

      // Merge initialValues with the existing values to ensure all parameters
      // have an explicit value, especially for boolean parameters to be included when unchecked
      setValues((prevValues) => ({ ...initialValues, ...prevValues }));
    } catch (error) {
      console.error("Error fetching query parameters:", error);
      setParameters([]); // Reset parameters on error
    }
  };

  const handleTemplateChange = async (event) => {
    const templateId = event.target.value;
    const selectedTemplate = sqlTemplates.find(
      (template) => template.id === templateId
    );

    // Reset parameters and values before setting the new template ID
    setParameters([]);
    setValues({});
    setErrors({});

    setSelectedTemplateId(templateId);
    setSelectedTemplateDescription(
      selectedTemplate ? selectedTemplate.description : ""
    );
    await fetchQueryParameters(templateId); // This fetches new parameters based on the selected template
  };

  const validateQueryValues = (values, parameters) => {
    const newErrors = {};
    let isValid = true;

    parameters.forEach((param) => {
      
      if (param.type === "boolean") {                   // For boolean parameters, check if the value is explicitly set (true or false is acceptable)
        if (values[param.name] === undefined) {
          newErrors[param.name] = "This field is required";
          isValid = false;
        }
      } else if (param.type === "search") {             // For search parameters, check if the value_param is not set or empty
        if (!values[`${param.name}_param`]) {
          newErrors[param.name] = "This field is required";
          isValid = false;
        }
      } else {
        if (!values[param.name]) {                      // otherwise, check if the value is not set or empty
          newErrors[param.name] = "This field is required";
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleFetchClients = async () => {
    if (!validateQueryValues(values, parameters)) {
      //alert("Please fill in all required fields.");
      return;
    }
    setLoadingClients(true);
    const testFilters = {  
      "filters": [
        {
          "type": "exclude_column_value",
          "params": {
            "column": "contactPersonFirstName",
            "operator": "!=",
            "value": "Abdul"
          },
          "order": 1
        },
        {
          "type": "exclude_column_value",
          "params": {
            "column": "contactPersonFirstName",
            "operator": "!=",
            "value": "Abbot"
          },
          "order": 2
        },
        {
          "type": "exclude_column_value",
          "params": {
            "column": "contactPersonFirstName",
            "operator": "!=",
            "value": "Alfonso"
          },
          "order": 3
        },
        {
          "type": "manual_exclusions",
          "params": {
            "client_ids": [1387, 1772, 1651, 699, 263, 115]
          },
          "order": 4
        },
        {
          "type": "exclude_previous_campaigns",
          "params": {
            "campaign_ids": [ 10 ]
          },
          "order": 5
        }
      ]
    };
    const testFilters2 = {
      'filters': [
        {
          'type': 'exclude_previous_campaigns', 
          'params': {
            'column': '',
           'operator': '', 
           'value': '', 
           'campaign_ids': ['10']
        }, 
        'order': 2}
      ]};
      
    try {
      const response = await axiosInstance.post(
        `/queries/run/${selectedTemplateId}`,
        { 
          queryValues: values,
          // applyFilters: true,
          // filters: testFilters
        }
      );
      setClients(response.data);
      setHasRunQuery(true);
    } catch (error) {
      console.error("Error fetching clients:", error);
      showSnackbar(error.response.data.message || "Error fetching clients: " + error.message, "error");
    } finally {
      setLoadingClients(false);
    }
  };

  const handleNext = async () => {
    if (!validateQueryValues(values, parameters)) {
      showSnackbar("Please correct the errors before proceeding.", "info");
      return;
    }
    await saveCampaign();
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleStepButtonClick = (step) => {
    //console.log("click", step);
    setCurrentStep(step);
  };

  const saveCampaign = async () => {
    const campaignData = {
      step: stepNumber + 1,
      sql_template_id: selectedTemplateId,
      params: JSON.stringify(values),
    };

    if (id) {
      await axiosInstance.put(`/campaigns/${id}`, campaignData);
    } else {
      console.error("error: no campaign id");
    }
  };

  // the param has changed, so need to clear the error on the specific param
  const clearErrorOnParam = (paramName) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      newErrors[paramName] = "";
      return newErrors;
    });
  };

  return (
    <Container maxWidth="lg">
      <Box textAlign="center" my={4}>
        <CampaignWizardNavigation
          stepsData={stepsData}
          stepNumber={stepNumber}
          onClickBack={handleBack}
          onClickNext={handleNext}
          onStepClick={handleStepButtonClick}
        />

        <Box mt={4}>
          <Typography variant="h6">Select SQL Template</Typography>
          <FormControl fullWidth variant="outlined">
            <InputLabel htmlFor="sql-template">SQL Template</InputLabel>
            {sqlTemplates.length > 0 && (
              <Select
                value={selectedTemplateId}
                onChange={handleTemplateChange}
                label="SQL Template"
                inputProps={{
                  name: "sql-template",
                  id: "sql-template",
                }}
                sx={{ textAlign: 'left', '.MuiSelect-select': { alignItems: 'flex-start' } }} // This style ensures the text aligns to the left
              >
                {sqlTemplates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {`${template.name}`}
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>
          {selectedTemplateDescription && (
            <Typography variant="body2" sx={{ textAlign: 'left' }} style={{ marginTop: "8px" }}>
              {selectedTemplateDescription}
            </Typography>
          )}
        </Box>
        {selectedTemplateId && (
          <Box mt={4}>
            <Typography variant="h6">Fill Parameters</Typography>
            <Grid container spacing={2} alignItems="center">
              {parameters.map((param, index) => (
                <Grid key={index} item xs={6}>
                  <Box key={index} marginBottom={2}>
                    <RenderInputControl
                      param={param}
                      index={index}
                      values={values}
                      setValues={setValues}
                      error={errors[param.name]}
                      clearErrorOnParam={clearErrorOnParam}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box marginBottom={3} display="flex" alignItems="center">
              <Button
                variant="contained"
                color="primary"
                onClick={handleFetchClients}
              >
                Test Query
              </Button>
              {hasRunQuery && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  style={{ marginLeft: "20px", marginBottom: "0px" }}
                >
                  {clients.length} records found.
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Box mt={4}>
          {loadingClients && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress />
            </Box>
          )}
          {clients.length > 0 && (
            <>
              <Divider style={{ marginBottom: "20px" }} />
              <QueryBuilderResults
                displayedColumns={Object.keys(clients[0])}
                results={clients}
              />
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default SelectClients;
