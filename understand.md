# 🚀 Anti Gravity: The Complete Developer's Guide

Welcome to the **Anti Gravity** project! This document provides a deep-dive into the architecture, logic, and data flow of this full-stack application. If you are new to web development, this will be your "North Star."

---

## 🏗️ 1. The Big Picture (Architecture)

Anti Gravity follows a **Client-Server-Database** architecture:

1.  **Client (Frontend)**: A React application running in your browser. It handles the UI and user interactions.
2.  **Server (Backend)**: A Node.js/Express application. It handles security, business logic, and talks to the database.
3.  **Database**: A relational database (managed via Sequelize) that stores your users, transactions, and budgets.

---

## 🧠 2. The Backend: Deep Dive (`/backend`)

The backend is built using **Express.js**, the most popular web framework for Node.js.

### 🔌 `server.js` (The Heart)
This is where everything starts. It performs four critical tasks:
-   **Middleware Registration**: It sets up `cors` (allowing the frontend to talk to it) and `express.json` (parsing data from requests).
-   **Database Connection**: It connects to the SQL database using Sequelize.
-   **Route Registration**: It tells the server which file should handle which URL (e.g., all URLs starting with `/api/auth` go to `authRoute.js`).
-   **Cron Jobs**: It starts background tasks like `recurringBillsCron.js` which automatically process monthly bills.

### 🛡️ Middleware (`/middleware`)
Middleware functions act like "security guards" for your routes.
-   **`authMiddleware.js`**: This is the "Security Guard" of your backend. It performs three steps:
    1.  **Header Check**: Looks for the `Authorization: Bearer <token>` header.
    2.  **Signature Verification**: Uses `jwt.verify` to make sure the token hasn't been tampered with.
    3.  **Identity Attachment**: If valid, it attaches the user data to `req.user` so the route knows exactly who is making the request.

### 📁 Models (`/models`)
Models define what your data looks like. We use **Sequelize (an ORM)** so we don't have to write raw SQL.
-   **Relationships**: In `models/index.js`, we define how tables connect. For example:
    -   `User.hasMany(Transaction)`: One user can have many transactions.
    -   `Category.hasMany(Transaction)`: Each transaction belongs to a category.

### 🛣️ Routes (`/routes`)
Routes are the actual API endpoints.
-   **Logic**: Instead of just saving data, routes like `analyticsRoute.js` perform complex calculations (like the **UoH Insights** which compare your spending to campus averages).

---

## 🎨 3. The Frontend: Deep Dive (`/frontend`)

The frontend is built with **React** and **TypeScript**.

### 🔐 `AuthContext.tsx` (The Global Hub)
State in React is usually local to a component. However, the "User" info and "IsLoggedIn" status need to be available *everywhere*.
-   **Context API**: This file creates a "Global Bubble" around the app so any page can check if the user is logged in using the `useAuth()` hook.
-   **Session Persistence**: On page refresh, the `useEffect` here "hydrates" the app by pulling the token from `localStorage`, keeping you logged in.
-   **Axios Interceptors (The Automated Stapler)**: 
    - This is like a "Pre-Flight Check" for every request.
    - It automatically "staples" the `Authorization: Bearer <token>` header to every outgoing API call. 
    - This ensures you never have to manually add security headers in your components.

### 🎣 3.2 React Fundamentals: Hooks
We use React Hooks to manage data and actions within components:
-   **`useState` (The Memory)**: Used to remember values. For example, `activeTab` remembers if you are looking at "Budgets" or "Bills." When state changes, React automatically redraws the screen.
-   **`useEffect` (The Trigger)**: Used for "Side Effects." It tells React to perform an action (like fetching data from the API) only at specific times, such as when the page first loads (`[]` dependency array).

### 🚀 3.3 Moving Around: `Link` vs `useNavigate`
In React, we don't use standard `<a>` tags because they refresh the whole page. Instead, we use:
-   **`<Link>` (The Door)**: Use this for simple clicks (e.g., "Go to Login"). It's a component that waits for the user to click it.
-   **`useNavigate()` (The Teleporter)**: Use this inside your logic. For example, after a user successfully registers, the code calls `navigate('/login')` to "teleport" them automatically.

### 🗺️ `App.tsx` (The Router)
This file decides which page to show based on the URL. It also handles **Protected Routes**:
-   If you try to go to `/dashboard` but aren't logged in, it redirects you to `/login`.

### 📄 Pages vs. Components
-   **Pages (`/pages`)**: Large "screens" like the Dashboard or Reports. They usually "fetch" the data from the API.
-   **Components (`/components`)**: Smaller, reusable parts. 
    - **`TransactionModal`**: Used to both **add** and **edit** entries.
    - **Icons**: We use the `lucide-react` library. Components like `<UserPlus />` or `<Trash2 />` are just visual components that represent actions.

---

## 🔄 4. The Data Lifecycle (Step-by-Step)

Let's trace what happens when you click **"Save Transaction"**:

1.  **Frontend Validation**: `TransactionModal.tsx` checks if the date is in the future or if you have enough balance (**Balance Guard**).
2.  **API Call**: Axios sends a `POST` request to `http://10.6.28.106:5001/api/transactions`.
3.  **Security Check**: The backend `authMiddleware` verifies the JWT token.
4.  **Route Execution**: `transactionRoute.js` receives the data.
5.  **Database Storage**: Sequelize converts the JavaScript object into a SQL `INSERT` command.
6.  **Response**: The server sends back a `201 Created` status.
7.  **UI Update**: The Dashboard receives the success message, refreshes its list, and the new transaction appears!

---

## 💡 5. Advanced Logic Features

### 🏫 University of Hyderabad (UoH) Insights
Located in `backend/routes/analyticsRoute.js`, this logic categorizes your spending into "Mess," "Travel," and "Books" and provides personalized advice based on whether you are a **Hosteller** or a **Day Scholar**.

### 🛑 The Balance Guard
In the `TransactionModal`, the app doesn't just let you save an expense blindly. It first checks the `/api/analytics` endpoint to see if you have enough money. If not, it blocks the "Save" button.

### 🕒 Timezone Handling
The `getLocalISOString` function ensures that when you pick a time in the UI, it is converted correctly to the server's timezone, avoiding the common bug where transactions appear to be 5 hours in the past or future.

### 🏷️ Custom Categories (The Hybrid List)
The system merges global and personal categories:
-   **Predefined**: Standard categories (Food, Rent) available to everyone.
-   **Custom**: Categories you create are linked to your `user_id`. Others cannot see them.
-   **Soft Delete**: When you "delete" a category, it stays in the database (`deleted_at`) so your old transaction history doesn't break.

### 💰 One System, Two Types (Income vs Expense)
Instead of two separate systems, Income and Expense use the same code:
-   **Frontend**: Filters categories based on the type you select.
-   **Balance Guard**: Only blocks your progress if you are adding an **Expense** that exceeds your balance.
-   **Backend**: Saves both to the same `Transactions` table but triggers "Budget Alerts" only for expenses.

---

## 📂 6. File-by-File Summary

| Directory | Important File | What it does |
| :--- | :--- | :--- |
| **Backend** | `server.js` | Main entry point; sets up the server. |
| | `models/User.js` | Defines user structure (email, password_hash, etc.). |
| | `routes/authRoute.js` | Handles Registration and Login logic. |
| | `cron/recurringBillsCron.js` | Runs every day to check for upcoming bills. |
| **Frontend** | `src/App.tsx` | Defines all URLs/Routes in the browser. |
| | `src/context/AuthContext.tsx` | Keeps you logged in even after refreshing the page. |
| | `src/pages/Dashboard.tsx` | The main screen showing charts and history. |
| | `src/components/TransactionModal.tsx` | The form used to Add/Edit money entries. |

---

---

## 🔐 7. The Authentication Handshake

Authentication is a team effort between the Frontend and Backend:

### 1. Registration & Login (The Intake)
-   **Frontend**: Captures user data and performs **Pre-Flight Validation**:
    - **Names/Courses**: Uses Regex (`/^[A-Za-z\s]+$/`) to block numbers or symbols as you type.
    - **Passwords**: Enforces a strict rule (8+ chars, 1 uppercase, 1 digit, 1 special char).
    - **Navigation**: Uses `useNavigate` to only move the user *after* the backend confirms success.
-   **Backend**: 
    - Checks if the user already exists.
    - **Password Hashing**: Uses `bcrypt` to turn passwords into secure gibberish. We *never* store raw passwords.
    - **JWT Generation**: Creates a "Digital ID Card" (JSON Web Token) signed with a secret key.

### 2. JWT (The Digital Passport)
A JWT consists of three parts: `Header.Payload.Signature`.
-   **Payload**: Contains your `userId` and `email`.
-   **Signature**: Proves the token is real and hasn't been tampered with.
-   **Stateless**: The server doesn't need to "remember" you; it just verifies your "Passport" (JWT) on every request.

### 3. The Handshake Summary
| Step | Action | Responsibility |
| :--- | :--- | :--- |
| **1. Login** | User submits credentials | Frontend |
| **2. Verify** | Checks password & signs JWT | **Backend** |
| **3. Store** | Saves JWT in `localStorage` | Frontend |
| **4. Request**| Interceptor adds JWT to Headers | Frontend |
| **5. Protect**| Validates JWT signature | **Backend** |

---

## 🗄️ 8. Database Communication (Sequelize)

The backend doesn't write raw SQL. It uses **Sequelize**, which acts as a **Translator**:
-   **Models**: These are "Blueprints" in JavaScript that define what a User or Transaction looks like.
-   **ORM (Object-Relational Mapping)**: It maps your JavaScript objects directly to SQL tables.
-   **Relationships**: We define connections like `User.hasMany(Transaction)` so the system automatically knows how to link data together.
-   **Security**: Sequelize automatically prevents **SQL Injection** attacks, making your data much safer.

---

## 🚀 How to Navigate Like a Pro
-   **Want to change colors?** Look at `frontend/src/index.css`.
-   **Want to add a new page?** Create it in `frontend/src/pages` and add it to `App.tsx`.
-   **Want to add a new database table?** Create a new file in `backend/models` and link it in `models/index.js`.
-   **Getting "Unauthorized" errors?** Check if your token is being sent by the `AuthContext` interceptor.
