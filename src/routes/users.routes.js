import express from "express";
import { regesterUser } from "../controllers/users.controller.js";

const route = express.Router();

route.post("/register", regesterUser);

export  {route}
