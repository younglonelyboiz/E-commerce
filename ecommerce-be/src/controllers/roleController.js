import {
  getAllRolesService,
  updateUserRoleService,
} from "../services/roleService.js";

import { sendResponse } from "../utils/apiResponse.js";

export const readAllRoles = async (req, res) => {
  let data = await getAllRolesService();
  return sendResponse(res, data.EC, data.EM, data.DT);
};

export const updateRole = async (req, res) => {
  // req.body = { userId: 5, roleIds: [1, 2] }
  let data = await updateUserRoleService(req.body.userId, req.body.roleIds);
  return sendResponse(res, data.EC, data.EM, data.DT);
};
