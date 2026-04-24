import axios from "../setup/axios";

export const getCategories = () => {
  return axios.get("/categories");
};
