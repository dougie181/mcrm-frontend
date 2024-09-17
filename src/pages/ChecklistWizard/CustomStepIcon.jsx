import React from "react";

const CustomStepIcon = (props) => {
  const { active, completed, icon } = props;

  // Function to convert index to alphabetical character (0 -> a, 1 -> b, ...)
  const indexToAlphabet = (index) => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    return alphabet[index % 26];
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: "50%",
        backgroundColor: completed ? "#4caf50" : active ? "#ff9800" : "#e0e0e0",
        color: completed ? "white" : active ? "white" : "black",
      }}
    >
      {typeof icon === "number" ? indexToAlphabet(icon - 1) : icon}
    </div>
  );
};

export default CustomStepIcon;
