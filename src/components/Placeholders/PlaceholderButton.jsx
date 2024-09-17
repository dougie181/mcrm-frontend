import React from "react";
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Button,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

const ButtonOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "callme", label: "Call Me" },
];

const PlaceholderButton = ({
  buttonData,
  setButtonData,
  setIsDirty,
}) => {

  const handleRemoveButton = (index) => {
    setIsDirty(true);
    const newButtonData = [...buttonData];
    newButtonData.splice(index, 1);
    setButtonData(newButtonData);
  };

  return (
    <>
      {buttonData.map((button, index) => (
        <Grid container spacing={2} key={index} alignItems="center" wrap="wrap" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id={`button-name-select-label-${index}`}>
                Option
              </InputLabel>
              <Select
                labelId={`button-name-select-label-${index}`}
                value={button.button_name}
                onChange={(event) => {
                  setIsDirty(true);
                  const newButtonData = [...buttonData];
                  newButtonData[index].button_name = event.target.value;
                  setButtonData(newButtonData);
                }}
              >
                {ButtonOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={7}>
            <TextField
              label="Text"
              fullWidth
              value={button.text}
              onChange={(event) => {
                setIsDirty(true);
                const newButtonData = [...buttonData];
                newButtonData[index].text = event.target.value;
                setButtonData(newButtonData);
              }}
            />
          </Grid>
          <Grid item xs={12} sm={1} display="flex" justifyContent="center">
            <IconButton
              color="secondary"
              onClick={() => handleRemoveButton(index)}
            >
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}
      {buttonData.length < 3 && (
        <Button
          sx={{ marginTop: 2 }}
          variant="contained"
          onClick={() => {
            setIsDirty(true);
            setButtonData([...buttonData, { button_name: "", text: "" }]);
          }}
        >
          Add Button
        </Button>
      )}
    </>
  );
};

export default PlaceholderButton;
