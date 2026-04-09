const { createApp } = Vue;

createApp({
  data() {
    return {
      activeFilter: "",
      user: null,
      isLogin: true,
      showAuthModal: false,
      showGroceryModal: false,
      searchQuery: "",
      recipes: [],
      draggedRecipe: null,
      selectedRecipe: null, //Tracks which recipe is clicked
      mealPlan: {},
      days: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      authForm: {
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        email: "",
      },
      toast: { show: false, message: "", type: "success" },

      showMobileLibrary: false,
      activeMobileSlot: null,

      showAiChat: false,
      chatInput: "",
      chatHistory: [],
      isAiTyping: false,
    };
  },
  computed: {
    // This handles the filters
    displayedRecipes() {
      if (!this.activeFilter) return this.recipes;
      return this.recipes.filter((r) => {
        const cat = r.category ? r.category.toLowerCase() : "";
        // Strict check for Vegetarian
        if (this.activeFilter === "Vegetarian") {
          return cat === "vegetarian" || cat === "vegan";
        }
        return r.tags && r.tags.includes(this.activeFilter);
      });
    },
    // This generates a clean list of ingredients for the grocery modal
    computedGroceryList() {
      const allIngredients = [];
      Object.values(this.mealPlan).forEach((day) => {
        Object.values(day).forEach((meal) => {
          if (meal && meal.ingredients) {
            allIngredients.push(...meal.ingredients);
          }
        });
      });
      // Remove duplicates
      return [...new Set(allIngredients)];
    },
    filteredRecipes() {
      return this.recipes.filter((r) =>
        r.title.toLowerCase().includes(this.searchQuery.toLowerCase()),
      );
    },
    plannedMealsCount() {
      let count = 0;
      for (let day in this.mealPlan) {
        count += Object.keys(this.mealPlan[day]).length;
      }
      return count;
    },
    groceryList() {
      const list = new Set();
      Object.values(this.mealPlan).forEach((day) => {
        Object.values(day).forEach((recipe) => {
          if (recipe.ingredients)
            recipe.ingredients.forEach((ing) => list.add(ing));
        });
      });
      return Array.from(list);
    },
  },
  methods: {
    showToast(message, type = "success") {
      this.toast = { show: true, message, type };
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },
    // Helper to add mock times and tags to the free API
    enhanceRecipes(recipeList) {
      const possibleTags = [
        "Quick",
        "Vegetarian",
        "Gluten-Free",
        "High Protein",
        "Keto-Friendly",
      ];
      return recipeList.map((r) => {
        // Pick 1 or 2 random tags
        const shuffled = possibleTags.sort(() => 0.5 - Math.random());
        r.tags = shuffled.slice(0, Math.floor(Math.random() * 2) + 1);
        r.time = Math.floor(Math.random() * 4) * 10 + 20; // 20, 30, 40, or 50 mins
        return r;
      });
    },
    async searchApi() {
      try {
        const query = this.searchQuery.trim() || "chicken";
        const res = await axios.get(`/api/online-recipes?s=${query}`);
        this.recipes = this.enhanceRecipes(res.data);
      } catch (e) {
        this.showToast("Search failed", "error");
      }
    },
    async loadRecipes() {
      try {
        const res = await axios.get("/api/online-recipes");
        this.recipes = this.enhanceRecipes(res.data);
      } catch (e) {
        this.showToast("Failed to load recipes", "error");
      }
    },
    viewRecipe(recipe) {
      this.selectedRecipe = recipe;
    },
    openAuth(mode) {
      this.isLogin = mode === "login";
      this.showAuthModal = true;
    },
    async signup() {
      // 1. Check if ANY field is missing
      if (
        !this.authForm.firstName ||
        !this.authForm.lastName ||
        !this.authForm.username ||
        !this.authForm.password ||
        !this.authForm.email
      ) {
        this.showToast(
          "Please fill out all fields, including your last name.",
          "error",
        );
        return; // Stops the function from sending bad data to the server
      }

      // 2. Simple check for a valid email format
      if (
        !this.authForm.email.includes("@") ||
        !this.authForm.email.includes(".")
      ) {
        this.showToast("Please enter a valid email address.", "error");
        return; // Stops the function
      }

      // 3. If data is good, send it to the backend
      try {
        const res = await axios.post("/signup", this.authForm);
        this.user = res.data.user;
        this.showAuthModal = false;

        // Clear the form for the next time
        this.authForm = {
          firstName: "",
          lastName: "",
          username: "",
          password: "",
          email: "",
        };

        this.showToast("Account created successfully!");
        this.savePlan();
      } catch (e) {
        // If the server still rejects it (e.g., username already exists), catch it here
        console.error("Signup error:", e.response?.data || e);
        this.showToast(
          "Signup failed. That username or email might already be taken.",
          "error",
        );
      }
    },
    async login() {
      try {
        const res = await axios.post("/login", {
          username: this.authForm.username,
          password: this.authForm.password,
        });
        this.user = res.data.user;
        this.showAuthModal = false;
        await this.checkUser();
        this.showToast(`Welcome back, ${this.user.firstName}!`);
      } catch (e) {
        this.showToast("Invalid login", "error");
      }
    },
    async logout() {
      await axios.delete("/logout");
      this.user = null;
      this.mealPlan = {};
      this.showToast("Logged out successfully");
    },
    async checkUser() {
      try {
        const res = await axios.get("/user");
        this.user = res.data;
        this.mealPlan = this.user.mealPlan || {};
      } catch (e) {
        this.user = null;
      }
    },
    async savePlan() {
      if (!this.user) return this.openAuth("login");
      try {
        await axios.put("/user/plan", { mealPlan: this.mealPlan });
        this.showToast("Weekly plan saved!");
      } catch (e) {
        this.showToast("Failed to save plan.", "error");
      }
    },
    // --- NEW CLEAR PLAN FEATURE ---
    async clearPlan() {
      if (!confirm("Are you sure you want to clear your entire week?")) return;
      this.mealPlan = {};
      this.showToast("Meal plan cleared!");
      if (this.user) this.savePlan(); // Auto-save the empty board if logged in
    },
    printList() {
      window.print();
    },
    startDrag(recipe) {
      this.draggedRecipe = recipe;
    },
    dropRecipe(day, type) {
      if (!this.mealPlan[day]) this.mealPlan[day] = {};
      this.mealPlan[day][type] = this.draggedRecipe;
      this.draggedRecipe = null;
    },
    removeMeal(day, type) {
      delete this.mealPlan[day][type];
    },
    toggleFilter(tag) {
      this.activeFilter = this.activeFilter === tag ? "" : tag;
    },

    openMobileSelection(day, time) {
      if (window.innerWidth > 768) return;

      if (day && time) {
        this.activeMobileSlot = { day: day, time: time };
      } else {
        this.activeMobileSlot = null;
      }
      this.showMobileLibrary = true;
    },
    addRecipeToMobileSlot(recipe) {
      if (this.activeMobileSlot) {
        const day = this.activeMobileSlot.day;
        const time = this.activeMobileSlot.time;

        if (!this.mealPlan[day]) {
          this.mealPlan[day] = {};
        }

        this.mealPlan[day][time] = recipe;
        this.showMobileLibrary = false;
        this.activeMobileSlot = null;
      } else {
        this.viewRecipe(recipe);
      }
    },

    // --- AI CHAT METHODS ---
    toggleAiChat() {
      this.showAiChat = !this.showAiChat;
    },

    async sendChatMessage() {
      if (!this.chatInput.trim()) return;

      const userText = this.chatInput;

      // FIX 1: We just push the plain userText here.
      this.chatHistory.push({
        sender: "user",
        text: userText,
      });
      this.chatInput = "";

      this.$nextTick(() => {
        const container = this.$refs.chatContainer;
        if (container) container.scrollTop = container.scrollHeight;
      });

      this.isAiTyping = true;

      // --- THE AI CONNECTION ---
      try {
        const res = await axios.post("/api/ask-ai", { prompt: userText });

        this.isAiTyping = false;

        // FIX 2: We use marked.parse on the AI's response down here!
        this.chatHistory.push({
          sender: "ai",
          text: marked.parse(res.data.reply),
        });
      } catch (error) {
        this.isAiTyping = false;
        this.chatHistory.push({
          sender: "ai",
          text: "Sorry, I'm having trouble connecting to the kitchen right now!",
        });
      }

      // Auto-scroll to bottom again
      this.$nextTick(() => {
        const container = this.$refs.chatContainer;
        if (container) container.scrollTop = container.scrollHeight;
      });
    },
  },
  mounted() {
    this.checkUser();
    this.loadRecipes();
  },
}).mount("#app");
