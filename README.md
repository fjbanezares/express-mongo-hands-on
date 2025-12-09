# express-mongo-hands-on
Practice using express and mongo to deploy an app in the Cloud

# Express + MongoDB: Secure Connection Setup 🛡️

This project demonstrates how to connect a Node.js/Express application to MongoDB Atlas securely. It focuses on using **Environment Variables** to protect sensitive data like database passwords.

---

## ⚠️ CRITICAL SECURITY CONCEPT

**Never** hardcode your passwords directly into your code files (like `app.js`).
If you push a file containing your password to GitHub, it becomes public. Bots scan GitHub constantly to steal these credentials.

**The Solution:**
1. We store secrets in a file called `.env` on our computer.
2. We tell Git to **ignore** this file (via `.gitignore`).
3. We inject these secrets into the app using the `dotenv` library.

---

## 🛠️ Installation & Setup

Follow these steps to get the project running on your local machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/jjimnz11/express-mongo-hands-on.git](https://github.com/jjimnz11/express-mongo-hands-on.git)
cd express-mongo-hands-on
```

### 2. Install Dependencies
This installs Express, Mongoose, and the Dotenv library.
```bash
npm install
```

### 3. Create the Secret File
You will notice there is no `.env` file in the folder you downloaded. This is intentional. You must create it.

1.  Create a new file in the root folder named `.env`
2.  Add the following content (replace with your own data):

```env
PORT=3000
DB_URI=mongodb+srv://<db_username>:<db_password>@cluster0.mongodb.net/<db_name>
```

> **🛑 Important Notes:**
> * Do **not** use quotes around the URL.
> * Do **not** put spaces around the `=` sign.
> * **`<db_password>`**: This is the password for the *Database User* you created in Atlas Security tab, NOT your MongoDB Atlas login password.

### 4. Run the Project
Now that the secrets are configured locally, start the server:

```bash
npm start
```

You should see:
> `Connected to MongoDB safely!`

---

## ☁️ Deployment Guide (Render, Vercel, Heroku)

When you deploy this app to the cloud, it will crash initially.
**Why?** Because the `.env` file is on your laptop and is ignored by Git, so the cloud server doesn't know your database password.

**How to fix it:**

1.  Go to your Cloud Provider's Dashboard (e.g., Render).
2.  Find the **"Environment Variables"** or **"Settings"** section.
3.  Add the variables manually:

| Key | Value |
| :--- | :--- |
| `DB_URI` | `mongodb+srv://user:pass@cluster...` |
| `PORT` | `3000` |

---

## 📚 Code Explanation (How it works)

### The `.gitignore` file
Open the `.gitignore` file in this project. You will see this line:
```text
.env
```
This tells Git: *"Upload all my code, but DO NOT upload the .env file."*

### The `app.js` file
We use the `dotenv` library to read the `.env` file and make it available to Node.js.

```javascript
// 1. Load environment variables
require('dotenv').config();

// 2. Access the variable using process.env
const dbConnection = process.env.DB_URI;

// 3. Connect
mongoose.connect(dbConnection)
  .then(() => console.log("Connected!"))
  .catch((err) => console.log("Error:", err));
```

---

## 🆘 Troubleshooting

* **Error: `MongooseError: The 'uri' parameter to 'openUri()' must be a string`**
    * *Cause:* The app cannot find your connection string.
    * *Fix:* Check that you created the `.env` file correctly and that `DB_URI` is spelled exactly the same in the file and in your code.
* **Error: `bad auth authentication failed`**
    * *Cause:* Wrong password or username.
    * *Fix:* Check your Atlas "Database Access" tab. Reset the password if needed and update your `.env` file.
