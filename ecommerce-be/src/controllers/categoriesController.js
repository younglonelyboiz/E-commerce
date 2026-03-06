import { sendResponse } from "../utils/apiResponse.js";
import categoryService from "../services/categoryService.js";
export const getAllCategories = async (req, res) => {
  try {
    const result = await categoryService.getCategories();
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.log(error);
    return sendResponse(res, -1, "Error fetching categories", null);
  }
};
