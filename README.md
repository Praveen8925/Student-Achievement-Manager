# Student Achievement & Event Recording Manager

A modern, secure web application for tracking and managing staff and student achievements. Features high-contrast UI, JWT-based security, record-level data isolation, and easy administrative controls.

## ✨ Key Features
- **Admin Portal**: Management of staff credentials and password resets.
- **Staff Portal**: Recording of student achievements with certificate uploads.
- **Data Isolation**: Staff members can only see and edit their own recorded data.
- **Smart Filters**: High-performance search by Name, Reg No, or Date Range.
- **Exports**: Generate high-quality Excel and PDF reports.
- **Security**: Robust JWT authentication and role-based access control.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Supabase](https://supabase.com/) account for the database.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Praveen8925/Student-Achievement-Manager.git
   cd Student-Achievement-Manager
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   - Create a `.env` file based on the template.
   - Run `migration.sql` in your Supabase SQL editor.

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```
   - Create a `.env` file with `VITE_API_URL=http://localhost:5000/api`.

### Running the App
```bash
# In backend directory
npm run dev

# In frontend directory
npm run dev
```

## 🛠️ Technology Stack
- **Frontend**: React, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, Supabase (PostgreSQL).
- **Authentication**: JsonWebToken (JWT).

---
© 2024 Staff Achievement Management System
