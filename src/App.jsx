import React, { Suspense, useEffect, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme, Paper, Box } from "@mui/material";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { SearchProvider } from "./context/SearchContext";
import { SnackbarProvider } from './context/SnackbarContext';
import { CountersProvider } from './context/CountersContext';  // Import CountersProvider
import { useCounters } from './context/CountersContext';  // Import useCounters hook
import axiosInstance from "./services/axiosInstance";
import axios from "axios";

import Navbar from "./components/Navbar/Navbar";
import HomePage from "./pages/HomePage/HomePage";
import Campaigns from "./pages/Campaigns/Campaigns";
import Settings from "./pages/Settings/Settings";
import EmailTemplates from "./pages/EmailTemplates/EmailTemplates";
import ReportsPage from "./pages/Reports/ReportsPage";
import SetupForm from "./components/SetupForm/SetupForm";
import ChecklistWizard from "./pages/ChecklistWizard/CheckListWizard";
import LoginPage from "./components/Auth/Login";
import LoginSuccess from "./components/Auth/LoginSuccess";
import LogoutSuccess from "./components/Auth/LogoutSuccess";
import ImportChangeLog from "./pages/ImportData/ImportChangeLog";
import Callback from "./components/Auth/Callback";
import { Typography, Container, CircularProgress } from "@mui/material";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { AuthProvider } from './context/AuthContext';
import NetworkErrorPage from "./pages/NetworkError/NetworkError";
import SnackbarComponent from './components/SnackBar/SnackbarComponent';

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#333",
    },
  },
});

const App = () => {
  const [isInitialisationComplete, setIsInitialisationComplete] = useState(null);
  const [isChecklistDone, setChecklistDone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [apiError, setApiError] = useState(null);
  const [networkError, setNetworkError] = useState(false);

  const { notificationCount, clientReplyCount, recalculateCounters } = useCounters(); // Use counters and recalculate function from context

  const Clients = React.lazy(() => import('./pages/Clients/Clients'));
  const ClientDetails = React.lazy(() => import('./pages/ClientDetails/ClientDetails'));
  const ImportData = React.lazy(() => import('./pages/ImportData/ImportData'));
  const StartImport = React.lazy(() => import('./pages/ImportData/StartImport'));
  const TaskView = React.lazy(() => import('./pages/TaskView/TaskView'));
  const CampaignTaskView = React.lazy(() => import('./pages/TaskView/CampaignTaskView'));
  const CampaignEmailTask = React.lazy(() => import('./pages/TaskView/CampaignEmailTask'));
  const EmailTask = React.lazy(() => import('./pages/TaskView/EmailTask'));
  const CallTask = React.lazy(() => import('./pages/TaskView/CallTask'));
  const OtherTask = React.lazy(() => import('./pages/TaskView/OtherTask'));
  const QueryBuilderTool = React.lazy(() => import('./pages/QueryBuilderTool/QueryBuilderTool'));
  const QueryTemplateList = React.lazy(() => import('./pages/QueryBuilderTool/QueryTemplateList'));
  const QueryBuilderView = React.lazy(() => import('./pages/QueryBuilderTool/QueryBuilderView'));
  const QueryBuilderImport = React.lazy(() => import('./pages/QueryBuilderTool/QueryBuilderImport'));
  const AssetMapping = React.lazy(() => import('./pages/AssetMaintenance/AssetMapping'));
  const AssetAllocation = React.lazy(() => import('./pages/AssetMaintenance/AssetAllocation'));
  const LookupValues = React.lazy(() => import('./pages/Settings/LookupValues'));

  const CampaignWizard = React.lazy(() => import('./pages/CampaignWizard/CampaignWizard'));

  const navigate = useNavigate();

  useEffect(() => {
    const initialiseApp = async () => {
      setIsLoading(true);

      try {
        const setupResponse = await axiosInstance.get("/setup/check");
        setIsInitialisationComplete(setupResponse.data.setup_complete);

        if (setupResponse.data.setup_complete) {
          const checklistResponse = await axiosInstance.get("/checklist/done");
          setChecklistDone(checklistResponse.data.done);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
          setNetworkError(true);
        } else {
          setApiError("An error occurred during app initialization. Please contact support.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initialiseApp();
  }, [refreshTrigger]);

  useEffect(() => {
    recalculateCounters(); // Recalculate counters when the component mounts
    const intervalId = setInterval(() => {
      recalculateCounters(); // Poll every 60 seconds
    }, 60000);
  
    return () => clearInterval(intervalId); // Clean up interval on unmount
  }, [recalculateCounters]);

  const forceRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <Container
        component="main"
        maxWidth="xs"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (networkError) {
    return (
      <Container maxWidth="sm">
        <Box textAlign="center" my={5}>
          <Typography variant="h4" gutterBottom>
            Network Error
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Unfortunately, it seems like the backend API has stopped working.
          </Typography>
          <Typography variant="body1" gutterBottom>
            This could be due to a network issue or the server being down. Please
            try restarting the application. If the problem persists, contact
            support.
          </Typography>
        </Box>
      </Container>
    );
  }

  if (apiError) {
    return (
      <Container
        component="main"
        maxWidth="xs"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Paper>
          <Typography
            variant="h6"
            style={{
              textAlign: "center",
              border: "1px solid gray",
              padding: "30px",
              margin: "20px",
              borderRadius: "5px",
            }}
          >
            {apiError}
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!isInitialisationComplete) {
    return <SetupForm />;
  }

  return (
    <>
      <Navbar navigate={navigate}/>
      <Suspense fallback={<CircularProgress />}>
        <Routes>
          <Route path="/" element={<HomePage key={isChecklistDone} isChecklistDone={isChecklistDone} />} />
          <Route path="/login/success" element={<LoginSuccess />} />
          <Route path="/logout/success" element={<LogoutSuccess />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/client-details/:id" element={<ClientDetails />} />
          <Route path="/import-data" element={<ImportData />} />
          <Route path="/import-data/start" element={<StartImport />} />
          <Route path="/import-data/change-log/:importId" element={<ImportChangeLog />} />
          <Route path="/email_templates" element={<EmailTemplates />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaign/new" element={<CampaignWizard />} />
          <Route path="/campaign/:campaignId" element={<CampaignWizard />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/query-builder" element={<QueryTemplateList />} />
          <Route path="/query-builder/new" element={<QueryBuilderTool />} />
          <Route path="/query-builder/import" element={<QueryBuilderImport />} />
          <Route path="/query-builder/:templateId" element={<QueryBuilderTool />} />
          <Route path="/query-builder/view/:templateId" element={<QueryBuilderView />} />

          <Route path="/campaign-tasks" element={<CampaignTaskView />} />
          <Route path="/campaign-tasks/campaign-email-task" element={<CampaignEmailTask />} />
          
          <Route path="/tasks" element={<TaskView />} />
          <Route path="/tasks/email-task" element={<EmailTask />} />
          <Route path="/tasks/call-task" element={<CallTask />} />
          <Route path="/tasks/other-task" element={<OtherTask />} />
          
          <Route path="/settings" element={<Settings />} />
          <Route path="/checklist" element={<ChecklistWizard forceRefresh={forceRefresh} />} />
          <Route path='/network_error' element={<NetworkErrorPage />} />
          <Route path="/asset-maintenance/mapping" element={<AssetMapping />} />
          <Route path="/asset-maintenance/allocation" element={<AssetAllocation />} />
          <Route path="/settings/lookup-values" element={<LookupValues />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

const AppWrapper = () => {
  return (
    <SearchProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <SnackbarProvider>
              <CountersProvider>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
                <SnackbarComponent />
              </CountersProvider>
            </SnackbarProvider>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </SearchProvider>
  );
};

export default AppWrapper;
