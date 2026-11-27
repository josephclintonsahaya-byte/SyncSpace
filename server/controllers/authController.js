const argon2 = require("argon2");
const { User } = require("../models/User");

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (name.length > NAME_MAX_LENGTH) {
      return res.status(400).json({ message: "Name is too long" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      return res.status(400).json({
        message: "Password must be between 8 and 128 characters",
      });
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "An account with that email already exists",
      });
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid registration data",
      });
    }

    console.error("Registration failed");
    return res.status(500).json({
      message: "Unable to register account",
    });
  }
};

const login = async (req, res) => {
  try {
    // 1. Get email and password from request body
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    // 2. Validate input
    if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (!password || password.length > PASSWORD_MAX_LENGTH) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 3. Find user and explicitly include passwordHash
    const user = await User.findOne({ email }).select("+passwordHash");

    // 4. Check whether user exists and has a password
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 5. Verify entered password against stored hash
    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 6. Return safe user details
    return res.status(200).json({
      message: "Credentials verified successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Login failed");

    return res.status(500).json({
      message: "Unable to login",
    });
  }
};

module.exports = { register, login };
