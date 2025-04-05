const express = require("express");
const routerU = express.Router();
const auth = require("../middleware/auth");
const {
  registerUser,
  loginUser,
  forgetPassword,
  resetPassword,
  Logout,
} = require("../controllers/user");

routerU.post("/signup", registerUser);
routerU.post("/login", loginUser);
routerU.post("/forget-password", forgetPassword);
routerU.post("/reset-password", resetPassword);

routerU.post("/logout", auth,  Logout);

module.exports = routerU;
