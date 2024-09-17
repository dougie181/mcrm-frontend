import React, { createContext, useContext, useState, useCallback } from "react";
import axiosInstance from "../services/axiosInstance";

const CountersContext = createContext();

export const useCounters = () => useContext(CountersContext);

export const CountersProvider = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [clientReplyCount, setClientReplyCount] = useState(0);

  const fetchNotificationCount = async () => {
    try {
      const response = await axiosInstance.get("/tasks/campaign/count");
      setNotificationCount(response.data.count);
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  };

  const checkClientReplies = async () => {
    try {
      const response = await axiosInstance.get("/events/tobeprocessed");
      setClientReplyCount(response.data.unprocessed_events_count);
    } catch (error) {
      console.error("Error fetching client replies:", error);
    }
  };

  // Debounced recalculateCounters
  const recalculateCounters = useCallback(
    async () => {
      console.log("Recalculating counters asynchronously");
      // Perform these asynchronously and independently from the rest of the UI
      setTimeout(async () => {
        await fetchNotificationCount();
        await checkClientReplies();
      }, 500); // Delay to allow other UI interactions to finish
    },
    [] // Empty dependency array to avoid re-creating the function unnecessarily
  );

  return (
    <CountersContext.Provider
      value={{
        notificationCount,
        clientReplyCount,
        recalculateCounters,
      }}
    >
      {children}
    </CountersContext.Provider>
  );
};