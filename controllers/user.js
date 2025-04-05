const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const nodemailer = require("nodemailer");
const joi = require("joi");

// Registration
const registerUser = async (req, res) => {
  const { name, email, password, confirmPasword, role } = req.body;
  try {
    const userschema = joi.object({
      name: joi.string().required(),
      email: joi.string().email().required(),
      password: joi.string().min(6).required(),
      confirmPasword: joi.string().required(),
      role: joi.string().optional(),
    });

    const { error } = userschema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const exituser = await prisma.user.findFirst({
      where: { email },
    });
    // check if user already exists
    if (exituser) {
      return res.json({ message: "user already exists, please Login! " });
    }
    if (password !== confirmPasword) {
      return res.json({ message: "password does not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        confirmPasword: confirmPasword,
        role: role || "user", // Default to 'user' if role is not provided
      },
    });

    return res.json({ message: "user created successfully", user });
  } catch (error) {
    console.log("Error in signup", error);
    return res
      .status(500)
      .json({ error: error.message || "something went wrong" });
  }
};

// login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find the user by email
    const user = await prisma.user.findFirst({
      where: { email },
    });

    // if user does not exist , send a response and stop execution
    if (!user) {
      res.json({ message: "User does'nt exists, please SignUp first!" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(400).send({ status: "false", message: "invalid password" });
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
    };

    //const token = jwt.sign(tokenPayload, secretKey, { expiresIn: "365d" });

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {expiresIn: "365d"});

    return res.json({ message: "Login successfully", user, token });
  } catch (error) {
    console.log("error found:", error);

    res.status(500).json({ message: "Internal server error" });
  }
};

// forget password
const forgetPassword = async (req, res) => {
  const { email } = req.body;

  // const token = req.header("Authorisation");
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // const role = decoded.role;
  // if (role !== "admin") {
  //   return res.status(401).json({ message: "Unauthorised" });
  // }

  try {
    // Find the user by email
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User doesn't exist, please sign up first!" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save the OTP and its expiration time in the database
    await prisma.user.update({
      where: { email },
      data: {
        otp,
        otpExpires: new Date(Date.now() + 15 * 60 * 1000), // OTP expires in 15 minutes
      },
    });

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h1>Password Reset</h1>
        <p>Dear ${user.name},</p>
 <img src="https://cdn5.vectorstock.com/i/1000x1000/88/84/complete-order-icon-in-filled-line-style-for-any-vector-35318884.jpg" alt="Order Image" style="width: 100%; max-width: 600px;">
        <p>We received a request to reset your password. Please use the following OTP to reset your password:</p>
        <p>Your OTP for password reset is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 15 minutes.</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return res.json({ message: "OTP sent successfully to your email." });
  } catch (error) {
    console.error("Error in forgetPassword:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while processing your request." });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  try {
    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Find the user by email
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the OTP matches and is not expired
    if (user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the OTP
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        confirmPasword: confirmPassword,
        otp: "",
        otpExpires: null,
      },
    });

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while resetting the password" });
  }
};



// getAllUsers by admin
const getallUser = async (req, res) => {
  const token = req.header("Authorisation");

  if (!token) {
    return res.status(401).json({ message: "Unauthorised" });
  }
  try {
    const user = await prisma.user.findMany({});

    return res.json({ message: "All users are :", user });
  } catch (error) {
    console.log("An error occured while getting allUsers : ", error);

    return res.status(404).json({ message: "Users not found" });
  }
};

// delete user by admin
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.delete({
      where: {
        id: parseInt(id),
      },
    });
    res.json({ message: "User deleted successfully", user });
  } catch (error) {
    console.error("Error deleting user:", error);

    res.status(500).json({ error: "Internal Server Error" });
  }
};

const logoutUser = async (req, res) => {
  try {
    // Clear the token from the client-side
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error in logoutUser:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while logging out" });
  }
};



// const Logout = async (req, res) => {
//   try {
//     const token = req.headers.authorization.split(" ")[1];
//     await prisma.blackListedToken.create({
//       data: {
//         token,
//       },
//     });
//     return res
//       .status(200)
//       .json({ status: "success", message: "Logged out successfully" });
//   } catch (error) {
//     console.error("Error during logout", error);
//     return res
//       .status(500)
//       .json({ status: "error", message: "Failed to log out" });
//   }
// }; 

const Logout = async (req, res) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers['authorization'].split(' ')[1];

    // Add the token to the blackListedToken table
    await prisma.blackListedToken.create({
      data: {
        token: token,
      },
    });

    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = {
  registerUser,
  loginUser,
  forgetPassword,
  resetPassword,
  getallUser,
  deleteUser,
  Logout,
};
