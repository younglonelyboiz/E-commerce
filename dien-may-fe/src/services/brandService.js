import axios from "../setup/axios";

export const getBrands = () => {
  return axios.get("/brands");
};
