const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: signToken(user._id),
});

const emailTaken = (res) =>
  res.status(409).json({
    message: "This email is already registered",
    errors: { email: "This email is already registered" },
  });

// POST /api/auth/register  (input already validated and cleaned)
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email })) return emailTaken(res);

    // role is never taken from the request, so nobody can register as admin
    const user = await User.create({ name, email, password });
    res.status(201).json(userResponse(user));
  } catch (err) {
    if (err.code === 11000) return emailTaken(res); // two sign-ups at the same moment
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/login  (input already validated and cleaned)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid email or password" });

    res.json(userResponse(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json(req.user);
};