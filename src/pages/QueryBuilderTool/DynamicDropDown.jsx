import React, { useState, useEffect } from 'react';
import { Select, MenuItem } from '@mui/material';
import axiosInstance from "../../services/axiosInstance";

const dropdownEndpoints = {
  "Products.productCode": "products/productCodes",
};

const DynamicDropdown = ({ value, onChange, field }) => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const endpoint = dropdownEndpoints[field];
            if (endpoint) {
                try {
                    const response = await axiosInstance.get(endpoint);
                    setItems(response.data);
										//console.log("response.data: ", response.data)
                } catch (error) {
                    console.error(`Failed to fetch data for field ${field}:`, error);
                }
            }
        }

        fetchData();
    }, [field]);

    return (
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
            {items.map(item => (
                <MenuItem key={item} value={item}>
                    {item}
                </MenuItem>
            ))}
        </Select>
    );
};

export default DynamicDropdown;