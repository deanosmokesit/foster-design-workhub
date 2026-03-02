# Foster Design IT CRM - Specification Document

## 1. Project Overview

**Project Name:** Foster Design WorkHub  
**Project Type:** Desktop Application (Windows exe) with mobile-responsive web interface  
**Core Feature Summary:** Internal work management CRM for IT business - track clients, projects, tasks, and service delivery  
**Target Users:** Foster Design - IT services business handling AI, Automation, IT Infrastructure, Microsoft Products, IT Consultancy, Website Design/Development, Software Development

---

## 2. UI/UX Specification

### 2.1 Layout Structure

**Window Model:**
- Single main window with sidebar navigation
- Modal dialogs for create/edit forms
- Native window controls (minimize, maximize, close)

**Layout Areas:**
- **Sidebar (Left):** 240px desktop, collapsible on mobile (hamburger menu)
- **Header:** 64px height - contains logo, search, user actions
- **Main Content:** Fluid width, fills remaining space
- **Footer:** Optional status bar (32px)

**Responsive Breakpoints:**
- Mobile: < 768px (sidebar becomes hamburger menu)
- Tablet: 768px - 1024px (condensed sidebar)
- Desktop: > 1024px (full sidebar)

### 2.2 Visual Design

**Color Palette:**
- Primary: `#2563EB` (Blue - trust, professionalism)
- Primary Dark: `#1D4ED8`
- Secondary: `#10B981` (Green - success, growth)
- Accent: `#F59E0B` (Amber - attention, warnings)
- Danger: `#EF4444` (Red - errors, urgent)
- Background: `#F8FAFC` (Light gray)
- Surface: `#FFFFFF` (White cards)
- Text Primary: `#1E293B` (Dark slate)
- Text Secondary: `#64748B` (Muted)
- Border: `#E2E8F0`

**Typography:**
- Font Family: Inter, system-ui, sans-serif
- Headings: 
  - H1: 28px, font-weight 700
  - H2: 22px, font-weight 600
  - H3: 18px, font-weight 600
  - H4: 16px, font-weight 600
- Body: 14px, font-weight 400
- Small: 12px, font-weight 400

**Spacing System:**
- Base unit: 4px
- XS: 4px, SM: 8px, MD: 16px, LG: 24px, XL: 32px, 2XL: 48px

**Visual Effects:**
- Card shadows: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Elevated shadows: `0 10px 15px -3px rgba(0,0,0,0.1)`
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Transitions: 150ms ease-in-out

### 2.3 Components

**Navigation Sidebar:**
- Logo/Brand at top
- Nav items: Dashboard, Clients, Projects, Tasks, Calendar, Settings
- Active state: Blue background tint, bold text
- Hover state: Light gray background
- Collapse button for mobile

**Cards:**
- White background, 8px radius, subtle shadow
- Header with title and actions
- Content area with consistent padding (16px)

**Buttons:**
- Primary: Blue background, white text
- Secondary: White background, blue border/text
- Danger: Red background, white text
- States: hover (darken 10%), active (darken 15%), disabled (opacity 50%)

**Form Inputs:**
- Border: 1px solid #E2E8F0
- Focus: Blue border, light blue ring
- Error: Red border, red text below
- Padding: 10px 12px

**Status Badges:**
- New: Blue
- In Progress: Amber
- Completed: Green
- On Hold: Gray
- Cancelled: Red

**Data Tables:**
- Striped rows (alternating #F8FAFC)
- Sortable column headers
- Row hover highlight
- Pagination controls

---

## 3. Functional Specification

### 3.1 Core Features

**A. Dashboard**
- Summary cards: Total Clients, Active Projects, Pending Tasks, Revenue This Month
- Recent activity feed
- Quick actions: New Client, New Project, New Task
- Project status breakdown chart
- Upcoming deadlines list

**B. Client Management**
- Client list with search and filters
- Client fields:
  - Company Name (required)
  - Contact Person Name (required)
  - Email (required)
  - Phone
  - Address
  - Website
  - Industry
  - Client Status (Active, Inactive, Prospect)
  - Service Categories (multi-select: AI, Automation, IT Infrastructure, Microsoft Products, IT Consultancy, Website Design, Software Development)
  - Notes
  - Created Date
  - Last Contact Date
- Client detail view with associated projects and tasks
- Edit/Delete client

**C. Project/Job Management**
- Project list with status filters
- Project fields:
  - Project Name (required)
  - Client (required, dropdown)
  - Service Type (required, from categories)
  - Status (New, In Progress, On Hold, Completed, Cancelled)
  - Priority (Low, Medium, High, Urgent)
  - Start Date
  - Due Date
  - Estimated Hours
  - Actual Hours
  - Hourly Rate
  - Total Budget
  - Description
  - Notes/Timeline
- Project detail view with tasks
- Edit/Delete project

**D. Task Management**
- Task list with filters (by status, priority, project, due date)
- Task fields:
  - Title (required)
  - Description
  - Project (optional, dropdown)
  - Status (Todo, In Progress, Review, Done)
  - Priority (Low, Medium, High, Urgent)
  - Due Date
  - Estimated Hours
  - Assigned To (internal - single user for now)
  - Tags
- Task detail/edit
- Quick status update buttons

**E. Calendar View**
- Monthly calendar showing projects and tasks with due dates
- Click on date to see items
- Color-coded by status/type

**F. Settings**
- Business Info (Company name, logo placeholder)
- Service Categories management
- User profile (name, email)
- Data export (JSON)
- Theme toggle (light/dark - future)

### 3.2 Data Flow & Architecture

**Frontend (React + TypeScript):**
- React Router for navigation
- Context API for global state (theme, user)
- Local state for forms
- Tauri IPC for backend communication

**Backend (Rust + Tauri):**
- SQLite database (embedded via rusqlite)
- REST-like commands via Tauri invoke
- CRUD operations for all entities

**Database Schema:**

```sql
-- Clients
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  website TEXT,
  industry TEXT,
  status TEXT DEFAULT 'Active',
  service_categories TEXT, -- JSON array
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_contact_at DATETIME
);

-- Projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  service_type TEXT NOT NULL,
  status TEXT DEFAULT 'New',
  priority TEXT DEFAULT 'Medium',
  start_date DATE,
  due_date DATE,
  estimated_hours REAL,
  actual_hours REAL,
  hourly_rate REAL,
  total_budget REAL,
  description TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  project_id INTEGER REFERENCES projects(id),
  status TEXT DEFAULT 'Todo',
  priority TEXT DEFAULT 'Medium',
  due_date DATE,
  estimated_hours REAL,
  assigned_to TEXT,
  tags TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log
CREATE TABLE activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 Edge Cases

- Empty states for all lists (no clients, no projects, etc.)
- Validation errors for required fields
- Confirm dialogs for delete actions
- Handle database errors gracefully
- Prevent duplicate submissions
- Handle very long text (truncate with expand)

---

## 4. Acceptance Criteria

### 4.1 Success Conditions

1. **App launches successfully** - Exe runs without errors
2. **Dashboard displays** - Shows summary stats and recent activity
3. **Client CRUD works** - Can create, read, update, delete clients
4. **Project CRUD works** - Can create, read, update, delete projects
5. **Task CRUD works** - Can create, read, update, delete tasks
6. **Data persists** - Data survives app restart
7. **Mobile responsive** - UI works on mobile viewport (375px)
8. **Search works** - Can search clients and projects
9. **Filters work** - Can filter by status, priority, etc.
10. **Quick actions work** - New buttons open forms correctly

### 4.2 Visual Checkpoints

- [ ] Sidebar navigation visible on desktop
- [ ] Hamburger menu appears on mobile
- [ ] Cards have proper shadows and spacing
- [ ] Buttons have hover states
- [ ] Forms show validation errors
- [ ] Status badges are color-coded
- [ ] Tables are readable and sortable
- [ ] Empty states show helpful messages

---

## 5. Technical Stack

- **Framework:** Tauri 2.x
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Database:** SQLite (via rusqlite)
- **Icons:** Lucide React
- **Forms:** React Hook Form
- **Date Handling:** date-fns
- **Charts:** Recharts
