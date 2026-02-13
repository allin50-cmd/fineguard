# FineGuard Platform - Complete Services & Apps Inventory

## 🏗️ Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FineGuard Platform                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Frontend   │  │   Backend    │  │   Database   │         │
│  │   (React)    │──│   (Node.js)  │──│ (PostgreSQL) │         │
│  │   Port 3000  │  │   Port 3001  │  │   Port 5432  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                           │                                      │
│                    ┌──────┴──────┐                              │
│                    ▼             ▼                               │
│            ┌──────────┐   ┌──────────┐                         │
│            │  Redis   │   │ External │                         │
│            │  Cache   │   │   APIs   │                         │
│            │Port 6379 │   └──────────┘                         │
│            └──────────┘        │                                │
│                                ├─ Companies House API           │
│                                ├─ SMTP Server (Email)           │
│                                └─ Future: Document Storage      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Core Services (Current Deployment)

### 1. **Backend API Service** (Node.js/Express)
- **Container**: `fineguard-api`
- **Port**: 3001
- **Technology**: Node.js 18, Express.js
- **Dependencies**: 
  - PostgreSQL (database)
  - Redis (caching/sessions)
  - Companies House API (external)
  - SMTP Server (email notifications)
- **Key Features**:
  - JWT authentication
  - RESTful API (23 endpoints)
  - Compliance health scoring
  - Companies House integration
  - Deadline detection engine
  - Multi-channel notifications
  - File upload handling
  - Session management
- **Environment Variables Required**:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `COMPANIES_HOUSE_API_KEY`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - `REDIS_URL`
  - `NODE_ENV`
  - `PORT`

### 2. **Frontend Web App** (React)
- **Container**: `fineguard-frontend`
- **Port**: 3000
- **Technology**: React 18, Vite, TailwindCSS
- **Dependencies**: Backend API
- **Key Features**:
  - Client portal (login/dashboard)
  - Case management interface
  - Document upload/download
  - Compliance health dashboard
  - Deadline tracking
  - Notification center
  - Responsive design
- **Environment Variables Required**:
  - `VITE_API_URL` (http://localhost:3001)

### 3. **PostgreSQL Database**
- **Container**: `fineguard-db`
- **Port**: 5432
- **Technology**: PostgreSQL 15
- **Storage**: Persistent volume (pgdata)
- **Databases**:
  - `fineguard` (main database)
- **Tables** (17 total):
  - users
  - clients
  - cases
  - documents
  - case_deadlines
  - case_notes
  - case_tags
  - case_milestones
  - time_entries
  - compliance_health_scores
  - compliance_filings
  - client_notifications
  - audit_logs
  - file_uploads
  - user_sessions
  - password_resets
- **Migrations**: 15 applied
- **Backup**: Manual (needs automation)

### 4. **Redis Cache**
- **Container**: `fineguard-redis`
- **Port**: 6379
- **Technology**: Redis 7 Alpine
- **Purpose**: 
  - Session storage
  - API response caching
  - Rate limiting
  - Background job queuing (future)
- **Persistence**: Optional (currently in-memory)

---

## 🔧 Backend Services Breakdown

### Core Services (4 files)
1. **companiesHouse.js** - Companies House API client
   - Methods: getCompanyProfile, getFilingHistory, getOfficers, getPSCs, search, syncCompanyData
   
2. **companiesHouseSync.js** - Data sync orchestration
   - Methods: syncClient, syncPendingClients, updateClientRecord, importFilingHistory
   
3. **deadlineDetection.js** - Deadline detection engine
   - Methods: detectClientDeadlines, detectAllClientDeadlines, calculatePriority, getUpcomingDeadlines
   
4. **notifications.js** - Multi-channel notification system
   - Methods: sendDeadlineReminder, sendBulkReminders, createInAppNotification, sendEmail

### API Routes (6 files)
1. **auth.js** - Authentication endpoints (login, register, logout)
2. **clients.js** - Client management CRUD
3. **cases.js** - Case management operations
4. **compliance.js** - Health scoring (3 endpoints)
5. **companiesHouse.js** - CH integration (6 endpoints)
6. **automation.js** - Workflow automation (10 endpoints)

### Automation Scripts (1 file)
1. **runAutomation.js** - CLI automation runner
   - Features: Full sync, deadline detection, notifications
   - Cron-ready with command-line arguments

---

## 🌐 External Services & APIs

### 1. **Companies House API**
- **Provider**: UK Companies House
- **Endpoint**: https://api.company-information.service.gov.uk
- **Authentication**: Basic Auth (API Key)
- **Rate Limits**: 600 requests/5 minutes
- **Usage**:
  - Company profile sync
  - Filing history retrieval
  - Officers and PSC data
  - Company search
- **Cost**: FREE (with API key)
- **Status**: API key needs validation ⚠️

### 2. **SMTP Email Service**
- **Provider**: TBD (Gmail, SendGrid, AWS SES, etc.)
- **Purpose**: Deadline notifications, alerts
- **Status**: Not configured yet ⚠️
- **Options**:
  - **Gmail SMTP**: FREE (500 emails/day limit)
  - **SendGrid**: $14.95/mo (40k emails/month)
  - **AWS SES**: $0.10/1000 emails
  - **Mailgun**: $35/mo (50k emails)

### 3. **File Storage** (Future)
- **Current**: Local filesystem
- **Recommended**: Azure Blob Storage
- **Purpose**: Client documents, case files
- **Estimated Cost**: $0.018/GB/month

---

## 💰 Azure Deployment - Service Requirements

### **Option 1: Azure Container Apps** (Recommended - Cost Effective)

#### Services to Deploy:
1. **Azure Container Apps** (4 containers)
   - fineguard-frontend
   - fineguard-api
   - fineguard-redis
   - fineguard-automation (cron job)
   - **Cost**: ~$25-50/month

2. **Azure Database for PostgreSQL** (Flexible Server)
   - Basic tier: 1-2 vCores, 32-64GB storage
   - **Cost**: ~$25-60/month

3. **Azure Container Registry** (ACR)
   - Store Docker images
   - **Cost**: ~$5/month (Basic tier)

4. **Azure Load Balancer** (included with Container Apps)
   - **Cost**: Included

5. **Azure DNS** (optional)
   - Custom domain
   - **Cost**: ~$0.50/month

**Total Estimated Cost**: **$55-120/month**

---

### **Option 2: Azure App Service** (Traditional)

#### Services to Deploy:
1. **Azure App Service** (2 instances)
   - Web App for Frontend (React)
   - Web App for Backend (Node.js)
   - **Cost**: ~$55/month each = $110/month

2. **Azure Database for PostgreSQL**
   - Same as Option 1
   - **Cost**: ~$25-60/month

3. **Azure Cache for Redis**
   - Basic tier (250MB)
   - **Cost**: ~$16/month

4. **Azure Storage Account**
   - File storage
   - **Cost**: ~$1-5/month

**Total Estimated Cost**: **$150-190/month**

---

### **Option 3: Azure Kubernetes Service (AKS)** (Enterprise)

#### Services to Deploy:
1. **AKS Cluster** (2 nodes)
   - Standard_B2s VMs
   - **Cost**: ~$70/month

2. **Azure Database for PostgreSQL**
   - Same as above
   - **Cost**: ~$25-60/month

3. **Azure Load Balancer**
   - **Cost**: ~$18/month

4. **Azure Container Registry**
   - **Cost**: ~$5/month

**Total Estimated Cost**: **$120-155/month**

---

## 🎯 Recommended Azure Services List

### **TIER 1: Essential Services** (Required for MVP)

| Service | Azure Service Name | Purpose | Monthly Cost |
|---------|-------------------|---------|--------------|
| Frontend Hosting | Azure Container App | React web app | $10-20 |
| Backend API | Azure Container App | Node.js API | $15-30 |
| Database | Azure PostgreSQL Flexible Server | Data storage | $25-60 |
| Redis Cache | Azure Container App (Redis) | Session/cache | $5-10 |
| Container Registry | Azure Container Registry (Basic) | Docker images | $5 |
| **TOTAL** | | | **$60-125/month** |

### **TIER 2: Production Services** (Recommended)

| Service | Azure Service Name | Purpose | Monthly Cost |
|---------|-------------------|---------|--------------|
| All Tier 1 | (see above) | Core platform | $60-125 |
| Email Service | SendGrid (Azure Marketplace) | Notifications | $15 |
| File Storage | Azure Blob Storage | Documents | $2-5 |
| CDN | Azure CDN | Fast static assets | $5-10 |
| Application Insights | Azure Monitor | Logging/monitoring | $5-15 |
| Key Vault | Azure Key Vault | Secrets management | $1 |
| **TOTAL** | | | **$88-171/month** |

### **TIER 3: Enterprise Services** (Optional)

| Service | Azure Service Name | Purpose | Monthly Cost |
|---------|-------------------|---------|--------------|
| All Tier 2 | (see above) | Production platform | $88-171 |
| Azure AD B2C | Azure Active Directory B2C | Enterprise SSO | $1.50/1000 users |
| Azure Backup | Azure Backup | Database backups | $10-20 |
| Azure DNS | Azure DNS | Custom domain | $0.50 |
| Azure Front Door | Azure Front Door | Global CDN + WAF | $35-50 |
| Logic Apps | Azure Logic Apps | Automation workflows | $10-20 |
| **TOTAL** | | | **$145-262/month** |

---

## 🚀 Azure Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Azure Cloud                                │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Azure Front Door (Optional)                  │    │
│  │         • WAF                                        │    │
│  │         • SSL/TLS                                    │    │
│  │         • Custom Domain                              │    │
│  └────────────────┬────────────────────────────────────┘    │
│                   │                                           │
│  ┌────────────────┴────────────────────────────────┐        │
│  │     Azure Container Apps Environment             │        │
│  ├─────────────────────────────────────────────────┤        │
│  │                                                   │        │
│  │  ┌──────────────┐  ┌──────────────┐            │        │
│  │  │   Frontend   │  │   Backend    │            │        │
│  │  │  Container   │  │   Container  │            │        │
│  │  │   (React)    │──│  (Node.js)   │            │        │
│  │  └──────────────┘  └──────┬───────┘            │        │
│  │                            │                     │        │
│  │  ┌──────────────┐         │                     │        │
│  │  │    Redis     │◄────────┘                     │        │
│  │  │  Container   │                               │        │
│  │  └──────────────┘                               │        │
│  │                                                   │        │
│  │  ┌──────────────┐                               │        │
│  │  │  Automation  │  (Cron Job)                   │        │
│  │  │   Worker     │                               │        │
│  │  └──────────────┘                               │        │
│  └──────────────────┬───────────────────────────┬──┘        │
│                     │                           │            │
│  ┌──────────────────▼─────┐  ┌────────────────▼───────┐    │
│  │  PostgreSQL Database   │  │   Azure Blob Storage   │    │
│  │  (Flexible Server)     │  │   (Documents)          │    │
│  └────────────────────────┘  └────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Supporting Services                          │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  • Azure Key Vault (Secrets)                         │  │
│  │  • Azure Monitor (Logging)                           │  │
│  │  • Application Insights (APM)                        │  │
│  │  • SendGrid (Email via Marketplace)                  │  │
│  │  • Azure Container Registry (Images)                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Complete Services Checklist for Azure

### **Computing Services**
- [ ] Azure Container Apps (Frontend)
- [ ] Azure Container Apps (Backend API)
- [ ] Azure Container Apps (Redis Cache)
- [ ] Azure Container Apps (Automation Worker - Cron)

### **Database & Storage**
- [ ] Azure Database for PostgreSQL (Flexible Server)
- [ ] Azure Blob Storage (Documents/Files)
- [ ] Azure Container Registry (Docker Images)

### **Networking & Security**
- [ ] Azure Virtual Network (VNet)
- [ ] Azure Key Vault (Secrets: JWT_SECRET, API keys, SMTP passwords)
- [ ] Azure Front Door (Optional - WAF + CDN + SSL)
- [ ] Azure DNS (Custom domain: fineguard.com)

### **Monitoring & Operations**
- [ ] Azure Monitor (Logs + Metrics)
- [ ] Application Insights (APM + Error tracking)
- [ ] Azure Backup (Database backups - automated)

### **Third-Party Services (via Azure Marketplace)**
- [ ] SendGrid (Email notifications)
- [ ] Companies House API (External - FREE)

---

## 💵 Cost Summary by Tier

### **Tier 1: MVP (Minimum Viable)**
**Monthly**: $60-125
**Annual**: $720-1,500
**Services**: Frontend, Backend, Database, Redis, ACR

### **Tier 2: Production (Recommended)**
**Monthly**: $88-171
**Annual**: $1,056-2,052
**Services**: Tier 1 + Email, Storage, CDN, Monitoring, Key Vault

### **Tier 3: Enterprise (Full Stack)**
**Monthly**: $145-262
**Annual**: $1,740-3,144
**Services**: Tier 2 + AD B2C, Backup, DNS, Front Door, Logic Apps

---

## 🎯 Recommended Starting Point

**For Initial Deployment**: **Tier 2 - Production**
- **Cost**: ~$88-171/month (~$100-150 realistic)
- **Includes**: All essential services + email + monitoring
- **Scalability**: Can handle 1,000-10,000 users
- **Reliability**: Production-grade with backups and monitoring

---

## 📝 Notes

- All costs are estimates (US East region, pay-as-you-go pricing)
- Actual costs depend on usage, data transfer, and scaling
- Azure offers discounts for reserved instances (save 30-50%)
- Free tier options available for testing (limited features)
- Companies House API remains FREE (external service)

---

**Last Updated**: 2026-02-11
**Version**: MVP 1.0
