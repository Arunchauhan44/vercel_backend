const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
require('dotenv').config();

const verifyBearerToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
     console.log("authHeader", authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: "error", message: 'Authentication failed. Bearer token required.' });
    }

    const token = authHeader.split(' ')[1];
    console.log("Token:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    const blacklistedToken = await prisma.blackListedToken.findFirst({ where: { token } });
    console.log("Blacklisted Token:", blacklistedToken);
    if (blacklistedToken) {
      return res.status(401).json({ status: "error", message: 'Authentication failed. Token invalid..' });
    }


    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });
    console.log("User Found:", user);

    if (!user) {
      return res.status(401).json({ status: "error", message: 'Authentication failed. User not found.' });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("Error in verifyBearerToken:", error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: "error", message: 'Authentication failed. Token expired.' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: "error", message: 'Authentication failed. Invalid token.' });
    }

    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = verifyBearerToken;