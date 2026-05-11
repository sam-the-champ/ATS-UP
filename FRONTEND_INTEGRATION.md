# Frontend Integration Guide - ATS-UP

Complete guide for integrating your frontend with the ATS-UP backend API.

---

## Table of Contents

1. [API Base URL & Configuration](#api-base-url--configuration)
2. [Authentication Flow](#authentication-flow)
3. [Frontend Architecture](#frontend-architecture)
4. [API Client Setup](#api-client-setup)
5. [Complete API Endpoints](#complete-api-endpoints)
6. [Feature Implementations](#feature-implementations)
7. [Environment Variables](#environment-variables)
8. [Example Code Snippets](#example-code-snippets)
9. [Testing & Debugging](#testing--debugging)

---

## API Base URL & Configuration

### Development
```
API_BASE_URL = http://localhost:5000
API_ENDPOINT = http://localhost:5000/api/v1
```

### Production
```
API_BASE_URL = https://api.yourdomain.com
API_ENDPOINT = https://api.yourdomain.com/api/v1
```

### CORS Configuration
The backend allows requests from:
```
CORS_ORIGIN = http://localhost:3000  (development)
```

For production, update the environment variable to your frontend domain.

---

## Authentication Flow

### 1. **User Registration**

**Endpoint:** `POST /api/v1/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "CANDIDATE"  // or "EMPLOYER" or "ADMIN"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CANDIDATE",
    "createdAt": "2026-05-11T10:00:00Z"
  }
}
```

### 2. **User Login**

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CANDIDATE"
  }
}
```

**Headers Set Automatically:**
- `Set-Cookie: refreshToken=xxx; httpOnly; secure; sameSite=strict`

### 3. **Token Refresh**

**Endpoint:** `POST /api/v1/auth/refresh`

**Method:** Automatic when access token expires

**Response (200):**
```json
{
  "accessToken": "new_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. **Logout**

**Endpoint:** `POST /api/v1/auth/logout`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### Token Management

**Access Token:**
- Validity: 15 minutes
- Location: Response body (store in memory or localStorage)
- Usage: Include in all protected requests

**Refresh Token:**
- Validity: 7 days
- Location: httpOnly cookie (automatically sent)
- Usage: Automatic token renewal

---

## Frontend Architecture

### Recommended Stack

**React + TypeScript**
```
Frontend Structure:
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios/Fetch configuration
│   │   ├── auth.api.ts        # Auth endpoints
│   │   ├── jobs.api.ts        # Job endpoints
│   │   ├── applications.api.ts  # Application endpoints
│   │   └── users.api.ts       # User endpoints
│   ├── hooks/
│   │   ├── useAuth.ts         # Auth context hook
│   │   ├── useJobs.ts         # Jobs data fetching
│   │   └── useFetch.ts        # Generic fetch hook
│   ├── context/
│   │   └── AuthContext.tsx    # Auth state management
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── JobList.tsx
│   │   ├── JobDetail.tsx
│   │   ├── PostJob.tsx
│   │   ├── Applications.tsx
│   │   └── Dashboard.tsx
│   ├── components/
│   │   ├── ProtectedRoute.tsx
│   │   ├── JobCard.tsx
│   │   ├── ApplicationCard.tsx
│   │   └── ...
│   └── types/
│       └── index.ts
```

---

## API Client Setup

### Using Axios (Recommended)

**`src/api/client.ts`**
```typescript
import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: sends cookies (refreshToken)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add access token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Store new access token
        localStorage.setItem('accessToken', response.data.accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Using Fetch API (Alternative)

```typescript
class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('accessToken');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });

    if (response.status === 401) {
      // Token expired, attempt refresh
      const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem('accessToken', data.accessToken);
        
        // Retry original request
        headers.Authorization = `Bearer ${data.accessToken}`;
        return this.request<T>(endpoint, { ...options, headers });
      } else {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
```

---

## Complete API Endpoints

### Authentication

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login user |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ✅ | Logout user |

### Users

| Method | Endpoint | Protected | Role | Description |
|--------|----------|-----------|------|-------------|
| GET | `/users/profile` | ✅ | Any | Get authenticated user profile |

### Jobs

| Method | Endpoint | Protected | Role | Description |
|--------|----------|-----------|------|-------------|
| GET | `/jobs` | ❌ | Any | List all open jobs |
| GET | `/jobs/:jobId` | ❌ | Any | Get job details |
| POST | `/jobs` | ✅ | EMPLOYER | Create job posting |
| PATCH | `/jobs/:jobId` | ✅ | EMPLOYER | Update job (owner only) |
| DELETE | `/jobs/:jobId` | ✅ | EMPLOYER | Delete job (owner only) |
| GET | `/jobs/employer/my-jobs` | ✅ | EMPLOYER | Get employer's jobs |

### Applications

| Method | Endpoint | Protected | Role | Description |
|--------|----------|-----------|------|-------------|
| POST | `/applications` | ✅ | CANDIDATE | Submit application |
| GET | `/applications/candidate/my-applications` | ✅ | CANDIDATE | Get candidate's applications |
| GET | `/applications/job/:jobId` | ✅ | EMPLOYER | Get job applications (ranked by score) |
| GET | `/applications/:applicationId` | ✅ | Any | Get application details |
| GET | `/applications/upload/presigned-url?fileName=resume.pdf&fileType=application/pdf` | ✅ | Any | Get S3 presigned URL for upload |

### Health & Status

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| GET | `/health` | ❌ | API health check |

---

## Feature Implementations

### 1. **Authentication System**

**Required Screens:**
- Sign Up Form (with role selection)
- Sign In Form
- Password validation
- "Remember me" optional

**Key Features:**
- Store access token in memory or localStorage
- Validate email format
- Password strength requirements (min 8 chars)
- Error handling for duplicate emails
- Auto-redirect on successful login/signup

### 2. **Job Browsing (Public)**

**Required Screens:**
- Job list page (paginated)
- Job detail page
- Search & filter (by location, status)
- Sorting (newest first)

**Data to Display:**
- Job title, description, location
- Salary range
- Employer info
- Application count

### 3. **Job Management (Employer)**

**Required Screens:**
- Create job form
- Edit job form
- My jobs list
- Job details with applications

**Features:**
- Rich text editor for job description
- Validate required fields via Zod
- Show application status
- Filter/search applications

### 4. **Application Management (Candidate)**

**Required Screens:**
- Apply for job page (with resume upload)
- My applications list
- Application details with AI score

**Features:**
- Resume upload to S3 (using presigned URLs)
- Real-time file upload progress
- Show AI score & reasoning
- Track application status (pending → completed)

### 5. **Job Applications Ranking (Employer)**

**Features:**
- Automatically rank applications by AI score (highest first)
- Filter by score range (90-100, 70-89, etc.)
- Sort by recency
- Show candidate resume link
- Download capabilities

### 6. **User Profile**

**Features:**
- Display user info (email, role, joined date)
- Edit profile (future enhancement)
- Logout button

---

## Environment Variables

**`.env.local` or `.env` for frontend:**

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_ENVIRONMENT=development

# AWS S3 (if needed on frontend for direct uploads)
REACT_APP_AWS_REGION=us-east-1
REACT_APP_AWS_BUCKET_NAME=your-bucket-name

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
```

---

## Example Code Snippets

### 1. **Auth Context (React + TypeScript)**

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useEffect, useState } from 'react';
import apiClient from '../api/client';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYER' | 'CANDIDATE';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/users/profile');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('accessToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', response.data.accessToken);
    setUser(response.data.user);
  };

  const register = async (email: string, password: string, role: string) => {
    await apiClient.post('/auth/register', { email, password, role });
    // Auto-login after registration
    await login(email, password);
  };

  const logout = async () => {
    await apiClient.post('/auth/logout', {});
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2. **Protected Route Component**

```typescript
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'EMPLOYER' | 'CANDIDATE';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

### 3. **Job List Component**

```typescript
// src/pages/JobList.tsx
import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salaryRange?: string;
  status: string;
  createdAt: string;
  _count: { applications: number };
}

export const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/jobs');
      setJobs(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading jobs...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Available Jobs ({jobs.length})</h1>
      {jobs.map((job) => (
        <div key={job.id} style={{ border: '1px solid #ccc', padding: '16px', marginBottom: '12px' }}>
          <h2>{job.title}</h2>
          <p>{job.description}</p>
          <p>📍 {job.location}</p>
          {job.salaryRange && <p>💰 {job.salaryRange}</p>}
          <p>Applications: {job._count.applications}</p>
          <a href={`/jobs/${job.id}`}>View Details</a>
        </div>
      ))}
    </div>
  );
};
```

### 4. **Resume Upload Component**

```typescript
// src/components/ResumeUpload.tsx
import React, { useState } from 'react';
import apiClient from '../api/client';

export const ResumeUpload: React.FC<{ jobId: string; onSuccess: () => void }> = ({ 
  jobId, 
  onSuccess 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    try {
      setIsUploading(true);

      // Step 1: Get presigned URL from backend
      const presignedResponse = await apiClient.get(
        `/applications/upload/presigned-url?fileName=${file.name}&fileType=${file.type}`
      );
      const { signedUrl, key } = presignedResponse.data;

      // Step 2: Upload to S3 using presigned URL
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      // Step 3: Submit application with S3 URL
      const s3Url = `https://${process.env.REACT_APP_AWS_BUCKET_NAME}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/${key}`;
      
      await apiClient.post('/applications', {
        jobId,
        resumeUrl: s3Url,
      });

      alert('Application submitted successfully!');
      onSuccess();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".pdf" 
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? `Uploading... ${progress}%` : 'Upload Resume & Apply'}
      </button>
    </div>
  );
};
```

### 5. **Application Ranking (Employer View)**

```typescript
// src/pages/ApplicationsForJob.tsx
import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';

interface Application {
  id: string;
  candidateId: string;
  resumeUrl: string;
  aiScore: number | null;
  status: string;
  createdAt: string;
  candidate: { id: string; email: string };
}

export const ApplicationsForJob: React.FC<{ jobId: string }> = ({ jobId }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      const response = await apiClient.get(`/applications/job/${jobId}`);
      // Already ranked by AI score (highest first)
      setApplications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch applications', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading applications...</div>;

  return (
    <div>
      <h2>Applications (Ranked by AI Score)</h2>
      {applications.length === 0 ? (
        <p>No applications yet</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Rank</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Candidate</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>AI Score</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Resume</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, index) => (
              <tr key={app.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>#{index + 1}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {app.candidate.email}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <strong>
                    {app.aiScore !== null ? `${app.aiScore.toFixed(1)}/100` : 'Processing...'}
                  </strong>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {app.status}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

---

## Testing & Debugging

### Test Credentials (Development)

```
Candidate:
- Email: candidate@test.com
- Password: Password123!
- Role: CANDIDATE

Employer:
- Email: employer@test.com
- Password: Password123!
- Role: EMPLOYER
```

### Browser DevTools

**1. Check Network Requests:**
- Open DevTools → Network tab
- Monitor all API calls
- Check response status codes
- Verify headers (Authorization token)

**2. Check Local Storage:**
```javascript
// In browser console
localStorage.getItem('accessToken')
localStorage.removeItem('accessToken')  // Clear token
```

**3. Check Cookies:**
```javascript
// View refresh token cookie
document.cookie
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token expired/missing | Ensure `withCredentials: true` for refresh |
| CORS Error | Frontend not in CORS_ORIGIN | Update backend `.env` with frontend URL |
| 403 Forbidden | Insufficient permissions | Verify user role matches required role |
| File Upload Failed | Presigned URL expired | URLs expire after 1 hour, get new one |
| Token not refreshing | Refresh endpoint not called | Check interceptors are configured |

### Postman Testing

**1. Register User:**
```
POST http://localhost:5000/api/v1/auth/register
Body:
{
  "email": "test@example.com",
  "password": "Password123!",
  "role": "CANDIDATE"
}
```

**2. Login:**
```
POST http://localhost:5000/api/v1/auth/login
Body:
{
  "email": "test@example.com",
  "password": "Password123!"
}
```

**3. Get Profile (with token):**
```
GET http://localhost:5000/api/v1/users/profile
Headers: Authorization: Bearer {{accessToken}}
```

---

## Recommended Frontend Tech Stack

### Core
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router v6** - Navigation
- **Axios** or **React Query** - API layer

### State Management
- **Context API** - Auth state
- **React Query** or **SWR** - Server state

### Styling
- **Tailwind CSS** - Utility-first CSS
- **Material-UI** - Component library

### Form Handling
- **React Hook Form** - Form state
- **Zod** - Validation (same as backend)

### Development
- **Vite** - Build tool
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Example Package.json Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "axios": "^1.4.0",
    "@tanstack/react-query": "^4.29.0",
    "zod": "^3.21.0"
  },
  "devDependencies": {
    "typescript": "^5.1.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "vite": "^4.4.0"
  }
}
```

---

## Start Frontend Development

### 1. Create React App with Vite

```bash
npm create vite@latest ats-frontend -- --template react-ts
cd ats-frontend
npm install
```

### 2. Install Dependencies

```bash
npm install axios react-router-dom zod @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Create API Client

```bash
mkdir -p src/api src/context src/pages src/components
# Create files from above examples
```

### 4. Run Development Server

```bash
npm run dev
# Runs on http://localhost:5173 or http://localhost:3000
```

### 5. Test API Connection

```typescript
// src/App.tsx
import { useEffect, useState } from 'react';
import apiClient from './api/client';

export default function App() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    apiClient.get('/health')
      .then(res => setHealth(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>ATS-UP Frontend</h1>
      <p>Backend Status: {health ? '✅ Connected' : '❌ Disconnected'}</p>
    </div>
  );
}
```

---

## Key Integration Points Summary

| Feature | Frontend Task | Backend Endpoint |
|---------|---------------|------------------|
| **Sign Up** | Form + validation | POST `/auth/register` |
| **Sign In** | Form + store token | POST `/auth/login` |
| **Profile** | Display user info | GET `/users/profile` |
| **List Jobs** | Fetch & display | GET `/jobs` |
| **Job Details** | Show full info + apply btn | GET `/jobs/:id` |
| **Create Job** | Rich form editor | POST `/jobs` |
| **Apply** | Resume upload + submit | POST `/applications` + PUT S3 |
| **View Applications** | List + filter + sort | GET `/applications/job/:id` |
| **AI Scoring** | Display score & ranking | Automatic (backend) |
| **Logout** | Clear token + redirect | POST `/auth/logout` |

---

## Production Deployment Checklist

- [ ] Update `REACT_APP_API_URL` to production backend
- [ ] Enable analytics in `.env`
- [ ] Configure error tracking (Sentry)
- [ ] Set up logging
- [ ] Enable HTTPS
- [ ] Configure CSP headers
- [ ] Build optimized bundle: `npm run build`
- [ ] Test all auth flows
- [ ] Verify CORS allows production domain
- [ ] Test file uploads to S3
- [ ] Load test with multiple concurrent users
- [ ] Set up monitoring & alerting

---

## Support & Questions

For API-related issues, refer to the backend README.md or contact the backend team.
For frontend-specific help, consult React documentation and the examples above.