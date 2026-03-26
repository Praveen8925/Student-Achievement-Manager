# Staff Achievement & Event Recording Module - Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Database Setup

Before running the server, you need to set up the database schema in Supabase:

1. Go to your Supabase project: https://jnwiebpxistojsbjgunt.supabase.co
2. Navigate to SQL Editor
3. Copy and paste the content from `database-schema.sql`
4. Execute the SQL script

## Environment Variables

The `.env` file contains:
```
PORT=5000
SUPABASE_URL=https://jnwiebpxistojsbjgunt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_mo9vSIzwufl4XVNKgiZKxg_SOrMECwk
```

## Installation

```bash
cd backend
npm install
```

## Running the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## API Endpoints

### 1. Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-03-26T10:30:00.000Z"
}
```

---

### 2. Records Management

#### Create Record

**POST** `/api/records`

Create a new student record with events and categories.

**Request Body:**
```json
{
  "register_number": "2021CS001",
  "student_name": "John Doe",
  "department": "Computer Science",
  "events": [
    {
      "description": "Hackathon 2026",
      "from_date": "2026-03-15",
      "to_date": "2026-03-17",
      "categories": [
        { "category": "Technical" },
        { "category": "Academic" }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Record created successfully",
  "data": [...]
}
```

#### Get All Records

**GET** `/api/records`

Retrieve all records with optional search and filters.

**Query Parameters:**
- `search` (optional): Search by register number, student name, or event description
- `from_date` (optional): Filter by start date (YYYY-MM-DD)
- `to_date` (optional): Filter by end date (YYYY-MM-DD)
- `category` (optional): Filter by category (Academic, Sports, Cultural, Technical, Other)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Records per page

**Example:**
```
GET /api/records?search=john&category=Technical&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Get Single Record

**GET** `/api/records/:categoryId`

Retrieve a specific record by category ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "category_id": "uuid",
    "register_number": "2021CS001",
    "student_name": "John Doe",
    "department": "Computer Science",
    "event_description": "Hackathon 2026",
    "category": "Technical",
    "from_date": "2026-03-15",
    "to_date": "2026-03-17",
    "certificate_url": "/api/certificates/download/uuid",
    "certificate_filename": "uuid.pdf"
  }
}
```

#### Update Record

**PUT** `/api/records/:categoryId`

Update event details or category.

**Request Body:**
```json
{
  "event_description": "Updated Hackathon 2026",
  "from_date": "2026-03-15",
  "to_date": "2026-03-18",
  "category": "Technical"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Record updated successfully",
  "data": {...}
}
```

#### Delete Record

**DELETE** `/api/records/:categoryId`

Delete a specific record (category entry).

**Response:**
```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

---

### 3. Certificate Management

#### Upload Certificate

**POST** `/api/certificates/upload/:categoryId`

Upload a certificate PDF for a specific category.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `certificate`: PDF file (max 5MB)

**Example (using cURL):**
```bash
curl -X POST \
  http://localhost:5000/api/certificates/upload/CATEGORY_ID \
  -F "certificate=@/path/to/certificate.pdf"
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate uploaded successfully",
  "data": {
    "certificate_url": "/api/certificates/download/uuid",
    "certificate_filename": "uuid.pdf"
  }
}
```

#### Download Certificate

**GET** `/api/certificates/download/:categoryId`

Download the certificate for a specific category.

**Response:** PDF file download

---

### 4. Export

#### Export to Excel

**GET** `/api/exports/excel`

Export filtered records to Excel file.

**Query Parameters:** Same as Get All Records (search, from_date, to_date, category)

**Example:**
```
GET /api/exports/excel?category=Technical&from_date=2026-01-01
```

**Response:** Excel file download (.xlsx)

#### Export to PDF

**GET** `/api/exports/pdf`

Export filtered records to PDF report.

**Query Parameters:** Same as Get All Records (search, from_date, to_date, category)

**Example:**
```
GET /api/exports/pdf?search=john
```

**Response:** PDF file download

---

## Data Validation Rules

1. **Register Number**: Required, unique identifier for students
2. **Student Name**: Required
3. **Department**: Required
4. **Event Description**: Required
5. **From Date**: Required, must be valid date
6. **To Date**: Required, must be >= From Date
7. **Category**: Required, must be one of: Academic, Sports, Cultural, Technical, Other
8. **Certificate**: PDF only, max 5MB

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Additional details if validation error"]
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `404`: Not Found
- `500`: Internal Server Error

## Database Schema

The system uses three main tables:

1. **students**: Stores student information
2. **events**: Stores event details linked to students
3. **event_categories**: Stores categories and certificates for each event

A view `flattened_records` provides a denormalized view for efficient querying.

## File Upload Storage

Certificates are stored in the `uploads/` directory with UUID-based filenames.

## Testing Endpoints

You can use tools like:
- Postman
- cURL
- Thunder Client (VS Code extension)
- Any HTTP client

## Notes

- All dates should be in ISO format (YYYY-MM-DD)
- The API uses Row Level Security (RLS) in Supabase for data protection
- Certificate filenames are automatically generated using UUIDs
- Old certificates are automatically deleted when new ones are uploaded
