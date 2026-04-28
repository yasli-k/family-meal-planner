const express = require("express");
const cors = require("cors");
require("dotenv").config();
const model = require("./model");
const session = require("express-session");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: "http://localhost:8080", credentials: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "senior-project-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  }),
);

// --- PUBLIC ROUTES (No Login Required) ---

// the Online Recipe Route
app.get("/api/online-recipes", async (req, res) => {
  try {
    const defaultTerms = [
      "chicken",
      "salad",
      "beef",
      "pasta",
      "pork",
      "soup",
      "pie",
      "cake",
      "fish",
      "breakfast",
      "vegan",
    ];
    const randomTerm =
      defaultTerms[Math.floor(Math.random() * defaultTerms.length)];

    const query = req.query.s || randomTerm;

    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`,
    );

    if (!response.data.meals) {
      return res.json([]);
    }

    const formatted = response.data.meals.map((m) => {
      const rawText = m.strInstructions || "";
      const stepArray = rawText
        .split(/\r\n|\n/)
        .filter((step) => step.trim().length > 2);

      return {
        _id: m.idMeal,
        title: m.strMeal,
        imageURL: m.strMealThumb,
        ingredients: [
          m.strIngredient1,
          m.strIngredient2,
          m.strIngredient3,
          m.strIngredient4,
          m.strIngredient5,
          m.strIngredient6,
        ].filter((i) => i && i.trim() !== ""),
        prepTime: 30,
        instructions: stepArray,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("API Error:", err.message);
    res.status(500).json({ message: "Failed to fetch online recipes" });
  }
});

// --- AI ROUTE (OPENROUTER / MINIMAX) ---
app.post("/api/ask-ai", async (req, res) => {
  try {
    const userPrompt = req.body.prompt;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "minimax/minimax-m2.5",
        messages: [
          {
            role: "system",
            content: `You are a helpful, enthusiastic AI Chef for a meal planning app. 
          Keep your answers concise, friendly, and formatted nicely using short paragraphs. 
          If a user gives you a list of ingredients, suggest exactly ONE delicious, easy-to-make recipe.`,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:8080",
          "X-Title": "Family Meal Planner",
        },
      },
    );

    const aiResponseText = response.data.choices[0].message.content;

    res.json({ reply: aiResponseText });
  } catch (error) {
    console.error(
      "OpenRouter Error:",
      error.response ? error.response.data : error.message,
    );
    res.status(500).json({
      reply: "Oops! My kitchen caught on fire. Try again in a minute!",
    });
  }
});

// Middleware: protect routes that require login
// async function requireLogin(req, res, next) {
//   console.log("session in auth middleware:", req.session);
//   if (req.session && req.session.userId) {
//     let user = await model.User.findById(req.session.userId);
//     if (!user) {
//       return res.status(401).json({ message: "Please log in to continue" });
//     }
//     req.user = user;
//     return next();
//   } else {
//     return res.status(401).json({ message: "Please log in to continue" });
//   }
// }

//signup
app.post("/signup", async (req, res) => {
  try {
    console.log("Received body from Postman:", req.body);
    const { firstName, lastName, username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await model.User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already taken" });
    }

    const user = new model.User({
      firstName,
      lastName,
      username,
      email,
      password,
    });

    //hashing password before saving
    await user.setPassword(password);

    await user.save();

    req.session.userId = user._id;
    res.status(201).json({
      message: "Account created",
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

//login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await model.User.findOne({ username });

    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    req.session.userId = user._id;
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// --- PROTECTED ROUTES (Login Required) ---

async function requireLogin(req, res, next) {
  if (req.session && req.session.userId) {
    let user = await model.User.findById(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.user = user;
    return next();
  }
  res.status(401).json({ message: "Please log in" });
}

//logout
app.delete("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// Get current user info
app.get("/user", requireLogin, async (req, res) => {
  const user = await model.User.findById(req.session.userId).select(
    "-password",
  );
  res.json(user);
});

// Save meal plan
app.put("/user/plan", requireLogin, async (req, res) => {
  try {
    // req.user comes from your requireLogin middleware
    req.user.mealPlan = req.body.mealPlan;
    await req.user.save(); // Saves it to MongoDB!
    res.json({ message: "Plan saved successfully!" });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ message: "Failed to save plan" });
  }
});

//recipe routes

// Get all recipes
// app.get("/recipes", async (req, res) => {
//   try {
//     const recipes = await model.Recipe.find()
//       .populate("owner", "username firstName lastName")
//       .sort({ createdAt: -1 });
//     res.json(recipes);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching recipes" });
//   }
// });

app.get("/recipes", async (req, res) => {
  try {
    const recipes = await model.Recipe.find().sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching local recipes" });
  }
});

// Create a new recipe
app.post("/recipes", requireLogin, async (req, res) => {
  try {
    const recipe = new model.Recipe({
      ...req.body,
      owner: req.session.userId,
    });
    await recipe.save();
    await recipe.populate("owner", "username firstName lastName");
    res.status(201).json(recipe);
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ message: "Failed to create recipe", error: err.message });
  }
});

// Get recipe by ID
app.get("/recipes/:id", async (req, res) => {
  try {
    const recipe = await model.Recipe.findById(req.params.id).populate(
      "owner",
      "username firstName lastName email",
    );
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: "Error fetching recipe" });
  }
});

// Update recipe by ID
app.put("/recipes/:id", requireLogin, async (req, res) => {
  try {
    const recipe = await model.Recipe.findOne({
      _id: req.params.id,
      owner: req.session.userId,
    });
    if (!recipe) {
      return res
        .status(404)
        .json({ message: "Recipe not found or not owned by you" });
    }

    Object.assign(recipe, req.body);
    await recipe.save();
    await recipe.populate("owner", "username firstName lastName");
    res.json(recipe);
  } catch (err) {
    res.status(400).json({ message: "Failed to update recipe" });
  }
});

// Delete recipe by ID
app.delete("/recipes/:id", requireLogin, async (req, res) => {
  try {
    const recipe = await model.Recipe.findOneAndDelete({
      _id: req.params.id,
      owner: req.session.userId,
    });
    if (!recipe) {
      return res
        .status(404)
        .json({ message: "Recipe not found or not owned by you" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "Failed to delete recipe" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
