import brandService from "../services/brandService.js";
import { sendResponse } from "../utils/apiResponse.js";

export const getAllBrands = async (req, res) => {
  try {
    const result = await brandService.getBrands();
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.log(error);
    return sendResponse(res, -1, "Error fetching brands", null);
  }
};
