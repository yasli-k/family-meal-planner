# Family Prep

Family Prep is a full-stack meal planning application designed to reduce the stress of figuring out what's for dinner. It allows users to browse a recipe library, plan their weekly meals using a drag-and-drop interface, automatically generate printable grocery lists, and talk to an AI Chef to get recipe ideas based on leftovers in their fridge.

**Live Demo:** [https://familyprep.up.railway.app/](https://familyprep.up.railway.app/)  
**Video Walkthrough:** [Watch on Loom](https://www.loom.com/share/50b96e7ac9dc4295bb05750373ee487c)

---

## Features

- **Drag-and-Drop Weekly Planner:** Easily organize your Lunch and Dinner schedule for the week. (Includes a "Tap to Add" mobile fallback for phone users).
- **AI Chef Assistant:** Integrated with a Large Language Model (via OpenRouter) to generate custom recipes based on whatever ingredients you currently have in your kitchen.
- **Smart Grocery List:** An algorithm that aggregates all ingredients from your planned meals into a clean, printable checklist, removing the need for manual tracking.
- **Recipe Library:** Browse, search, and filter recipes by tags like "Vegetarian", "Gluten-Free", or "Quick".
- **User Authentication:** Secure login and sign-up functionality so users can save their unique meal plans and access them from any device.

---

## Tech Stack

**Frontend:**

- Vue.js 3 (State management, reactive UI)
- Vanilla CSS3 (Custom responsive styling, CSS Grid/Flexbox)
- Marked.js (Markdown parsing for AI chat responses)

**Backend:**

- Node.js & Express.js (RESTful API architecture)
- OpenRouter API / Minimax (AI Integration)
- CORS & Axios (HTTP requests)

**Database & Hosting:**

- MongoDB Atlas (NoSQL cloud database for users, recipes, and meal plans)
- Railway (Cloud hosting and deployment)

---

## Running the Project Locally

If you want to run this project on your local machine, follow these steps:

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/family-prep.git
cd family-prep
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up Environment Variables

Create a file named `.env` in the root directory and add your API keys:

```env
PORT=8080
MONGO_URI=your_mongodb_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 4. Start the Server

```bash
node server.js
```

The app will now be running at `http://localhost:8080`.

---

## 🗺️ System Architecture

| Layer            | Technology        | Key Responsibility                                            |
| :--------------- | :---------------- | :------------------------------------------------------------ |
| **Frontend**     | Vue.js 3          | State management for the meal plan and reactive UI updates.   |
| **Backend**      | Node.js / Express | RESTful API endpoints for user auth and database connections. |
| **Database**     | MongoDB Atlas     | NoSQL document storage for users and recipe schemas.          |
| **Intelligence** | OpenRouter (LLM)  | Natural language processing for "fridge-to-meal" suggestions. |

---

## Future Roadmap

- **Custom Recipe Uploads:** Allow users to type in and save their own secret family recipes.
- **E-Commerce Integration:** Connect the grocery list directly to Walmart or Kroger for one-click ingredient purchasing.
- **Social Sharing:** Allow users to send their weekly plans to friends or family members.
- **Native Mobile App:** Convert the web application into a React Native app for the iOS App Store and Google Play Store.

---

**Author:** Yasli Kanimba Murenzi  
**Course:** SE 4600: Senior Project
