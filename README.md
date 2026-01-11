# Health Track App

Welcome to **Health Track App**, a personal health tracking application. This app allows users to upload blood test results either as files or manually, keeps a detailed list of the data, and generates visual diagrams to track how each metric changes over time. Stay on top of your health trends easily and intuitively.

Project URL: not deployed yet

---

## How can run this project locally


Follow these steps:

```bash
# Step 1: Clone the repository using the project's Git URL.
git remote add origin https://github.com/elene24/Health-Track-App.git
git pull origin main

# Step 2: start the backend server
cd backend
npm install express
npm install cors dotenv multer sqlite3
node server.js


# Step 3: start the frontend server
cd src
npm install
npm run dev


