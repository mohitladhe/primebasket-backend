# ⚙️ PrimeBasket - Backend API

The robust, serverless RESTful API powering the PrimeBasket e-commerce platform. Built with Node.js and Express, this backend handles seamless communication between the frontend client, the Supabase database, and authentication services.

🌐 **Live API Base URL:** [primebasket-backend.vercel.app](https://primebasket-backend.vercel.app)
💻 **Frontend Repository:** [PrimeBasket Web Client](https://github.com/mohitladhe/primebasket-web)

## ✨ Core Services & Architecture

The backend is modularized into distinct routing services to ensure clean architecture and scalability:

* **Authentication (`/api/auth`):** Handles secure login, registration, and session management.
* **Products Catalog (`/api/products`):** Manages the fetching, filtering, and administration of the store's inventory.
* **Shopping Cart (`/api/cart`):** Maintains and synchronizes user cart states.
* **Checkout & Logistics (`/api/orders`, `/api/addresses`):** Processes secure checkouts, order tracking, and user delivery addresses.
* **Admin & Analytics (`/api/admin`, `/api/dashboard`):** Protected routes providing high-level metrics and store management capabilities.
* **User Profile (`/api/profile`):** Manages user-specific data and history.

## 🛠️ Tech Stack

* **Runtime & Framework:** Node.js, Express.js
* **Database & Auth:** Supabase (PostgreSQL)
* **Middleware:** CORS (Strictly configured for the Vercel frontend), Express JSON parsing
* **Deployment & Hosting:** Serverless deployment via Vercel (`vercel.json` routing configuration)

## 🚀 Getting Started

### Prerequisites
* Node.js (v16 or higher)
* A configured Supabase project (URL and Keys)

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/mohitladhe/primebasket-backend.git](https://github.com/mohitladhe/primebasket-backend.git)
   ```
2. Navigate to the project directory and install dependencies:
   ```bash
   cd primebasket-backend
   npm install
   ```
3. Create a `.env` file in the root directory and add your required backend environment variables:
   ```env
   PORT=5000
   NODE_ENV="development"
   SUPABASE_URL="your_supabase_project_url"
   SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_key"
   ```
4. Start the local development server:
   ```bash
   npm start
   ```
5. The API will be running locally at `http://localhost:5000`.

## 🛡️ CORS & Production Deployment

This project is configured specifically for serverless deployment on Vercel. 
* Preflight `OPTIONS` requests are handled seamlessly via `vercel.json` rewrite rules.
* The Express `cors` middleware strictly allows requests from the verified production frontend domain (`https://primebasket-web.vercel.app`) and local development ports.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute to the project.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. Copyright (c) 2026 Mohit Ladhe.
