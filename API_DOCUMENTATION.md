# RIEC Backend API Documentation

**Base URL:** `http://localhost:3000` (adjust based on environment)
**Authentication:** JWT Bearer tokens for protected endpoints
**Response Format:** All responses follow this structure:

```json
{
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "total": 50, // optional, for paginated responses
  "meta": { ... } // optional, for paginated responses
}
```

---

## Table of Contents

1. [Health & Basic](#health--basic)
2. [Authentication](#authentication)
3. [Projects](#projects)
4. [Services](#services)
5. [Careers (Jobs)](#careers-jobs)
6. [Applications](#applications)
7. [Search](#search)
8. [Project Images](#project-images)
9. [Service Images](#service-images)
10. [Project Assets (Documents)](#project-assets-documents)
11. [Project Pricing Tiers](#project-pricing-tiers)
12. [Project Purchases & Payments](#project-purchases--payments)
13. [Favorites](#favorites)
14. [User Profile](#user-profile)
15. [Contact](#contact)
16. [Common Patterns](#common-patterns)
17. [Enums Reference](#enums-reference)

---

## Health & Basic

### GET `/`
Basic hello endpoint.

**Response:**
```json
{
  "statusCode": 200,
  "message": "Request successful",
  "data": "Hello World!"
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "statusCode": 200,
  "message": "Request successful",
  "data": {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## Authentication

### POST `/auth/login`
Admin/Client login - returns JWT token.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "User logged in successfully",
  "data": {
    "accessToken": "eyJhbGci...",
    "expiresIn": 86400,
    "role": "ADMIN",
    "user": {
      "id": "65f34e7e0a2b3c4d5e6f7000",
      "email": "admin@example.com",
      "role": "ADMIN",
      "profileImg": null,
      "coverImg": null
    }
  }
}
```

**Note:** Use the `accessToken` in subsequent requests: `Authorization: Bearer <token>`

### POST `/auth/register-client`
Register a new client user (public endpoint - no authentication required).

**Request:**
```json
{
  "email": "client@example.com",
  "password": "strongpassword"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Client registered successfully",
  "data": {
    "id": "65f34e7e0a2b3c4d5e6f7001",
    "email": "client@example.com",
    "role": "CLIENT",
    "profileImg": null,
    "coverImg": null,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### POST `/auth/firebase`
Firebase authentication (Google OAuth) - exchange Firebase ID token for RIEC JWT.

**Auth Required:** No

**Request:**
```json
{
  "idToken": "Firebase ID token from client SDK"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Firebase authentication successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "role": "CLIENT",
    "user": {
      "id": "65f34e7e0a2b3c4d5e6f7001",
      "email": "user@gmail.com",
      "role": "CLIENT",
      "profileImg": "https://example.com/google-profile.jpg",
      "coverImg": null
    }
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid Firebase ID token
- **409 Conflict** - Email already linked to another Firebase account

**Note:** This endpoint supports Google OAuth via Firebase. If the Firebase email matches an existing user's email, the accounts will be automatically linked. If no user exists with that email, a new CLIENT user is created.

### POST `/auth/register`
Register a new admin user (ADMIN only).

**Auth Required:** Yes (ADMIN)

**Response (201):** Same structure as above

### POST `/auth/logout`
Logout (updates last activity timestamp).

**Auth Required:** Yes

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Logged out successfully",
  "data": { "message": "Logged out successfully" }
}
```

---

## Projects

### GET `/projects`
List published projects with optional filtering and pagination.

**Auth Required:** No

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `service` | string | No | Filter by service slug |
| `location` | string | No | Filter by location (case-insensitive, partial match) |
| `featured` | string ("true"/"false") | No | Filter by featured status |
| `type` | `RESIDENTIAL` \| `COMMERCIAL` \| `INDUSTRIAL` | No | Filter by project category |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `include` | string | No | Comma-separated: `images,services,assets,pricingTiers,owner,assignments,purchases,counts` |

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Projects retrieved successfully",
  "data": [
    {
      "id": "65f34e7e0a2b3c4d5e6f7890",
      "title": "Modern Family Villa",
      "slug": "modern-family-villa",
      "location": "Lekki, Lagos, Nigeria",
      "type": "COMPLETED",
      "category": "RESIDENTIAL",
      "description": "A contemporary villa designed for comfort.",
      "featured": true,
      "purchasable": false,
      "isPublished": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "images": [], // if included
      "services": [], // if included
      "pricingTiers": [] // if included
    }
  ],
  "total": 50,
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### GET `/projects/identifier/:identifier`
Get a single project by ID or slug (unified endpoint).

**Auth Required:** No

**Path Parameters:**
- `identifier` (string) - MongoDB ObjectId or project slug

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `include` | string | No | Comma-separated relationships |

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Project retrieved successfully",
  "data": {
    "id": "65f34e7e0a2b3c4d5e6f7890",
    "title": "Modern Family Villa",
    "slug": "modern-family-villa",
    "location": "Lekki, Lagos, Nigeria",
    "type": "COMPLETED",
    "category": "RESIDENTIAL",
    "description": "...",
    "featured": true,
    "purchasable": true,
    "isPublished": true,
    "images": [
      {
        "id": "img1",
        "s3Key": "projects/image1.jpg",
        "url": "https://cdn.example.com/projects/image1.jpg",
        "caption": "Front view",
        "order": 0
      }
    ],
    "services": [
      {
        "service": {
          "id": "svc1",
          "name": "Architectural Design",
          "slug": "architectural-design"
        }
      }
    ],
    "pricingTiers": [
      {
        "id": "tier1",
        "name": "Basic Package",
        "description": "Includes site plan...",
        "currency": "NGN",
        "amount": 150000,
        "isActive": true
      }
    ],
    "assets": [],
    "assignments": [],
    "purchases": [],
    "owner": {
      "id": "user1",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

**Error (404):**
```json
{
  "statusCode": 404,
  "message": "Project not found with the given identifier",
  "data": null
}
```

### POST `/projects` (Create)
**Auth Required:** Yes (ADMIN)

**Request Body (CreateProjectDto):**
```json
{
  "title": "Modern Family Villa",
  "location": "Lekki, Lagos, Nigeria",
  "serviceSlugs": ["architectural-design", "construction-management"],
  "type": "COMPLETED",
  "category": "RESIDENTIAL",
  "description": "A contemporary villa designed for comfort.",
  "featured": false,
  "purchasable": false
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Project created successfully",
  "data": { /* project object */ }
}
```

### PUT `/projects/identifier/:identifier` (Update)
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Project updated successfully",
  "data": { /* updated project */ }
}
```

### DELETE `/projects/identifier/:identifier` (Delete)
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Project deleted successfully",
  "data": { "message": "Project deleted successfully" }
}
```

### POST `/projects/identifier/:identifier/publish`
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Project published successfully",
  "data": {
    "id": "...",
    "title": "...",
    "isPublished": true,
    "publishedAt": "2024-01-15T10:30:00Z"
  }
}
```

### POST `/projects/identifier/:identifier/unpublish`
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Project unpublished successfully",
  "data": {
    "id": "...",
    "title": "...",
    "isPublished": false
  }
}
```

### GET `/projects/categories`
Get all available project categories.

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Categories retrieved successfully",
  "data": ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"]
}
```

### GET `/projects/by-category/:category`
Get projects by category.

**Response (200):** Same as `/projects` list response

### GET `/projects/categories/:category/count`
Get project count by category.

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Project count retrieved successfully",
  "data": {
    "category": "RESIDENTIAL",
    "count": 25
  }
}
```

### GET `/projects/categories/summary`
Get summary statistics for all categories.

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Category summary retrieved successfully",
  "data": {
    "categories": [
      { "category": "RESIDENTIAL", "count": 25 },
      { "category": "COMMERCIAL", "count": 15 },
      { "category": "INDUSTRIAL", "count": 10 }
    ],
    "total": 50,
    "summary": [
      { "category": "RESIDENTIAL", "count": 25, "percentage": 50 },
      { "category": "COMMERCIAL", "count": 15, "percentage": 30 },
      { "category": "INDUSTRIAL", "count": 10, "percentage": 20 }
    ]
  }
}
```

---

## Services

### GET `/services`
List all services.

**Auth Required:** No

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `include` | string | No | `images,projects,counts` |

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Services retrieved successfully",
  "data": [
    {
      "id": "65f34e7e0a2b3c4d5e6f7890",
      "name": "Architectural Design",
      "slug": "architectural-design",
      "shortDescription": "We design beautiful and functional spaces.",
      "detailedDescription": "...",
      "order": 1,
      "title": "Building Your Vision",
      "description": "...",
      "process": "...",
      "mainTasks": []
    }
  ],
  "total": 10,
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### GET `/services/identifier/:identifier`
Get a single service by ID or slug.

**Auth Required:** No

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Service retrieved successfully",
  "data": {
    "id": "...",
    "name": "Architectural Design",
    "slug": "architectural-design",
    "shortDescription": "...",
    "detailedDescription": "...",
    "order": 1,
    "title": "Building Your Vision",
    "description": "...",
    "process": "...",
    "mainTasks": [],
    "images": [], // if included
    "projects": [], // if included
    "_count": { projects: 15 } // if included
  }
}
```

### POST `/services` (Create)
**Auth Required:** Yes (ADMIN)

**Request Body (CreateServiceDto):**
```json
{
  "name": "Architectural Design",
  "slug": "architectural-design",
  "shortDescription": "We design beautiful and functional spaces.",
  "detailedDescription": "Full detailed description...",
  "order": 1,
  "title": "Building Your Vision",
  "description": "Rich content description...",
  "process": "Our process involves...",
  "mainTasks": [
    { "title": "Site Analysis", "description": "We assess the site conditions thoroughly." }
  ]
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Service created successfully",
  "data": { /* service object */ }
}
```

### PUT `/services/identifier/:identifier` (Update)
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Service updated successfully",
  "data": { /* updated service */ }
}
```

### DELETE `/services/identifier/:identifier` (Delete)
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Service deleted successfully",
  "data": { "message": "Service deleted successfully" }
}
```

---

## Careers (Jobs)

### GET `/careers`
List jobs (published for public, all for admin).

**Auth Required:** No (public sees only published; admin can filter)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `location` | string | No | Filter by location |
| `department` | string | No | Filter by department |
| `type` | string | No | Filter by employment type |
| `published` | string ("true"/"false") | No | Admin only: filter by published status |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Jobs retrieved successfully",
  "data": [
    {
      "id": "65f34e7e0a2b3c4d5e6f7890",
      "slug": "senior-structural-engineer",
      "title": "Senior Structural Engineer",
      "location": "Lagos, Nigeria",
      "employmentType": "Full-time",
      "department": "Engineering",
      "description": "We are looking for an experienced structural engineer...",
      "requirements": "...",
      "responsibilities": "...",
      "isPublished": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "_count": { "applications": 12 }
    }
  ],
  "total": 25,
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### GET `/careers/:identifier`
Get published job by ID or slug (public endpoint).

**Auth Required:** No

**Path Parameters:**
- `identifier` (string) - MongoDB ObjectId or job slug

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Job retrieved successfully",
  "data": {
    "id": "65f34e7e0a2b3c4d5e6f7890",
    "slug": "senior-structural-engineer",
    "title": "Senior Structural Engineer",
    "location": "Lagos, Nigeria",
    "employmentType": "Full-time",
    "department": "Engineering",
    "description": "...",
    "requirements": "...",
    "responsibilities": "...",
    "isPublished": true,
    "publishedAt": "2024-01-11T10:00:00Z",
    "createdAt": "2024-01-10T09:00:00Z",
    "updatedAt": "2024-01-15T14:30:00Z"
  }
}
```

### GET `/careers/identifier/:identifier`
Get job by ID or slug (admin - includes unpublished).

**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Job retrieved successfully",
  "data": {
    "id": "...",
    "slug": "...",
    "title": "...",
    "location": "...",
    "employmentType": "...",
    "department": "...",
    "description": "...",
    "requirements": "...",
    "responsibilities": "...",
    "isPublished": false,
    "createdAt": "...",
    "updatedAt": "...",
    "_count": { applications: 12 }
  }
}
```

### POST `/careers` (Create Job)
**Auth Required:** Yes (ADMIN)

**Request Body (CreateJobDto):**
```json
{
  "title": "Senior Structural Engineer",
  "location": "Lagos, Nigeria",
  "employmentType": "Full-time",
  "department": "Engineering",
  "description": "We are looking for an experienced structural engineer...",
  "requirements": "Bachelor's degree in Civil/Structural Engineering...",
  "responsibilities": "Design and analyze structural systems...",
  "isPublished": false
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Job posting created successfully",
  "data": { /* job object */ }
}
```

### PUT `/careers/identifier/:identifier` (Update Job)
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Job updated successfully",
  "data": { /* updated job */ }
}
```

### DELETE `/careers/identifier/:identifier` (Delete Job)
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Job posting deleted successfully",
  "data": { "message": "Job deleted successfully" }
}
```

### POST `/careers/identifier/:identifier/publish`
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Job posting published successfully",
  "data": {
    "id": "...",
    "slug": "...",
    "title": "...",
    "isPublished": true,
    "publishedAt": "2024-01-15T10:30:00Z"
  }
}
```

### POST `/careers/identifier/:identifier/unpublish`
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Job posting unpublished successfully",
  "data": {
    "id": "...",
    "slug": "...",
    "title": "...",
    "isPublished": false
  }
}
```

### GET `/careers/stats` (Job Statistics)
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Job statistics retrieved successfully",
  "data": {
    "total": 25,
    "published": 18,
    "byDepartment": [
      { "department": "Engineering", "_count": 12 },
      { "department": "Design", "_count": 8 },
      { "department": "Management", "_count": 5 }
    ],
    "byLocation": [
      { "location": "Lagos", "_count": 15 },
      { "location": "Abuja", "_count": 6 },
      { "location": "Port Harcourt", "_count": 4 }
    ],
    "byType": [
      { "employmentType": "Full-time", "_count": 18 },
      { "employmentType": "Contract", "_count": 4 },
      { "employmentType": "Internship", "_count": 3 }
    ]
  }
}
```

---

## Applications

### POST `/applications` (Submit Application)
Public endpoint for job applications.

**Request Body:**
```json
{
  "jobId": "65f34e7e0a2b3c4d5e6f7891",
  "fullName": "Ada Lovelace",
  "email": "ada@example.com",
  "phone": "+2348012345678",
  "coverLetter": "I am excited to apply...",
  "cvUrl": "https://cdn.example.com/cv/ada-lovelace.pdf",
  "cvS3Key": "cvs/ada-lovelace.pdf"
}
```

**Required:** `jobId`, `fullName`, `email`

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Job application submitted successfully",
  "data": {
    "id": "65f34e7e0a2b3c4d5e6f7890",
    "jobId": "65f34e7e0a2b3c4d5e6f7891",
    "fullName": "Ada Lovelace",
    "email": "ada@example.com",
    "phone": "+2348012345678",
    "coverLetter": "I am excited to apply...",
    "cvUrl": "https://cdn.example.com/cv/ada-lovelace.pdf",
    "cvS3Key": "cvs/ada-lovelace.pdf",
    "status": "NEW",
    "notes": null,
    "createdAt": "2024-01-15T14:30:00Z",
    "job": {
      "id": "65f34e7e0a2b3c4d5e6f7891",
      "title": "Senior Structural Engineer",
      "slug": "senior-structural-engineer",
      "department": "Engineering",
      "location": "Lagos, Nigeria",
      "employmentType": "Full-time"
    }
  }
}
```

### GET `/applications` (List All)
**Auth Required:** Yes (ADMIN)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | string | No | Filter by job ID |
| `status` | `NEW` \| `IN_REVIEW` \| `SHORTLISTED` \| `REJECTED` \| `HIRED` | No | Filter by status |
| `department` | string | No | Filter by job department |
| `location` | string | No | Filter by job location |
| `search` | string | No | Search in applicant name/email |
| `page` | number | No | Page number |
| `limit` | number | No | Items per page |

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Applications retrieved successfully",
  "data": [ /* array of applications with job details */ ],
  "total": 150,
  "meta": { /* pagination */ }
}
```

### GET `/applications/:id` (Get Single)
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Application retrieved successfully",
  "data": {
    "id": "...",
    "fullName": "...",
    "email": "...",
    "phone": "...",
    "coverLetter": "...",
    "cvUrl": "...",
    "cvS3Key": "...",
    "status": "NEW",
    "notes": null,
    "createdAt": "...",
    "updatedAt": "...",
    "job": { /* job details */ }
  }
}
```

### PUT `/applications/:id` (Update Status)
**Auth Required:** Yes (ADMIN)

**Request Body:**
```json
{
  "status": "IN_REVIEW",
  "notes": "Strong technical background, good fit for the role."
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Application updated successfully",
  "data": { /* updated application */ }
}
```

### PUT `/applications/bulk-update`
Bulk update application status.

**Auth Required:** Yes (ADMIN)

**Request Body:**
```json
{
  "applicationIds": ["65f34e7e0a2b3c4d5e6f7890", "65f34e7e0a2b3c4d5e6f7891"],
  "status": "SHORTLISTED"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Applications updated successfully",
  "data": {
    "message": "Updated 15 applications to SHORTLISTED",
    "updatedCount": 15
  }
}
```

### DELETE `/applications/:id`
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Application deleted successfully",
  "data": { "message": "Application deleted successfully" }
}
```

### GET `/applications/stats`
Application statistics.

**Auth Required:** Yes (ADMIN)

**Query Parameters:**
- `jobId` (optional) - Get stats for specific job only

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Statistics retrieved successfully",
  "data": {
    "total": 150,
    "byStatus": [
      { "status": "NEW", "_count": 45 },
      { "status": "IN_REVIEW", "_count": 60 },
      { "status": "SHORTLISTED", "_count": 25 },
      { "status": "REJECTED", "_count": 15 },
      { "status": "HIRED", "_count": 5 }
    ],
    "byJob": [
      { "jobId": "65f34e7e0a2b3c4d5e6f7891", "_count": 45 },
      { "jobId": "65f34e7e0a2b3c4d5e6f7892", "_count": 30 }
    ],
    "recentApplications": 12
  }
}
```

### GET `/applications/export`
Export applications (returns array).

**Auth Required:** Yes (ADMIN)

**Query Parameters:**
- `jobId` (optional)
- `status` (optional)

**Response (200):** Array of applications

### GET `/applications/date-range`
Get applications within date range.

**Auth Required:** Yes (ADMIN)

**Query Parameters (body as DTO):**
- `startDate` (ISO date string) - required
- `endDate` (ISO date string) - required
- `jobId` (optional)

**Response (200):** Array of applications

---

## Search

### GET `/search`
Global search across all entities.

**Auth Required:** Public (but applications require admin)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `type` | `projects` \| `services` \| `jobs` \| `applications` | No | Filter to specific entity type |
| `page` | number | No | Page number |
| `limit` | number | No | Items per page |

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Global search completed",
  "data": {
    "projects": [ /* project results */ ],
    "services": [ /* service results */ ],
    "jobs": [ /* job results */ ],
    "applications": [ /* application results (admin only) */ ]
  }
}
```

### GET `/search/projects`
Search projects only.

**Additional parameters:**
- `category` (RESIDENTIAL, COMMERCIAL, INDUSTRIAL)
- `type` (COMPLETED, PLAN_TO_BUY)
- `location`
- `featured` (string "true"/"false")

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Project search completed",
  "data": {
    "data": [ /* projects */ ],
    "total": 15,
    "meta": { /* pagination */ }
  }
}
```

### GET `/search/services`
Search services only.

**Response (200):** Same paginated structure

### GET `/search/jobs`
Search jobs only.

**Additional parameters:**
- `department`
- `location`
- `employmentType`
- `published` (string "true"/"false")

**Response (200):** Same paginated structure

### GET `/search/applications`
Search applications.

**Auth Required:** Yes (ADMIN)

**Query Parameters:**
- `q` (required) - search in name/email
- `status` (optional)
- `jobId` (optional)
- `page`, `limit`

**Response (200):** Same paginated structure

### GET `/search/suggestions`
Get autocomplete suggestions.

**Query Parameters:**
- `q` (required)
- `limit` (optional, default 5)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Suggestions retrieved",
  "data": ["Architectural Design", "Architectural Plans", "Architecture Services"]
}
```

---

## Project Images

### POST `/projects/:projectId/images` (Upload)
**Auth Required:** Yes (ADMIN)

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `files` (array of files, required) - image files
- `captions` (string or string[], optional) - captions for each image

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Images uploaded successfully",
  "data": [
    {
      "id": "img1",
      "projectId": "65f34e7e0a2b3c4d5e6f7890",
      "s3Key": "projects/2024/01/image1.jpg",
      "url": "https://cdn.example.com/projects/2024/01/image1.jpg",
      "caption": "Front view",
      "order": 0,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET `/projects/:projectId/images` (List)
**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Images retrieved successfully",
  "data": [
    {
      "id": "img1",
      "projectId": "...",
      "s3Key": "...",
      "url": "...",
      "caption": "Front view",
      "order": 0
    }
  ]
}
```

### PUT `/projects/:projectId/images/reorder` (Reorder)
**Auth Required:** Yes (ADMIN)

**Request Body:**
```json
{
  "ids": ["img1", "img2", "img3"]
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Images reordered successfully",
  "data": [
    { "id": "img1", "order": 0 },
    { "id": "img2", "order": 1 },
    { "id": "img3", "order": 2 }
  ]
}
```

### PUT `/projects/:projectId/images/:imageId` (Update)
**Auth Required:** Yes (ADMIN)

**Request Body:**
```json
{
  "caption": "Updated caption",
  "order": 0
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Image updated successfully",
  "data": { /* updated image */ }
}
```

### DELETE `/projects/:projectId/images/:imageId`
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Image deleted successfully",
  "data": { "message": "Image deleted successfully" }
}
```

---

## Service Images

Similar to project images but for services.

**Endpoints:**
- `POST /services/:serviceId/images` (upload)
- `GET /services/:serviceId/images` (list)
- `PUT /services/:serviceId/images/reorder` (reorder)
- `PUT /services/:serviceId/images/:imageId` (update)
- `DELETE /services/:serviceId/images/:imageId` (delete)

All follow same patterns as project images.

---

## Project Assets (Documents)

Assets are downloadable documents (PDFs, drawings, reports, etc.) associated with projects and optionally linked to pricing tiers.

### POST `/projects/:projectId/assets` (Upload)
**Auth Required:** Yes (ADMIN)

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `files` (array of files, required)
- `documentType` (enum, required) - one of `ProjectDocumentType` values
- `tierId` (string, optional) - link to pricing tier
- `version` (string, optional) - e.g., "v1"

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Assets uploaded successfully",
  "data": [
    {
      "id": "asset1",
      "projectId": "65f34e7e0a2b3c4d5e6f7890",
      "tierId": "65f34e7e0a2b3c4d5e6f7892",
      "documentType": "ARCHITECTURAL_DRAWINGS",
      "version": "v1",
      "s3Key": "projects/123/drawings/plan.pdf",
      "filename": "architectural-plan.pdf",
      "fileType": "application/pdf",
      "size": 2048576,
      "isDownloadable": true,
      "uploadedBy": {
        "id": "user1",
        "email": "admin@example.com"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET `/projects/:projectId/assets` (List)
**Query Parameters:**
- `tierId` (optional)
- `documentType` (optional)
- `page`, `limit` (pagination)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Assets retrieved successfully",
  "data": [ /* array of assets */ ],
  "total": 15,
  "meta": { /* pagination */ }
}
```

### GET `/projects/:projectId/assets/:assetId`
**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Asset retrieved successfully",
  "data": { /* asset details */ }
}
```

### PUT `/projects/:projectId/assets/:assetId` (Update Metadata)
**Auth Required:** Yes (ADMIN)

**Request Body:**
```json
{
  "isDownloadable": true,
  "version": "v2"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Asset updated successfully",
  "data": { /* updated asset */ }
}
```

### DELETE `/projects/:projectId/assets/:assetId`
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Asset deleted successfully",
  "data": { "message": "Asset deleted successfully" }
}
```

### GET `/projects/:projectId/assets/:assetId/download`
Get signed download URL (customer access via purchase).

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Download URL generated",
  "data": {
    "downloadUrl": "https://cdn.example.com/projects/123/plan.pdf?X-Amz-Expires=3600&Signature=...",
    "expiresIn": 3600
  }
}
```

---

## Project Pricing Tiers

### GET `/projects/:projectId/tiers`
List pricing tiers for a project.

**Query Parameters:**
- `onlyActive` (string "true"/"false") - filter to active tiers only

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Pricing tiers retrieved successfully",
  "data": [
    {
      "id": "tier1",
      "projectId": "65f34e7e0a2b3c4d5e6f7890",
      "name": "Basic Package",
      "description": "Includes site plan and architectural drawings",
      "currency": "NGN",
      "amount": 150000,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "assets": [
        {
          "id": "asset1",
          "filename": "site-plan.pdf",
          "fileType": "application/pdf",
          "size": 2048576
        }
      ]
    }
  ]
}
```

### GET `/projects/:projectId/tiers/:tierId`
**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Pricing tier retrieved successfully",
  "data": { /* tier details with assets */ }
}
```

### POST `/projects/:projectId/tiers` (Create Tier)
**Auth Required:** Yes (ADMIN)

**Request Body (CreatePriceTierDto):**
```json
{
  "name": "Basic Package",
  "description": "Includes site plan and architectural drawings",
  "currency": "NGN",
  "amount": 150000,
  "isActive": true
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Pricing tier created successfully",
  "data": { /* created tier with assets */ }
}
```

### PUT `/projects/:projectId/tiers/:tierId` (Update Tier)
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Pricing tier updated successfully",
  "data": { /* updated tier */ }
}
```

### DELETE `/projects/:projectId/tiers/:tierId`
**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Pricing tier deleted successfully",
  "data": { "message": "Pricing tier deleted successfully" }
}
```

---

## Project Purchases & Payments

### POST `/payments/project-checkout`
Initialize Flutterwave payment for a project tier.

**Request Body:**
```json
{
  "projectId": "65f34e7e0a2b3c4d5e6f7890",
  "tierId": "65f34e7e0a2b3c4d5e6f7892",
  "email": "customer@example.com",
  "fullName": "John Doe"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Payment initialized successfully",
  "data": {
    "paymentLink": "https://flutterwave.co/pay/riec-xyz123",
    "reference": "FLW-REF-123456",
    "message": "Redirect customer to complete payment"
  }
}
```

**Flow:** Redirect user to `paymentLink`. After payment, Flutterwave webhook updates purchase status and sends email with download token.

### POST `/payments/webhook/flutterwave`
Internal webhook (not for frontend use).

### GET `/payments/downloads/:token`
Customer download access via token (from email after successful payment).

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Purchase validated",
  "data": {
    "purchase": {
      "id": "purchase1",
      "project": {
        "id": "project1",
        "title": "Modern Family Villa",
        "slug": "modern-family-villa"
      },
      "tier": {
        "name": "Basic Package",
        "currency": "NGN",
        "amount": 150000
      },
      "status": "COMPLETED",
      "fullName": "John Doe",
      "email": "customer@example.com"
    },
    "assets": [
      {
        "id": "asset1",
        "filename": "architectural-plans.pdf",
        "fileType": "application/pdf",
        "size": 2048576,
        "downloadUrl": "https://cdn.example.com/...?signature=...",
        "documentType": "ARCHITECTURAL_DRAWINGS"
      }
    ]
  }
}
```

### GET `/purchases/my` (My Purchases)
**Auth Required:** Yes (CLIENT, ADMIN, ENGINEER, COMPANY_WORKER)

Retrieve a paginated list of purchases made by the authenticated user. Useful for customers to view their purchase history.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Purchases retrieved successfully",
  "data": [
    {
      "id": "purchase1",
      "project": {
        "id": "project1",
        "title": "Modern Family Villa",
        "slug": "modern-family-villa"
      },
      "tier": {
        "id": "tier1",
        "name": "Basic Package",
        "currency": "NGN",
        "amount": 150000
      },
      "status": "COMPLETED",
      "fullName": "John Doe",
      "email": "customer@example.com",
      "flutterwaveRef": "FLW-REF-123456",
      "createdAt": "2024-01-15T14:30:00Z",
      "updatedAt": "2024-01-15T14:30:00Z"
    }
  ],
  "total": 5,
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

### POST `/projects/:projectId/purchases` (Record Purchase)
**Auth Optional** (called by webhook or admin)

**Request Body (CreatePurchaseDto):**
```json
{
  "tierId": "65f34e7e0a2b3c4d5e6f7892",
  "email": "buyer@example.com",
  "fullName": "John Doe",
  "flutterwaveRef": "FLW-REF-123456",
  "currency": "NGN",
  "amount": 150000
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Purchase recorded successfully",
  "data": {
    "id": "purchase1",
    "projectId": "...",
    "tierId": "...",
    "email": "...",
    "fullName": "...",
    "flutterwaveRef": "...",
    "currency": "NGN",
    "amount": 150000,
    "status": "PENDING",
    "downloadToken": null,
    "createdAt": "..."
  }
}
```

### GET `/projects/:projectId/purchases` (List Project Purchases)
**Auth Required:** Yes (ADMIN)

**Response (200):** Paginated list of purchases

### GET `/projects/:projectId/purchases/:purchaseId`
**Auth Required:** Yes (ADMIN)

**Response (200):** Single purchase with tier details

### PUT `/projects/:projectId/purchases/:purchaseId/status` (Update Status)
**Auth Required:** Yes (ADMIN)

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Purchase status updated successfully",
  "data": { /* updated purchase */ }
}
```

### GET `/projects/:projectId/purchases/:purchaseId/downloads`
Get signed download URLs for purchased assets.

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Download links generated",
  "data": {
    "purchaseId": "purchase1",
    "urls": [
      {
        "assetId": "asset1",
        "filename": "architectural-plans.pdf",
        "documentType": "ARCHITECTURAL_DRAWINGS",
        "url": "https://cdn.example.com/...?signature=..."
      }
    ]
  }
}
```

### POST `/projects/:projectId/purchases/:purchaseId/download-token`
Generate one-time download token.

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Download token generated",
  "data": {
    "token": "dl_6b9d6d2a2a5b4a3b8b9a"
  }
}
```

---

## Favorites

### POST `/favorites/projects/:identifier` (Add to Favorites)

Add a project to the authenticated user's favorites list.

**Auth Required:** Yes (CLIENT, ADMIN, ENGINEER, COMPANY_WORKER)

**Path Parameters:**
- `identifier` (string) - MongoDB ObjectId (24 hex chars) or project slug

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Project added to favorites successfully",
  "data": {
    "id": "fav1",
    "userId": "65f34e7e0a2b3c4d5e6f7000",
    "projectId": "65f34e7e0a2b3c4d5e6f7890",
    "project": {
      "id": "65f34e7e0a2b3c4d5e6f7890",
      "title": "Modern Family Villa",
      "slug": "modern-family-villa",
      "location": "Lekki, Lagos",
      "type": "PLAN_TO_BUY",
      "category": "RESIDENTIAL",
      "featured": true
    },
    "createdAt": "2024-01-15T14:30:00Z"
  }
}
```

**Error (404):** Project not found or not published
**Error (409):** Project is already in favorites

### DELETE `/favorites/projects/:identifier` (Remove from Favorites)

Remove a project from the authenticated user's favorites.

**Auth Required:** Yes (CLIENT, ADMIN, ENGINEER, COMPANY_WORKER)

**Path Parameters:**
- `identifier` (string) - MongoDB ObjectId (24 hex chars) or project slug

**Response (204):** No content

**Error (404):** Favorite not found

### GET `/favorites` (List My Favorites)

Retrieve a paginated list of projects favorited by the authenticated user. Only includes published projects.

**Auth Required:** Yes (CLIENT, ADMIN, ENGINEER, COMPANY_WORKER)

**Query Parameters:**

| Parameter | Type    | Required | Description                      |
|-----------|---------|----------|----------------------------------|
| `page`    | number  | No       | Page number (default: 1)         |
| `limit`   | number  | No       | Items per page (default: 20)     |

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Favorites retrieved successfully",
  "data": [
    {
      "id": "fav1",
      "userId": "65f34e7e0a2b3c4d5e6f7000",
      "projectId": "65f34e7e0a2b3c4d5e6f7890",
      "project": {
        "id": "65f34e7e0a2b3c4d5e6f7890",
        "title": "Modern Family Villa",
        "slug": "modern-family-villa",
        "location": "Lekki, Lagos",
        "type": "PLAN_TO_BUY",
        "category": "RESIDENTIAL",
        "featured": true,
        "isPublished": true
      },
      "createdAt": "2024-01-15T14:30:00Z"
    }
  ],
  "total": 5,
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### GET `/favorites/projects/:identifier/status` (Check Favorite Status)

Check whether the authenticated user has favorited a specific project.

**Auth Required:** Yes (CLIENT, ADMIN, ENGINEER, COMPANY_WORKER)

**Path Parameters:**
- `identifier` (string) - MongoDB ObjectId (24 hex chars) or project slug

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Favorite status retrieved",
  "data": {
    "favorited": true
  }
}
```

---

## User Profile

User profile endpoints allow users to view and update their profile information including profile and cover images.

### GET `/users/profile` (Get Profile)
Retrieve the authenticated user's profile details with related entities.

**Auth Required:** Yes (CLIENT, ADMIN, ENGINEER, COMPANY_WORKER)

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "65f34e7e0a2b3c4d5e6f7000",
    "email": "client@example.com",
    "role": "CLIENT",
    "profileImg": "https://example.com/profile.jpg",
    "coverImg": "https://example.com/cover.jpg",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLoginAt": "2024-01-20T14:15:00Z",
    "updatedAt": "2024-01-21T10:30:00Z",
    "stats": {
      "projectsCount": 2,
      "assignmentsCount": 3,
      "favoritesCount": 5,
      "uploadsCount": 10
    },
    "projects": [
      {
        "id": "proj1",
        "title": "Modern Family Villa",
        "slug": "modern-family-villa",
        "isPublished": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "assignments": [
      {
        "id": "assign1",
        "role": "Engineer",
        "assignedAt": "2024-01-16T09:00:00Z",
        "project": {
          "id": "proj1",
          "title": "Modern Family Villa",
          "slug": "modern-family-villa"
        }
      }
    ]
  }
}
```

---

### PATCH `/users/profile` (Update Profile)
Update the authenticated user's profile image and/or cover image.

**Auth Required:** Yes (CLIENT, ADMIN, ENGINEER, COMPANY_WORKER)

**Request Body (UpdateUserProfileDto):**
```json
{
  "profileImg": "https://example.com/new-profile.jpg",
  "coverImg": "https://example.com/new-cover.jpg"
}
```

**Note:** Only include the fields you want to update. Both fields are optional.

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": "65f34e7e0a2b3c4d5e6f7000",
    "email": "client@example.com",
    "role": "CLIENT",
    "profileImg": "https://example.com/new-profile.jpg",
    "coverImg": "https://example.com/new-cover.jpg",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLoginAt": "2024-01-20T14:15:00Z",
    "updatedAt": "2024-01-21T10:30:00Z"
  }
}
```

---

## Contact

### POST `/contact`

Public contact form submission.

**Request Body:**

```json
{
  "name": "Grace Hopper",
  "email": "grace@example.com",
  "phone": "+2348012345678",
  "company": "RIEC Ltd.",
  "message": "Hello, I would like to request a quote..."
}
```

**Required:** `name`, `email`, `message`

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Contact submission created",
  "data": {
    "id": "65f34e7e0a2b3c4d5e6f7890",
    "name": "Grace Hopper",
    "email": "grace@example.com",
    "phone": "+2348012345678",
    "company": "RIEC Ltd.",
    "message": "Hello, I would like to request a quote...",
    "read": false,
    "createdAt": "2024-01-15T14:30:00Z"
  }
}
```

### GET `/contact/admin/submissions` (List)

**Auth Required:** Yes (ADMIN)

**Query Parameters:**

- `page`, `pageSize` (pagination)

**Response (200):**

```json
{
  "statusCode": 200,
  "message": "Submissions retrieved",
  "data": [
    {
      "id": "...",
      "name": "...",
      "email": "...",
      "phone": "...",
      "company": "...",
      "message": "...",
      "read": false,
      "createdAt": "..."
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 20
}
```

### PATCH `/contact/admin/submissions/:id/read` (Mark as Read)

**Auth Required:** Yes (ADMIN)

**Response (200):**

```json
{
  "statusCode": 200,
  "message": "Submission marked as read",
  "data": {
    "id": "...",
    "name": "...",
    "read": true,
    "updatedAt": "2024-01-16T09:15:00Z"
  }
}
```

---

## Common Patterns

### Pagination

All list endpoints support pagination with consistent response format:

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)

**Response:**

```json
{
  "statusCode": 200,
  "message": "... retrieved successfully",
  "data": [ /* array of items */ ],
  "total": 150,
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Include Parameter

Many GET endpoints support an `include` query parameter to fetch related data in a single request.

**Common include values:**

- `images` - fetch associated images
- `services` - fetch related services
- `assets` - fetch project assets/documents
- `pricingTiers` - fetch pricing tiers
- `owner` - fetch project owner details
- `assignments` - fetch team assignments
- `purchases` - fetch purchase records
- `counts` - fetch counts of related items

**Usage:** `GET /projects/identifier/:identifier?include=images,services`

### API Authentication

Protected endpoints require JWT token in Authorization header:

```text
Authorization: Bearer <access_token>
```

**Roles:**

- `ADMIN` - Full access to all endpoints
- `CLIENT` - Limited access (public endpoints + own purchases)
- `ENGINEER` - Can view projects, assignments
- `COMPANY_WORKER` - Similar to ENGINEER

### Error Responses

All errors follow this format:

**400 Bad Request:**

```json
{
  "statusCode": 400,
  "message": "Validation error - check required fields",
  "data": null
}
```

**401 Unauthorized:**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials or missing token",
  "data": null
}
```

**403 Forbidden:**

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "data": null
}
```

**404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Resource not found with the given identifier",
  "data": null
}
```

---

## Enums Reference

### ProjectType

```text
COMPLETED      // Finished projects (portfolio)
PLAN_TO_BUY    // Construction plans available for purchase
```

### ProjectCategory

```text
RESIDENTIAL    // Housing projects
COMMERCIAL     // Business/commercial projects
INDUSTRIAL     // Industrial projects
```

### JobApplicationStatus

```text
NEW            // Just submitted
IN_REVIEW      // Being reviewed
SHORTLISTED    // Candidate selected for next round
REJECTED       // Application rejected
HIRED          // Candidate hired
```

### ProjectDocumentType

```text
PRESENTATION
PERSPECTIVE
SITE_PLAN
ARCHITECTURAL_DRAWINGS
STRUCTURAL_DRAWINGS
MEP_DRAWINGS
GEOTECHNICAL_REPORT
TOPOGRAPHICAL_SURVEY
BILL_OF_QUANTITIES
BUDGET_ESTIMATE
ENVIRONMENTAL_IMPACT_ASSESSMENT
CONSTRUCTION_PERMIT
LAND_TITLE
SOIL_TEST_REPORT
MATERIAL_SPECIFICATIONS
TENDER_DOCUMENT
CONTRACT_AGREEMENT
PROJECT_SCHEDULE
METHOD_STATEMENT
QUALITY_CONTROL_PLAN
HEALTH_SAFETY_PLAN
```

### PurchaseStatus

```text
PENDING        // Awaiting payment
SUCCESS        // Payment completed
FAILED         // Payment failed
```

### Role

```text
CLIENT              // Can view projects, make purchases
COMPANY_WORKER      // RIEC staff member
ENGINEER            // Engineer with access
ADMIN               // Full administrative access
```

---

## Notes

1. **Identifier Parameters**: Throughout the API, `:identifier` can be either a MongoDB ObjectId (24 hex characters) or a slug string. The backend automatically determines which to use.

2. **Type Filtering**: The `type` query parameter on `/projects` and `/search/projects` distinguishes between COMPLETED (portfolio) and PLAN_TO_BUY (purchasable plans) projects. Omit to get all types.

3. **Purchasable Flag**: Only projects with `purchasable: true` can go through the checkout flow. Both COMPLETED and PLAN_TO_BUY can be purchasable, but typically only PLAN_TO_BUY projects are marked as purchasable.

4. **Published vs Unpublished**: Public endpoints only return `isPublished: true` resources. Admin endpoints can access unpublished items based on filters.

5. **Token Expiry**: JWT tokens expire after the configured duration (default 1 day). Use the `/auth/login` endpoint to obtain a new token.

6. **File Uploads**: All upload endpoints accept `multipart/form-data` with file fields. Maximum file size and count limits are enforced (typically 20 files per request).

7. **Slug Auto-generation**: When creating projects or jobs, the slug is auto-generated from the title. Provide a unique slug in the request if desired, otherwise one will be generated.

8. **Response Structure**: All responses follow the standard structure: `{ statusCode, message, data, ...optional }`. Check `statusCode` for success/failure.

---

## Quick Reference: Client User Flow

### Option A: Email/Password Authentication

1. **Register**: `POST /auth/register-client` → get JWT
2. **Login**: `POST /auth/login` → get JWT (if already registered)

### Option B: Firebase Authentication (Google OAuth)

1. **Firebase Login**: `POST /auth/firebase` with Firebase ID token → get JWT
   - Get ID token from frontend Firebase client SDK after Google sign-in

### Common Flow (After Authentication)

1. **Browse Projects**: `GET /projects?type=PLAN_TO_BUY` (or omit type for all)
2. **View Project**: `GET /projects/identifier/:id?include=pricingTiers,assets`
3. **Initiate Purchase**: `POST /payments/project-checkout` → get payment link
4. **Complete Payment**: Redirect to Flutterwave, wait for webhook
5. **Access Downloads**:
   - Via email link: `GET /payments/downloads/:token`
   - Or logged in: `GET /projects/:projectId/purchases/:purchaseId/downloads`
6. **View Purchase History**: `GET /purchases/my`
7. **Manage Favorites**:
   - Add to favorites: `POST /favorites/projects/:identifier`
   - Remove from favorites: `DELETE /favorites/projects/:identifier`
   - View all favorites: `GET /favorites`
   - Check if favorited: `GET /favorites/projects/:identifier/status`

---

Last Updated: 2026-03-29
API Version: 1.1
