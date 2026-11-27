const mongoose = require("mongoose");

const removeSensitiveFields = (_document, returned) => {
  delete returned.passwordHash;
  delete returned.googleId;
  delete returned.__v;
  return returned;
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 254,
      match: [
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  "Please enter a valid email address"
],
    },
    passwordHash: {
      type: String,
      select: false,
      required: function () {
        return !this.googleId;
      },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      set: (value) => {
        if (value == null || (typeof value === "string" && value.trim() === "")) {
          return undefined;
        }

        return value;
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: removeSensitiveFields,
    },
    toObject: {
      transform: removeSensitiveFields,
    },
  }
);

exports.User = mongoose.model("User", userSchema);
