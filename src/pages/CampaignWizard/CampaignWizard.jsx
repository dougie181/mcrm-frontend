import React, { useState, useEffect } from "react";
import FilterClients from "./FilterClients/FilterClients";
import SelectClients from "./SelectClients/SelectClients";
import CampaignDetails from "./CampaignDetails/CampaignDetails";
import TemplateSelection from "./EmailTemplate/TemplateSelection";
import Preview from "./Preview";
import EmailProcessing from "./EmailProcessing";
//import CampaignSamplePage from "./CampaignSamplePage";
import AddAttachments from "./AddAttachments/AddAttachments";
import { useParams } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance"; // Import the instance here
import CampaignEditor from "./CampaignEditor/CampaignEditor";
import Completed from './Completed';

const CampaignWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState(null);
  const { campaignId } = useParams();
  const [error, setError] = useState(null);

  const fetchCampaignData = async (id) => {
    const response = await axiosInstance.get(`/campaigns/${id}`);
    return response.data;
  };

  useEffect(() => {
    setLoading(true);
    if (campaignId) {
      setId(campaignId);
      fetchCampaignData(campaignId)
        .then((data) => {
          setCurrentStep(data.step);
          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to fetch campaign data");
          console.error(err);
        });
    } else {
      setLoading(false);
    }
  }, [campaignId]);

  const stepsConfig = [
    { component: CampaignDetails, title: "Create Campaign", label: "Details", subtitle: "Enter the subject and details for the campaign." },
		{ component: SelectClients, title: "Select Clients", label: "Select clients", subtitle: "Select a Query Template and the parameters to select those clients you wish to send the campaign email to." },
    { component: FilterClients, title: "Filter Clients", label: "Filter clients", subtitle: "Selectively remove those clients you wish to exclude from campaign email." },
    { component: TemplateSelection, title: "Template Selection", label: "Select Template", subtitle: "Choose a blank or predefined email template you want to use for your campaign." },
    { component: CampaignEditor, title: "Template and Placeholder rules", label: "Email Contents", subtitle: "Edit your email template and the rules to replace the placeholder content." },
		{ component: AddAttachments, title: "Add Attachments", label: "Attachments", subtitle: "Add any attachments to be included in the email campaign" },
    { component: Preview, title: "Customise & Preview Email", label: "Preview", subtitle: "Choose a header and footer for your email template. You can preview different combinations before finalizing your template." },
    { component: EmailProcessing, title: "Email Processing", label: "Send emails", subtitle: "Your campaign emails are being sent out." },
    { component: Completed, title: "Completed",label: "Completed", subtitle: "This campaign has been completed" },
  ];

  const renderStep = (StepComponent, stepNumber) => {
    //console.log("renderStep: ", stepNumber);
    return (
      <StepComponent
        stepsData={stepsConfig}
        setCurrentStep={setCurrentStep}
        id={id}
        setId={setId}
        stepNumber={stepNumber}
      />
    );
  };

  return loading ? (
    <div>Loading...</div>
  ) : error ? (
    <div>{error}</div>
  ) : (
    <>
      {stepsConfig.map((step, index) =>
        currentStep === index + 1 ? (
          <div key={index}>{renderStep(step.component, index + 1)}</div>
        ) : null
      )}
    </>
  );
};

export default CampaignWizard;