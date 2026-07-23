# Mini ERP + CRM Operations Portal

A full-stack Enterprise Resource Planning (ERP) and CRM system built for wholesale and distribution operations.

---

## 🛠️ Tech Stack & System Architecture

### **Architecture Overview**
The application uses a standard full-stack architecture:
* **Frontend:** React.js single-page application built with component-based modular structure and Axios for REST API communication.
* **Backend:** Node.js with Express.js managing REST API routes, controllers, middleware (JWT authentication & CORS), and database logic.
* **Database:** PostgreSQL for relational data storage (Users, Customers, Products, Stock Logs, and Sales Challans).
## 🚀 Key Modules & Features

1. **Authentication & Role-Based Access Control (RBAC):**
   * Secure JWT authentication.
   * Role permissions supported: `Admin`, `Sales`, `Warehouse`, `Accounts`.

2. **Customer CRM Module:**
   * Customer creation and tracking (`Lead`, `Active`, `Inactive`).
   * Search/filter functionality and follow-up notes.

3. **Product & Inventory Management:**
   * Real-time stock tracking with minimum stock alerts.
   * Automated stock movement logs (`IN` / `OUT`).

4. **Sales Challan Module:**
   * Create multi-item delivery challans in `Draft` or `Confirmed` status.
   * Automatic stock deduction upon confirmation with negative stock prevention.

---

## 🔑 Test Login Credentials

| Role | Email / Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@erp.com` | `admin123` |
| **Sales** | `sales@erp.com` | `sales123` |
| **Warehouse**| `warehouse@erp.com` | `warehouse123` |
| **Accounts** | `accounts@erp.com` | `accounts123` |

---

## ⚙️ How to Run Locally

### 1. Prerequisites
* Node.js (v18+)
* PostgreSQL running locally

### 2. Backend Setup
```bash
# In root directory
npm install
npm start

### Step 2: Push the updated `README.md` to GitHub

Open a new terminal tab in VS Code and run:

```bash
git add README.md
git commit -m "Update README with architecture, credentials, and project scope"
git push origin main