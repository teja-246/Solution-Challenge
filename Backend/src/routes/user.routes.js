import { Router } from "express";
const { addUser, getUsers } = require("../controllers/userController");

const router = Router();

// user routes
// router.route("/login").post(loginUser);  this is a sample route.

export default router