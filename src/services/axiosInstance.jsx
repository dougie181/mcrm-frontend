import axios from "axios";

//baseURL: "http://192.168.4.194:5000/api",
//baseURL: "http://localhost:5000/api",
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
