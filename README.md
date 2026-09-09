# Full-Stack Node.js E-Commerce Application (MVC Architecture)

A robust, enterprise-structured backend application for an e-commerce storefront built with **Node.js**, **Express.js**, and **MongoDB/Mongoose**. 

This project strictly implements the **Model-View-Controller (MVC)** architectural pattern to ensure scalability, modular code organization, and a clean separation of concerns. It features complete user authentication, runtime form validation, file upload management, dynamic streaming PDF generation, and industry-standard security enhancements.

---

## 🚀 Core Features & Backend Competencies

* **Architectural Pattern (MVC):** Clean separation of business logic (`controllers/`), database structures (`models/`), request mapping (`routes/`), and UI rendering (`views/`).

* **Secure Authentication & Session State:** Session tracking powered by `express-session` backed by a persistent `connect-mongodb-session` store. Secure password hashing is implemented using `bcryptjs`.

* **Route Protection & Middleware:** Modular request filtering using custom middleware (`is-auth.js`) to secure sensitive administrative and customer routes.

* **Data Validation & Sanitization:** Server-side request scanning using `express-validator` to guarantee strict input sanitation, custom email validation, and credential verification before data touches the database.

* **File Uploads & File System Manipulation:** Dynamic handling of product images via `multer` multipart form processing. Integrated a custom file management utility (`util/file.js`) utilizing core Node modules (`fs`, `path`) to cleanly erase orphaned assets when products are modified or deleted.

* **On-the-Fly Document Streaming:** Dynamic client-side PDF invoice generation using `pdfkit`. Invoices are streamed straight to the response buffer to save server-side memory footprint.

* **Pagination:** Scalable data fetching logic implemented on the catalog to manage query loading times and reduce database memory overhead.

* **Production Security & Optimization:** Configured with `helmet` for HTTP header masking, `compression` for reducing asset payloads, and `morgan` for automated request stream logging.

---

## 🛠️ Tech Stack & Dependencies

### Core Backend & Database
* **Runtime Environment:** Node.js (CommonJS)
* **Framework:** Express.js (v5.x ecosystem)
* **Database ODM:** Mongoose / MongoDB Atlas
* *Note: Package ecosystem structured to support Relational Database transitions (`Sequelize` / `mysql2`) if necessary.*

### Security & Utilities
* **Encryption & CSRF:** `bcryptjs`, `csurf`
* **Validation:** `express-validator`
* **Environment Configuration:** `dotenv`, `cross-env`
* **Emails & Messaging:** `nodemailer`, `connect-flash`

### Asset Handling & Templates
* **Templating Engine:** EJS (Embedded JavaScript)
* **File Stream Processors:** `multer`, `pdfkit`

---

## 📂 Project Structure

```text
node-js-shop/
├── app.js                  # Application entry point & middleware pipeline configuration
├── controllers/            # Core business logic & database interface controllers
│   ├── adminController.js  # Product management (Create, Read, Update, Delete)
│   ├── auth.js             # User lifecycle (Login, Signup, Reset, Logout)
│   ├── errorController.js  # Centralized error mapping (404 / 500 pages)
│   └── shop.js             # Client routing (Catalog, Cart, Checkout, Invoicing)
├── models/                 # Mongoose schemas & data modeling layers
│   ├── user.js             # User structural metadata & embedded cart mapping
│   ├── product.js          # Item schemas and catalog structural data
│   └── order.js            # Relational snapshot mapping Users to Purchased Items
├── routes/                 # Express Router endpoint mappings
│   ├── admin.js            # Protected administrative actions
│   ├── auth.js             # Open authentication gates
│   └── shop.js             # Public storefront navigation mappings
├── middleware/             # Request pre-processors
│   └── is-auth.js          # Route-guard checking authentication states
├── util/                   # Structural helper utilities
│   └── file.js             # File system unlinking functions (I/O management)
├── public/                 # Static front-end assets
│   ├── CSS/                # Modular client-side styling sheets
│   └── js/                 # Client-side asynchronous JavaScript operations
├── data/invoices/          # Secure file path for server-backed PDF instances
├── images/                 # Multipart file target directory for product images
└── views/                  # Dynamic UI layout templates (EJS)
    ├── admin/              # Product mutations interface files
    ├── auth/               # Access gate interfaces (Login, Reset templates)
    ├── shop/               # Client checkout pages and dashboard templates
    └── includes/           # Reusable layout components (Navigation, Headers)
```

---

## 🔧 Installation & Environment Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/nooremeel/node-js-shop.git](https://github.com/nooremeel/node-js-shop.git)
cd node-js-shop
```

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory of the project and populate it with your respective keys:

```ini
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/shop?retryWrites=true&w=majority
SESSION_SECRET=your_long_secure_session_secret_string
SENDGRID_API_KEY=your_sendgrid_or_smtp_credential_key
FROM_EMAIL=noreply@yourdomain.com
```

---

## 🏃‍♂️ Running the Application

The environment includes predefined script execution blocks configured inside `package.json`:

* **Production Start:** Standard single-run instance.
  ```bash
  npm start
  ```

* **Development Boot Mode:** Automated workspace reloading using `nodemon`.
  ```bash
  npm run start:dev
  ```

---

## 🎓 Acknowledgements

This application was constructed as an extensive operational extension of the **NodeJS - The Complete Guide (incl. MVC, REST APIs, GraphQL)** curriculum by Academind (Maximilian Schwarzmüller), focusing heavily on building robust backend pipelines, securing user inputs, managing persistent server storage layers, and deploying best practices for server-side architecture.

---

## Running the app

### Development (two terminals)
1. `npm run start:dev` — API on http://localhost:3000
2. `npm run client:dev` — SPA on http://localhost:5173 (proxies /api and /images)

Open http://localhost:5173.

### Production
1. `npm run build` — builds the SPA into `public/app/`
2. `npm start` — Express serves the API and the built SPA

Open http://localhost:3000.
