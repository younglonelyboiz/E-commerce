import { sendResponse } from "../utils/apiResponse.js";
import { createUser } from "../services/userService.js";

const checkValidUserData = (data) => {
  if (
    !data.email ||
    !data.password ||
    !data.confirmPassword ||
    !data.user_name
  ) {
    return {
      valid: false,
      message: "Missing required fields",
    };
  }

  if (data.password !== data.confirmPassword) {
    return {
      valid: false,
      message: "Passwords do not match",
    };
  }

  return { valid: true };
};

export const registerNewUser = async (req, res) => {
  console.log("đenadauaudaudu");
  try {
    const userData = req.body;

    const check = checkValidUserData(userData);
    if (!check.valid) {
      return sendResponse(res, 1, check.message, null);
    }

    const data = {
      email: userData.email,
      password: userData.password,
      user_name: userData.user_name,
    };

    const result = await createUser(data);
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.error("Error creating user:", error);
    return sendResponse(res, -1, "Error creating user", null);
  }
};
