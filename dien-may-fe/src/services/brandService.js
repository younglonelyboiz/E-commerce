import axios from "../setUp/axios";

export const getBrands = () => {
  return axios.get("/brands");
};
