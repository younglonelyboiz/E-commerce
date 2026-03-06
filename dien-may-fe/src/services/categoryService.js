import axios from "../setUp/axios";

export const getCategories = () => {
  return axios.get("/categories");
};
