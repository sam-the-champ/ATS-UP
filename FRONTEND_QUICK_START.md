# Frontend Development Quick Start

## 🚀 Quick Setup (5 minutes)

```bash
# 1. Create project
npm create vite@latest ats-frontend -- --template react-ts
cd ats-frontend

# 2. Install dependencies
npm install axios react-router-dom zod @tanstack/react-query

# 3. Create structure
mkdir -p src/api src/context src/pages src/components src/types

# 4. Start dev server
npm run dev
```

---

## 📋 Core Implementation Checklist

### Phase 1: Authentication (Day 1)
- [ ] Create `src/api/client.ts` (Axios with interceptors)
- [ ] Create `src/context/AuthContext.tsx`
- [ ] Create Login page
- [ ] Create Register page
- [ ] Create ProtectedRoute component
- [ ] Test login/register flow

### Phase 2: Job Management (Day 2-3)
- [ ] List all jobs (public)
- [ ] Job detail page
- [ ] Search/filter jobs
- [ ] Create job form (employers)
- [ ] Edit job form (employers)
- [ ] My jobs list (employers)

### Phase 3: Applications (Day 3-4)
- [ ] Apply for job form with resume upload
- [ ] Presigned URL integration
- [ ] S3 file upload
- [ ] My applications list (candidates)
- [ ] Applications ranked by AI score (employers)
- [ ] Application detail view

### Phase 4: Polish (Day 5)
- [ ] Error handling & toasts
- [ ] Loading states
- [ ] Responsive design
- [ ] Performance optimization
- [ ] User profile page

---

## 🔌 API Quick Reference

### Auth Endpoints
```
POST   /auth/register          → Create account
POST   /auth/login             → Get tokens
POST   /auth/refresh           → Refresh token (auto)
POST   /auth/logout            → Logout
```

### Job Endpoints
```
GET    /jobs                   → List all jobs
GET    /jobs/:jobId            → Get job details
POST   /jobs                   → Create job (EMPLOYER)
PATCH  /jobs/:jobId            → Update job (EMPLOYER)
DELETE /jobs/:jobId            → Delete job (EMPLOYER)
GET    /jobs/employer/my-jobs  → Get my jobs (EMPLOYER)
```

### Application Endpoints
```
POST   /applications                             → Apply for job (CANDIDATE)
GET    /applications/candidate/my-applications   → My applications (CANDIDATE)
GET    /applications/job/:jobId                  → Job applications (EMPLOYER)
GET    /applications/:applicationId              → Application details
GET    /applications/upload/presigned-url        → Get S3 upload URL
```

### User Endpoints
```
GET    /users/profile          → Get user info
```

---

## 🔐 Authentication Pattern

```typescript
// 1. USER SIGNS UP
POST /auth/register
← { user: {...}, message: "..." }

// 2. USER LOGS IN
POST /auth/login
← { accessToken: "jwt...", user: {...} }
// Also sets: Set-Cookie: refreshToken=...

// 3. STORE TOKEN IN CODE
localStorage.setItem('accessToken', response.data.accessToken)

// 4. USE TOKEN IN REQUESTS (auto via interceptor)
Authorization: Bearer ${accessToken}

// 5. TOKEN EXPIRES (15m)
// Interceptor catches 401 → calls /auth/refresh automatically
POST /auth/refresh (with refreshToken cookie)
← { accessToken: "new_jwt..." }

// 6. LOGOUT
POST /auth/logout
// localStorage.removeItem('accessToken')
// Cookie cleared automatically
```

---

## 📂 Component Structure

```typescript
// App.tsx
<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  </AuthProvider>
</BrowserRouter>

// For role-based access
<ProtectedRoute requiredRole="EMPLOYER">
  <JobManagement />
</ProtectedRoute>
```

---

## 🎯 Features by Role

### CANDIDATE
- ✅ Browse jobs
- ✅ Apply for jobs (with resume)
- ✅ View my applications
- ✅ Check AI score on my applications
- ✅ Track application status

### EMPLOYER
- ✅ Create/edit/delete job postings
- ✅ View applications for my jobs
- ✅ See AI-ranked candidates (by score)
- ✅ Access candidate resumes
- ✅ Filter candidates by score

### ADMIN (Future)
- ✅ Manage users
- ✅ System analytics
- ✅ Database management

---

## 🎨 UI Components to Build

```
Pages:
├── Login.tsx
├── Register.tsx
├── Dashboard.tsx
├── JobList.tsx
├── JobDetail.tsx
├── JobForm.tsx (create/edit)
├── MyJobs.tsx (employer)
├── ApplyJob.tsx (with resume upload)
├── MyApplications.tsx
├── ApplicationsList.tsx (employer view)
├── Profile.tsx
└── NotFound.tsx

Components:
├── ProtectedRoute.tsx
├── JobCard.tsx
├── ApplicationCard.tsx
├── Header.tsx
├── Navbar.tsx
├── LoadingSpinner.tsx
├── ErrorAlert.tsx
└── SuccessToast.tsx
```

---

## 🔧 Key Implementation Details

### Axios Interceptor Pattern
```typescript
// Auto-attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token if expired
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Call refresh endpoint
      const newToken = await refresh();
      localStorage.setItem('accessToken', newToken);
      // Retry original request
    }
  }
);
```

### File Upload to S3
```typescript
// Step 1: Get presigned URL
const presigned = await apiClient.get(
  `/applications/upload/presigned-url?fileName=${file.name}&fileType=application/pdf`
);
const { signedUrl, key } = presigned.data;

// Step 2: Upload file to S3
await fetch(signedUrl, { method: 'PUT', body: file });

// Step 3: Submit application
await apiClient.post('/applications', {
  jobId,
  resumeUrl: `https://bucket.s3.region.amazonaws.com/${key}`
});
```

### Candidate Ranking (Auto-sorted by backend)
```typescript
// Employers see applications ranked by AI score (highest first)
const applications = await apiClient.get(`/applications/job/${jobId}`);
// Result: [{ aiScore: 95 }, { aiScore: 87 }, { aiScore: 72 }, ...]
```

---

## 📱 Responsive Breakpoints

```css
Mobile:     < 640px
Tablet:     640px - 1024px
Desktop:    > 1024px
```

---

## ⚠️ Common Pitfalls to Avoid

| ⚠️ | Issue | ✅ Solution |
|---|-------|-----------|
| **CORS Error** | Frontend domain not allowed | Update backend `.env` CORS_ORIGIN |
| **401 Loop** | Token interceptor not working | Ensure `withCredentials: true` |
| **Missing Token** | Not storing token after login | Save to localStorage immediately |
| **Token Leak** | Storing token in sessionStorage | Use memory + httpOnly cookies only |
| **Expired Token** | No auto-refresh | Implement response interceptor |
| **File Upload Fails** | Wrong S3 bucket/permissions | Verify AWS credentials on backend |
| **CORS on Upload** | S3 CORS not configured | Configure bucket CORS settings |

---

## 🧪 Testing with Postman

1. **Set base URL:** `http://localhost:5000/api/v1`
2. **Register:** `POST /auth/register` with test email
3. **Login:** `POST /auth/login` → copy accessToken
4. **Create job:** `POST /jobs` with Bearer token
5. **List jobs:** `GET /jobs` (public, no token needed)
6. **Apply for job:** `POST /applications` with jobId & resumeUrl

---

## 📊 Data Flow

```
┌─────────────┐
│  Frontend   │
├─────────────┤
│   React     │ POST /auth/login | { email, password }
│  + TypeScript│ ←──────────────────────────────┐
│   + Axios   │ { accessToken, user }           │
│             │                                  │
│             │ GET /jobs                       │
│             │ ←────────┐                      │
│         ┌───┴─────────┐│                      │
│         │             ││                    ┌─┴──────┐
│         └─────────────┘│                    │ Backend│
└─────────────┬──────────┘                    │Express │
          ┌───┴────────────────────────────→ │Node.js │
          │                                    ├────────┤
      HTTP│API calls                          │Database│
    (REST)│                                    │Postgres│
          │                                    │        │
          └──────────────────────────────────→ │Redis   │
                                               │        │
                                               │ S3     │
                                               │ (AWS)  │
                                               │        │
                                               │Gemini  │
                                               │(AI)    │
                                               └────────┘
```

---

## 🚦 Development Workflow

1. **Create API client** → Test connection
2. **Setup auth context** → Test login/register
3. **Build job listing** → Test data fetching
4. **Build job form** → Test create/edit
5. **Build application flow** → Test file upload
6. **Add error handling** → Full error scenarios
7. **Polish UI** → Responsive, loading states
8. **Deploy to Vercel/Netlify** → Test in production

---

## 🔗 Important URLs

**Development:**
- Frontend: `http://localhost:3000` (or 5173)
- Backend: `http://localhost:5000`
- API: `http://localhost:5000/api/v1`

**Production (Change in `.env`):**
- Frontend: `https://your-domain.com`
- Backend: `https://api.your-domain.com`
- API: `https://api.your-domain.com/api/v1`

---

## 📝 Example .env.local

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_AWS_REGION=us-east-1
REACT_APP_AWS_BUCKET_NAME=your-ats-bucket
REACT_APP_ENVIRONMENT=development
```

---

## 🎓 Learning Resources

- **React Docs:** https://react.dev
- **React Router:** https://reactrouter.com
- **Axios:** https://axios-http.com
- **TypeScript:** https://www.typescriptlang.org
- **Zod Validation:** https://zod.dev
- **AWS S3:** https://docs.aws.amazon.com/s3/

---

## 💡 Pro Tips

1. **Use React Query** for caching & refetching data
2. **Create custom hooks** for API calls (useJobs, useApplications)
3. **Use Toast notifications** for success/error messages
4. **Implement optimistic updates** for better UX
5. **Add request debouncing** for search fields
6. **Paginate job lists** for performance
7. **Lazy load components** with React.lazy()
8. **Monitor API errors** in production with Sentry

---

Generated: May 11, 2026 | For ATS-UP Backend v1.0.0