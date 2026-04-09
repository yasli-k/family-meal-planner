const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

require("dotenv").config({
  quiet: true, //this turns off the injection tips
});

mongoose
  .connect(process.env.DBPASSWORDS)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// User (person who plans meals: can be parent, home cook, etc.)
const userSchema = new Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
  },
  mealPlan: { type: Object, default: {} }, // Stores the user's meal plan as a JSON object

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Recipe model
const recipeSchema = new Schema({
  title: {
    type: String,
    required: [true, "Recipe title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  ingredients: [
    {
      type: String,
      required: true,
    },
  ],
  instructions: {
    type: String,
    required: [true, "Instructions are required"],
  },
  prepTime: {
    type: Number, // in minutes
    required: false,
  },
  servings: {
    type: Number,
    default: 4,
  },
  imageURL: {
    type: String,
    required: [true, "Image URL is required"],
  },
  category: {
    type: String, // e.g. "Vegetarian", "Quick", "Dinner", "Breakfast"
    trim: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Password hashing methods
userSchema.methods.setPassword = async function (plainPassword) {
  try {
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(plainPassword, salt);
    this.password = encryptedPassword;
  } catch (error) {
    console.error("Password hashing failed:", error.message);
    throw new Error("Failed to hash password");
  }
};

userSchema.methods.verifyPassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

const User = mongoose.model("User", userSchema);
const Recipe = mongoose.model("Recipe", recipeSchema);

module.exports = { User, Recipe };
