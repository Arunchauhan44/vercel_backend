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


// This function Api is working for user registration and sending OTP to the user email

// const registerUser = async (req, res) => {
//   const { name, email, password, confirmPassword, role } = req.body;

//   try {
//     // Validation schema
//     const userSchema = joi.object({
//       name: joi.string().trim().required(),
//       email: joi.string().email().trim().required(),
//       password: joi.string().min(6).required(),
//       confirmPassword: joi
//         .string()
//         .valid(joi.ref("password"))
//         .required()
//         .messages({ "any.only": "Passwords do not match" }),
//       role: joi.string().valid("user", "admin").default("user"),
//     });

//     // Validate input
//     const { error } = userSchema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }

//     // Check if user exists
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return res
//         .status(409)
//         .json({ message: "User already exists, please login" });
//     }

//     // Generate secure OTP
//     const otp = crypto.randomInt(100000, 999999).toString();
//     const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user
//     const user = await prisma.user.create({
//       data: {
//         name,
//         email,
//         password: hashedPassword,
//         role: role || "user",
//         confirmPassword,
//         otp,
//         otpExpires,
//       },
//     });

//     // Send OTP email
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "User Registration OTP",
//       html: `
//         <h1>User Registration</h1>
//         <p>Dear ${user.name},</p>
//         <img src="https://example.com/otp-image.jpg" alt="OTP Image" style="width: 100%; max-width: 600px;">
//         <p>Your OTP for registration is: <strong>${otp}</strong></p>
//         <p>This OTP will expire in 15 minutes.</p>
//       `,
//     };

//     await transporter.sendMail(mailOptions);

//     return res.status(201).json({
//       message: "User created successfully.  OTP sent for verification.",
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("Registration error:", error);
//     return res.status(500).json({
//       error: "Internal server error",
//       details:
//         process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };


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
      return res.json({ message: "User does'nt exists, please SignUp first!" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(400)
        .send({ status: "false", message: "invalid password" });
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
    };

    // Generate JWT token
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });

    return res.json({ message: "Login successfully", user, token });
  } catch (error) {
    console.log("error found:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// forget password
const forgetPassword = async (req, res) => {
  const { email } = req.body;
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
    return res.json({ message: "User deleted successfully", user });
  } catch (error) {
    console.error("Error deleting user:", error);

    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// const logoutUser = async (req, res) => {
//   try {
//     // Clear the token from the client-side
//     return res.status(200).json({ message: "Logout successful" });
//   } catch (error) {
//     console.error("Error in logoutUser:", error);
//     return res
//       .status(500)
//       .json({ message: "An error occurred while logging out" });
//   }
// };

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
    const token = req.headers["authorization"].split(" ")[1];

    // Add the token to the blackListedToken table
    await prisma.blackListedToken.create({
      data: {
        token: token,
      },
    });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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
