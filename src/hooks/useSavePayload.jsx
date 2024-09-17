import { useMemo } from "react";

const useSavePayload = (
  contentType,
  staticText,
  databaseTable,
  databaseField,
  calculatedValue,
  buttonData
) => {
  return useMemo(() => {
    let payload;
    switch (contentType) {
      case "static":
        payload = { content_type: "static", dynamic_data: `${staticText}` };
        break;
      case "table":
        payload = {
          content_type: "table",
          table_name: databaseTable,
          field_name: databaseField,
        };
        break;
      case "list":
        payload = {
          content_type: "list",
          table_name: databaseTable,
          field_name: databaseField,
        };
        break;
      case "database":
        payload = {
          content_type: "database",
          table_name: databaseTable,
          field_name: databaseField,
        };
        break;
      case "calculated":
        payload = { content_type: "calculated", dynamic_data: calculatedValue };
        break;
      case "button":
        // update the button data adding class and path
        const updatedButtonData = buttonData.map(button => ({
          ...button,
          class: `button-${button.button_name}`,
          path: button.button_name
        }));

        payload = { content_type: "button", dynamic_data: updatedButtonData };
        break;
      default:
        break;
    }
    return payload;
  }, [contentType, staticText, databaseTable, databaseField, calculatedValue, buttonData]);
};

export default useSavePayload;
