# Sidebar Navigation System - Vanilla JavaScript Implementation Guide

> **Complete Implementation Guide for Pulse App**  
> This document provides a super-detailed, step-by-step guide for implementing the exact same sidebar navigation system used in the Foster Home Visit application, converted to vanilla JavaScript for use in the Pulse App project.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoint Specification](#api-endpoint-specification)
5. [HTML Structure](#html-structure)
6. [CSS Styling](#css-styling)
7. [JavaScript Implementation](#javascript-implementation)
8. [Git Submodule Setup (Policies Repository)](#git-submodule-setup-policies-repository)
9. [Authentication Integration](#authentication-integration)
10. [Active Route Detection](#active-route-detection)
11. [Icon System](#icon-system)
12. [Responsive Behavior](#responsive-behavior)
13. [Testing Checklist](#testing-checklist)

---

## Overview

### What This System Does

The sidebar navigation system provides:

1. **Dynamic Navigation Loading**: Navigation items are loaded from a database via API, filtered by user permissions
2. **Category Grouping**: Navigation items are organized into groups (e.g., "Navigation", "Administration")
3. **Collapsible Admin Section**: Administrative items are in a collapsible section at the bottom
4. **Active Route Highlighting**: The current page is automatically highlighted
5. **User Context Display**: Shows user avatar, name, and role in the footer
6. **Permission-Based Filtering**: Only shows navigation items the user has permission to access
7. **Fallback Navigation**: Emergency fallback if API fails (for authenticated users only)

### Key Features

- **280px fixed width sidebar**
- **Sticky positioning** (stays visible on scroll)
- **Gradient backgrounds** using Refuge House brand colors
- **Smooth transitions** (200ms for all interactions)
- **Responsive design** (hides off-screen on mobile)
- **Icon support** via Lucide icons (or custom SVG)
- **Loading states** with skeleton UI
- **Error handling** with user-friendly messages

---

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────┐
│                 APP CONTAINER                        │
│  ┌──────────────┬──────────────────────────────┐   │
│  │   SIDEBAR    │   MAIN CONTENT WRAPPER       │   │
│  │   (280px)    │   (flex: 1)                  │   │
│  │              │                               │   │
│  │  ┌────────┐  │  ┌─────────────────────────┐ │   │
│  │  │ Header │  │  │    APP HEADER (64px)    │ │   │
│  │  ├────────┤  │  ├─────────────────────────┤ │   │
│  │  │        │  │  │                         │ │   │
│  │  │Content │  │  │    MAIN CONTENT         │ │   │
│  │  │(flex:1)│  │  │    (scrollable)         │ │   │
│  │  │        │  │  │                         │ │   │
│  │  ├────────┤  │  │                         │ │   │
│  │  │ Admin  │  │  │                         │ │   │
│  │  │(collap)│  │  │                         │ │   │
│  │  ├────────┤  │  │                         │ │   │
│  │  │ Footer │  │  │                         │ │   │
│  │  └────────┘  │  └─────────────────────────┘ │   │
│  └──────────────┴──────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User loads page
   ↓
2. JavaScript checks authentication (Clerk or your auth system)
   ↓
3. Fetch navigation from /api/navigation with user headers
   ↓
4. API queries database for navigation_items filtered by:
   - microservice_id
   - user permissions
   - is_active = true
   ↓
5. API returns JSON with:
   - navigation: Array of categories with items
   - collapsibleItems: Array of admin items
   - metadata: Source, user info, permissions
   ↓
6. JavaScript renders sidebar HTML
   ↓
7. Active route detection highlights current page
   ↓
8. User clicks nav item → navigate to URL
```

---

## Database Schema

### Required Tables

#### `navigation_items` Table

```sql
CREATE TABLE navigation_items (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    microservice_id UNIQUEIDENTIFIER NOT NULL,
    code NVARCHAR(100) NOT NULL,              -- Unique identifier (e.g., 'dashboard', 'visits_calendar')
    title NVARCHAR(200) NOT NULL,            -- Display name (e.g., 'Dashboard', 'Visits Calendar')
    url NVARCHAR(500) NOT NULL,              -- Route path (e.g., '/dashboard', '/visits-calendar')
    icon NVARCHAR(50) NOT NULL,              -- Icon name (e.g., 'Home', 'Calendar', 'FileText')
    permission_required NVARCHAR(100) NULL,   -- Permission code (e.g., 'view_visits', 'generate_reports')
    category NVARCHAR(100) NOT NULL,          -- Group name (e.g., 'Navigation', 'Administration')
    subcategory NVARCHAR(100) NULL,          -- For nested grouping (optional)
    order_index INT NOT NULL DEFAULT 0,      -- Sort order within category
    is_collapsible BIT NOT NULL DEFAULT 0,   -- 1 = goes in collapsible admin section, 0 = regular nav
    is_active BIT NOT NULL DEFAULT 1,         -- 1 = visible, 0 = hidden
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    
    CONSTRAINT UQ_navigation_items_code UNIQUE (microservice_id, code),
    FOREIGN KEY (microservice_id) REFERENCES microservices(id)
);
```

#### `microservices` Table

```sql
CREATE TABLE microservices (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(50) NOT NULL UNIQUE,         -- e.g., 'home-visits', 'pulse-app'
    name NVARCHAR(200) NOT NULL,              -- e.g., 'Home Visits', 'Pulse App'
    description NVARCHAR(500) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);
```

#### `app_users` Table (for user authentication)

```sql
CREATE TABLE app_users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    first_name NVARCHAR(100) NULL,
    last_name NVARCHAR(100) NULL,
    clerk_user_id NVARCHAR(255) NULL UNIQUE,    -- Clerk authentication ID
    is_active BIT NOT NULL DEFAULT 1,
    user_type NVARCHAR(50) NULL,              -- e.g., 'global_admin', 'staff', 'viewer'
    environment NVARCHAR(50) NULL,             -- For multi-environment deployments
    created_at DATETIME2 DEFAULT GETUTCDATE()
);
```

#### `user_roles` and `role_permissions` Tables (for permission checking)

```sql
-- User roles (many-to-many with users)
CREATE TABLE user_roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    role_id UNIQUEIDENTIFIER NOT NULL,
    microservice_id UNIQUEIDENTIFIER NULL,     -- NULL = global role
    assigned_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (user_id) REFERENCES app_users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (microservice_id) REFERENCES microservices(id)
);

-- Roles
CREATE TABLE roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(100) NOT NULL,               -- e.g., 'viewer', 'manager', 'admin'
    name NVARCHAR(200) NOT NULL,
    microservice_id UNIQUEIDENTIFIER NULL,     -- NULL = global role
    is_active BIT NOT NULL DEFAULT 1
);

-- Role permissions (many-to-many)
CREATE TABLE role_permissions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    role_id UNIQUEIDENTIFIER NOT NULL,
    permission_code NVARCHAR(100) NOT NULL,    -- e.g., 'view_visits', 'generate_reports'
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

### Sample Data

```sql
-- Insert microservice
INSERT INTO microservices (id, code, name, description)
VALUES (NEWID(), 'pulse-app', 'Pulse App', 'Pulse application microservice');

-- Insert navigation items
DECLARE @microservice_id UNIQUEIDENTIFIER = (SELECT id FROM microservices WHERE code = 'pulse-app');

INSERT INTO navigation_items (microservice_id, code, title, url, icon, permission_required, category, order_index, is_collapsible)
VALUES
    (@microservice_id, 'dashboard', 'Dashboard', '/dashboard', 'Home', NULL, 'Navigation', 1, 0),
    (@microservice_id, 'reports', 'Reports', '/reports', 'BarChart3', 'generate_reports', 'Navigation', 2, 0),
    (@microservice_id, 'settings', 'Settings', '/settings', 'Settings', 'view_settings', 'Administration', 1, 1),
    (@microservice_id, 'diagnostics', 'Diagnostics', '/diagnostics', 'Database', 'view_diagnostics', 'Administration', 2, 1);
```

---

## API Endpoint Specification

### Endpoint: `GET /api/navigation`

#### Request Headers

```javascript
{
    "x-user-email": "user@example.com",        // User's email address
    "x-user-clerk-id": "user_abc123",          // Clerk user ID (if using Clerk)
    "x-user-name": "John Doe"                  // User's full name
}
```

**Note**: If you're not using Clerk, you can use your own authentication system. Just ensure you send user identification in headers.

#### Response Format

```json
{
    "navigation": [
        {
            "title": "Navigation",
            "items": [
                {
                    "code": "dashboard",
                    "title": "Dashboard",
                    "url": "/dashboard",
                    "icon": "Home",
                    "order": 1
                },
                {
                    "code": "reports",
                    "title": "Reports",
                    "url": "/reports",
                    "icon": "BarChart3",
                    "order": 2
                }
            ]
        }
    ],
    "collapsibleItems": [
        {
            "code": "settings",
            "title": "Settings",
            "url": "/settings",
            "icon": "Settings",
            "order": 1
        }
    ],
    "metadata": {
        "source": "database",                   // "database" | "config_fallback" | "error_fallback"
        "totalItems": 4,
        "visibleItems": 4,
        "microservice": {
            "code": "pulse-app",
            "name": "Pulse App",
            "description": "Pulse application microservice"
        },
        "timestamp": "2024-01-15T10:30:00Z",
        "userPermissions": ["view_reports", "generate_reports"],
        "userInfo": {
            "id": "user-uuid",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe"
        }
    }
}
```

#### Error Responses

**401 Unauthorized** (User not authenticated):
```json
{
    "error": "Authentication required",
    "metadata": {
        "source": "auth_required"
    }
}
```

**404 Not Found** (User not found in database):
```json
{
    "error": "User not found",
    "metadata": {
        "source": "user_not_found"
    }
}
```

**500 Internal Server Error**:
```json
{
    "error": "Internal server error",
    "metadata": {
        "source": "error_fallback",
        "dbError": "Connection timeout"
    }
}
```

---

## HTML Structure

### Complete Sidebar HTML

```html
<aside class="app-sidebar" id="app-sidebar">
    <!-- Sidebar Header with Logo -->
    <div class="sidebar-header">
        <img src="/images/logo.png" alt="Logo" class="sidebar-logo" id="sidebar-logo">
        <div class="sidebar-header-badge" id="sidebar-badge" style="display: none;"></div>
    </div>

    <!-- Sidebar Content - Navigation Items -->
    <div class="sidebar-content" id="sidebar-content">
        <!-- Loading State -->
        <div class="sidebar-loading" id="sidebar-loading">
            <div class="loading-skeleton"></div>
            <div class="loading-skeleton"></div>
            <div class="loading-skeleton"></div>
        </div>

        <!-- Error State -->
        <div class="sidebar-error" id="sidebar-error" style="display: none;">
            <div class="error-icon">⚠️</div>
            <p class="error-message"></p>
        </div>

        <!-- Empty State -->
        <div class="sidebar-empty" id="sidebar-empty" style="display: none;">
            <div class="empty-icon">📭</div>
            <p class="empty-message">No navigation items available</p>
        </div>

        <!-- Navigation Groups (dynamically populated) -->
        <nav class="nav-groups" id="nav-groups" style="display: none;">
            <!-- Groups will be inserted here by JavaScript -->
        </nav>
    </div>

    <!-- Collapsible Administration Section -->
    <div class="sidebar-admin-section" id="sidebar-admin-section" style="display: none;">
        <div class="admin-group">
            <button class="admin-group-label" id="admin-toggle">
                <svg class="icon" viewBox="0 0 24 24" style="width: 12px; height: 12px;">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span id="admin-label-text">ADMINISTRATION</span>
                <svg class="chevron-icon" id="admin-chevron" viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <ul class="admin-nav-menu" id="admin-nav-menu" style="display: none;">
                <!-- Admin items will be inserted here by JavaScript -->
            </ul>
        </div>
    </div>

    <!-- Sidebar Footer - User Menu -->
    <div class="sidebar-footer">
        <button class="user-menu-button" id="user-menu-button">
            <div class="user-avatar" id="user-avatar">
                <span id="user-initials">U</span>
            </div>
            <div class="user-info">
                <div class="user-name" id="user-name">User</div>
                <div class="user-role" id="user-role" style="display: none;">Administrator</div>
            </div>
            <svg class="chevron-icon" viewBox="0 0 24 24">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        </button>
        
        <!-- User Dropdown Menu (hidden by default) -->
        <div class="user-dropdown" id="user-dropdown" style="display: none;">
            <a href="/user-profile" class="dropdown-item">
                <svg class="icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Profile Settings
            </a>
            <button class="dropdown-item" id="sign-out-button">
                <svg class="icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sign out
            </button>
        </div>
    </div>
</aside>
```

---

## CSS Styling

### Complete CSS (Copy into your stylesheet)

```css
/* ============================================================
   SIDEBAR NAVIGATION - COMPLETE STYLES
   ============================================================ */

/* Root Variables */
:root {
    /* Brand Colors */
    --refuge-purple: #5E3989;
    --refuge-purple-light: #7B4FA2;
    --refuge-purple-dark: #4A2C6E;
    --refuge-magenta: #A90533;
    --refuge-magenta-light: #C41E3A;
    --refuge-magenta-dark: #8B0228;
    --refuge-light-purple: #8A6FAD;
    
    /* Slate Colors */
    --slate-50: #f8fafc;
    --slate-100: #f1f5f9;
    --slate-200: #e2e8f0;
    --slate-300: #cbd5e1;
    --slate-400: #94a3b8;
    --slate-500: #64748b;
    --slate-600: #475569;
    --slate-700: #334155;
    --slate-800: #1e293b;
    --slate-900: #0f172a;
    
    /* Spacing */
    --space-1: 0.25rem;   /* 4px */
    --space-2: 0.5rem;    /* 8px */
    --space-3: 0.75rem;   /* 12px */
    --space-4: 1rem;      /* 16px */
    --space-6: 1.5rem;    /* 24px */
    
    /* Border Radius */
    --radius-lg: 0.75rem; /* 12px */
    
    /* Transitions */
    --transition-fast: 200ms ease;
    --transition-base: 300ms ease;
}

/* Sidebar Container */
.app-sidebar {
    width: 280px;
    background-color: #ffffff;
    border-right: 1px solid var(--slate-200);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100vh;
    position: sticky;
    top: 0;
    overflow-y: auto;
    overflow-x: hidden;
}

/* Sidebar Header */
.sidebar-header {
    height: 80px;
    padding: var(--space-4);
    border-bottom: 1px solid var(--slate-200);
    background: linear-gradient(
        to right,
        rgba(138, 111, 173, 0.1),   /* refuge-light-purple at 10% */
        rgba(94, 57, 137, 0.05),     /* refuge-purple at 5% */
        rgba(169, 5, 51, 0.1)       /* refuge-magenta at 10% */
    );
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: var(--space-2);
}

.sidebar-logo {
    height: 56px;
    object-fit: contain;
    transition: transform var(--transition-fast);
}

.sidebar-logo:hover {
    transform: scale(1.05);
}

.sidebar-header-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-weight: 600;
}

.sidebar-header-badge.fallback {
    background-color: rgba(94, 57, 137, 0.1);
    color: var(--refuge-purple);
}

.sidebar-header-badge.error {
    background-color: rgba(220, 38, 38, 0.1);
    color: #dc2626;
}

/* Sidebar Content */
.sidebar-content {
    flex: 1;
    padding: var(--space-4);
    overflow-y: auto;
    overflow-x: hidden;
}

/* Loading State */
.sidebar-loading {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.loading-skeleton {
    height: 40px;
    background: linear-gradient(
        90deg,
        var(--slate-200) 0%,
        var(--slate-100) 50%,
        var(--slate-200) 100%
    );
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
    border-radius: var(--radius-lg);
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Error State */
.sidebar-error {
    padding: var(--space-6);
    text-align: center;
}

.error-icon {
    font-size: 3rem;
    margin-bottom: var(--space-4);
}

.error-message {
    font-size: 0.875rem;
    color: var(--slate-600);
}

/* Empty State */
.sidebar-empty {
    padding: var(--space-6);
    text-align: center;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: var(--space-4);
}

.empty-message {
    font-size: 0.875rem;
    color: var(--slate-600);
}

/* Navigation Groups */
.nav-groups {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
}

.nav-group {
    display: flex;
    flex-direction: column;
}

.nav-group-label {
    font-size: 0.75rem;        /* 12px */
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--slate-500);
    margin-bottom: var(--space-3);
    padding: 0 var(--space-3);
}

.nav-menu {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
}

/* Navigation Links */
.nav-item {
    width: 100%;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 0.625rem var(--space-3);  /* 10px 12px */
    border-radius: var(--radius-lg);
    color: var(--slate-700);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;  /* 14px */
    transition: all var(--transition-fast);
    cursor: pointer;
    position: relative;
    width: 100%;
    border: none;
    background: transparent;
    text-align: left;
}

.nav-link:hover {
    color: var(--refuge-purple);
    background: linear-gradient(
        to right,
        rgba(138, 111, 173, 0.1),
        rgba(169, 5, 51, 0.1)
    );
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.nav-link.active {
    color: var(--refuge-purple);
    background: linear-gradient(
        to right,
        rgba(138, 111, 173, 0.15),
        rgba(169, 5, 51, 0.15)
    );
    font-weight: 600;
}

.nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--slate-500);
    transition: color var(--transition-fast);
    stroke-width: 2;
    stroke: currentColor;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.nav-link:hover .nav-icon,
.nav-link.active .nav-icon {
    color: var(--refuge-purple);
}

/* Administration Section */
.sidebar-admin-section {
    border-top: 1px solid var(--slate-200);
    background: linear-gradient(
        to right,
        rgba(94, 57, 137, 0.05),
        rgba(169, 5, 51, 0.05)
    );
    padding: var(--space-4);
}

.admin-group {
    display: flex;
    flex-direction: column;
}

.admin-group-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--refuge-purple);
    margin-bottom: var(--space-3);
    padding: 0 var(--space-3);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    transition: color var(--transition-fast);
}

.admin-group-label:hover {
    color: var(--refuge-magenta);
}

.admin-group-label .chevron-icon {
    width: 12px;
    height: 12px;
    margin-left: auto;
    transition: transform var(--transition-fast);
}

.admin-group-label[aria-expanded="true"] .chevron-icon {
    transform: rotate(180deg);
}

.admin-nav-menu {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
}

.admin-nav-link {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 0.625rem var(--space-3);
    border-radius: var(--radius-lg);
    color: var(--slate-700);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all var(--transition-fast);
    cursor: pointer;
    width: 100%;
    border: none;
    background: transparent;
    text-align: left;
}

.admin-nav-link:hover {
    color: var(--refuge-purple);
    background: linear-gradient(
        to right,
        rgba(138, 111, 173, 0.1),
        rgba(169, 5, 51, 0.1)
    );
}

.admin-nav-link .nav-icon {
    color: var(--refuge-purple);
}

.admin-nav-link:hover .nav-icon {
    color: var(--refuge-magenta);
}

/* Sidebar Footer */
.sidebar-footer {
    padding: var(--space-4);
    border-top: 1px solid var(--slate-200);
    background: linear-gradient(
        to right,
        var(--slate-50),
        rgba(138, 111, 173, 0.1)
    );
    position: relative;
}

.user-menu-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2);
    border: none;
    background: transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.user-menu-button:hover {
    background: linear-gradient(
        to right,
        rgba(138, 111, 173, 0.1),
        rgba(169, 5, 51, 0.1)
    );
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(
        135deg,
        var(--refuge-purple),
        var(--refuge-magenta)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 0.75rem;
    flex-shrink: 0;
    border: 2px solid rgba(138, 111, 173, 0.3);
}

.user-info {
    flex: 1;
    text-align: left;
    min-width: 0;
}

.user-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--slate-900);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-role {
    font-size: 0.75rem;
    color: var(--refuge-purple);
    font-weight: 500;
}

.chevron-icon {
    width: 16px;
    height: 16px;
    color: var(--slate-400);
    flex-shrink: 0;
}

/* User Dropdown Menu */
.user-dropdown {
    position: absolute;
    bottom: calc(100% + var(--space-2));
    left: var(--space-4);
    right: var(--space-4);
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: var(--space-2);
    z-index: 50;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: calc(var(--radius-lg) - 2px);
    color: var(--slate-700);
    text-decoration: none;
    font-size: 0.875rem;
    transition: all var(--transition-fast);
    cursor: pointer;
    width: 100%;
    border: none;
    background: transparent;
    text-align: left;
}

.dropdown-item:hover {
    background-color: var(--slate-100);
    color: var(--refuge-purple);
}

.dropdown-item.danger {
    color: #dc2626;
}

.dropdown-item.danger:hover {
    background-color: rgba(220, 38, 38, 0.1);
}

.dropdown-item .icon {
    width: 16px;
    height: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .app-sidebar {
        position: fixed;
        left: -280px;
        z-index: 40;
        transition: left var(--transition-base);
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    }

    .app-sidebar.mobile-open {
        left: 0;
    }

    /* Overlay when sidebar is open */
    .sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 30;
        display: none;
    }

    .sidebar-overlay.active {
        display: block;
    }
}
```

---

## JavaScript Implementation

### Complete JavaScript Module

Create a file `sidebar-navigation.js`:

```javascript
/**
 * Sidebar Navigation System
 * Vanilla JavaScript implementation for Pulse App
 */

class SidebarNavigation {
    constructor(options = {}) {
        // Configuration
        this.apiEndpoint = options.apiEndpoint || '/api/navigation';
        this.authProvider = options.authProvider || null; // Your auth provider (Clerk, custom, etc.)
        this.currentPath = window.location.pathname;
        this.microserviceCode = options.microserviceCode || 'pulse-app';
        
        // State
        this.navigationData = null;
        this.userInfo = null;
        this.isLoading = false;
        this.adminSectionOpen = false;
        
        // DOM Elements
        this.sidebar = document.getElementById('app-sidebar');
        this.sidebarContent = document.getElementById('sidebar-content');
        this.navGroups = document.getElementById('nav-groups');
        this.adminSection = document.getElementById('sidebar-admin-section');
        this.adminMenu = document.getElementById('admin-nav-menu');
        this.userMenuButton = document.getElementById('user-menu-button');
        this.userDropdown = document.getElementById('user-dropdown');
        
        // Icon mapping (Lucide icons as SVG paths)
        this.iconMap = {
            'Home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
            'Calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
            'BarChart3': '<line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line>',
            'Map': '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line>',
            'List': '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>',
            'Users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
            'Settings': '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>',
            'Database': '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>',
            'FileText': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>',
            'Shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
            'BookOpen': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
            'User': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
            'LogOut': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>'
        };
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the sidebar
     */
    async init() {
        try {
            // Get user info from auth provider
            this.userInfo = await this.getUserInfo();
            
            if (!this.userInfo) {
                this.showError('Please sign in to continue.');
                return;
            }
            
            // Load navigation
            await this.loadNavigation();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update active route
            this.updateActiveRoute();
        } catch (error) {
            console.error('Error initializing sidebar:', error);
            this.showError('Failed to load navigation.');
        }
    }
    
    /**
     * Get user information from auth provider
     * Override this method based on your auth system
     */
    async getUserInfo() {
        // Example for Clerk
        if (this.authProvider && typeof this.authProvider.user !== 'undefined') {
            const user = this.authProvider.user;
            return {
                email: user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress,
                clerkId: user.id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses?.[0]?.emailAddress,
                firstName: user.firstName,
                lastName: user.lastName
            };
        }
        
        // Example for custom auth (adjust based on your system)
        // Check localStorage, cookies, or make an API call
        const token = localStorage.getItem('auth_token');
        if (token) {
            // Make API call to get user info
            const response = await fetch('/api/user', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        }
        
        return null;
    }
    
    /**
     * Load navigation from API
     */
    async loadNavigation() {
        this.isLoading = true;
        this.showLoading();
        
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add user identification headers
            if (this.userInfo) {
                if (this.userInfo.email) headers['x-user-email'] = this.userInfo.email;
                if (this.userInfo.clerkId) headers['x-user-clerk-id'] = this.userInfo.clerkId;
                if (this.userInfo.name) headers['x-user-name'] = this.userInfo.name;
            }
            
            const response = await fetch(this.apiEndpoint, {
                method: 'GET',
                headers: headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Handle authentication errors
                if (response.status === 401 || errorData.metadata?.source === 'auth_required') {
                    this.showError('Access denied. Please sign in.');
                    return;
                }
                
                // Handle user not found
                if (errorData.metadata?.source === 'user_not_found') {
                    this.showError('Your account needs to be registered in the system.');
                    return;
                }
                
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            this.navigationData = data;
            
            // Render navigation
            this.renderNavigation();
            
            // Update user info in footer
            this.updateUserFooter();
            
        } catch (error) {
            console.error('Error loading navigation:', error);
            this.showError('Failed to load navigation. Please refresh the page.');
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Render navigation items
     */
    renderNavigation() {
        if (!this.navigationData || !this.navigationData.navigation) {
            this.showEmpty();
            return;
        }
        
        // Hide loading/error/empty states
        this.hideAllStates();
        
        // Render main navigation groups
        this.navGroups.innerHTML = '';
        this.navigationData.navigation.forEach(group => {
            if (group.title === 'Administration') {
                // Skip - will be rendered in admin section
                return;
            }
            
            const groupElement = this.createNavigationGroup(group);
            this.navGroups.appendChild(groupElement);
        });
        
        this.navGroups.style.display = 'flex';
        
        // Render admin section if there are collapsible items
        const collapsibleItems = this.navigationData.collapsibleItems || [];
        const adminGroup = this.navigationData.navigation.find(g => g.title === 'Administration');
        
        if (collapsibleItems.length > 0 || (adminGroup && adminGroup.items.length > 0)) {
            this.renderAdminSection(collapsibleItems.length > 0 ? collapsibleItems : adminGroup.items);
        }
    }
    
    /**
     * Create a navigation group element
     */
    createNavigationGroup(group) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'nav-group';
        
        const label = document.createElement('h3');
        label.className = 'nav-group-label';
        label.textContent = group.title;
        groupDiv.appendChild(label);
        
        const menu = document.createElement('ul');
        menu.className = 'nav-menu';
        
        // Sort items by order
        const sortedItems = [...group.items].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        sortedItems.forEach(item => {
            const menuItem = this.createNavigationItem(item);
            menu.appendChild(menuItem);
        });
        
        groupDiv.appendChild(menu);
        return groupDiv;
    }
    
    /**
     * Create a navigation item element
     */
    createNavigationItem(item) {
        const li = document.createElement('li');
        li.className = 'nav-item';
        
        const link = document.createElement('a');
        link.href = item.url;
        link.className = 'nav-link';
        link.dataset.code = item.code;
        
        // Add icon
        const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        iconSvg.setAttribute('class', 'nav-icon icon');
        iconSvg.setAttribute('viewBox', '0 0 24 24');
        iconSvg.innerHTML = this.iconMap[item.icon] || this.iconMap['Home'];
        link.appendChild(iconSvg);
        
        // Add text
        const span = document.createElement('span');
        span.textContent = item.title;
        link.appendChild(span);
        
        li.appendChild(link);
        return li;
    }
    
    /**
     * Render admin section
     */
    renderAdminSection(items) {
        this.adminSection.style.display = 'block';
        this.adminMenu.innerHTML = '';
        
        // Sort items by order
        const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        sortedItems.forEach(item => {
            const menuItem = this.createAdminNavigationItem(item);
            this.adminMenu.appendChild(menuItem);
        });
    }
    
    /**
     * Create an admin navigation item
     */
    createAdminNavigationItem(item) {
        const li = document.createElement('li');
        li.className = 'nav-item';
        
        const link = document.createElement('a');
        link.href = item.url;
        link.className = 'admin-nav-link';
        link.dataset.code = item.code;
        
        // Add icon
        const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        iconSvg.setAttribute('class', 'nav-icon icon');
        iconSvg.setAttribute('viewBox', '0 0 24 24');
        iconSvg.innerHTML = this.iconMap[item.icon] || this.iconMap['Settings'];
        link.appendChild(iconSvg);
        
        // Add text
        const span = document.createElement('span');
        span.textContent = item.title;
        link.appendChild(span);
        
        li.appendChild(link);
        return li;
    }
    
    /**
     * Update active route highlighting
     */
    updateActiveRoute() {
        // Remove active class from all links
        document.querySelectorAll('.nav-link, .admin-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Find matching link
        const currentPath = window.location.pathname;
        const matchingLink = document.querySelector(`.nav-link[href="${currentPath}"], .admin-nav-link[href="${currentPath}"]`);
        
        if (matchingLink) {
            matchingLink.classList.add('active');
        } else {
            // Try partial match (for nested routes)
            document.querySelectorAll('.nav-link, .admin-nav-link').forEach(link => {
                const href = link.getAttribute('href');
                if (href && currentPath.startsWith(href) && href !== '/') {
                    link.classList.add('active');
                }
            });
        }
    }
    
    /**
     * Update user footer
     */
    updateUserFooter() {
        if (!this.userInfo) return;
        
        const userInitials = this.getUserInitials(this.userInfo.name || this.userInfo.email);
        const userName = this.userInfo.name || this.userInfo.email || 'User';
        
        const initialsEl = document.getElementById('user-initials');
        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        
        if (initialsEl) initialsEl.textContent = userInitials;
        if (nameEl) nameEl.textContent = userName;
        
        // Show role if user is admin
        if (this.navigationData?.metadata?.userPermissions) {
            const isAdmin = this.navigationData.metadata.userPermissions.some(p => 
                p.includes('admin') || p.includes('system')
            );
            if (isAdmin && roleEl) {
                roleEl.textContent = 'Administrator';
                roleEl.style.display = 'block';
            }
        }
    }
    
    /**
     * Get user initials
     */
    getUserInitials(name) {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Admin section toggle
        const adminToggle = document.getElementById('admin-toggle');
        if (adminToggle) {
            adminToggle.addEventListener('click', () => {
                this.toggleAdminSection();
            });
        }
        
        // User menu dropdown
        if (this.userMenuButton) {
            this.userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserDropdown();
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.userDropdown && !this.userDropdown.contains(e.target) && 
                !this.userMenuButton.contains(e.target)) {
                this.userDropdown.style.display = 'none';
            }
        });
        
        // Sign out button
        const signOutButton = document.getElementById('sign-out-button');
        if (signOutButton) {
            signOutButton.addEventListener('click', () => {
                this.handleSignOut();
            });
        }
        
        // Update active route on navigation
        window.addEventListener('popstate', () => {
            this.updateActiveRoute();
        });
    }
    
    /**
     * Toggle admin section
     */
    toggleAdminSection() {
        this.adminSectionOpen = !this.adminSectionOpen;
        const adminMenu = document.getElementById('admin-nav-menu');
        const adminToggle = document.getElementById('admin-toggle');
        
        if (adminMenu) {
            adminMenu.style.display = this.adminSectionOpen ? 'flex' : 'none';
        }
        
        if (adminToggle) {
            adminToggle.setAttribute('aria-expanded', this.adminSectionOpen);
        }
    }
    
    /**
     * Toggle user dropdown
     */
    toggleUserDropdown() {
        if (this.userDropdown) {
            const isVisible = this.userDropdown.style.display !== 'none';
            this.userDropdown.style.display = isVisible ? 'none' : 'block';
        }
    }
    
    /**
     * Handle sign out
     */
    handleSignOut() {
        // Implement your sign out logic
        if (this.authProvider && typeof this.authProvider.signOut === 'function') {
            this.authProvider.signOut();
        } else {
            // Custom sign out
            localStorage.removeItem('auth_token');
            window.location.href = '/sign-in';
        }
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        this.hideAllStates();
        const loading = document.getElementById('sidebar-loading');
        if (loading) loading.style.display = 'flex';
    }
    
    /**
     * Show error state
     */
    showError(message) {
        this.hideAllStates();
        const error = document.getElementById('sidebar-error');
        const errorMessage = document.querySelector('.error-message');
        if (error) error.style.display = 'block';
        if (errorMessage) errorMessage.textContent = message;
    }
    
    /**
     * Show empty state
     */
    showEmpty() {
        this.hideAllStates();
        const empty = document.getElementById('sidebar-empty');
        if (empty) empty.style.display = 'block';
    }
    
    /**
     * Hide all states
     */
    hideAllStates() {
        const loading = document.getElementById('sidebar-loading');
        const error = document.getElementById('sidebar-error');
        const empty = document.getElementById('sidebar-empty');
        const navGroups = document.getElementById('nav-groups');
        
        if (loading) loading.style.display = 'none';
        if (error) error.style.display = 'none';
        if (empty) empty.style.display = 'none';
        if (navGroups) navGroups.style.display = 'none';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize sidebar
        // Adjust based on your auth provider
        const sidebar = new SidebarNavigation({
            apiEndpoint: '/api/navigation',
            authProvider: window.Clerk || null, // Or your custom auth provider
            microserviceCode: 'pulse-app'
        });
        
        // Make it globally available if needed
        window.sidebarNavigation = sidebar;
    });
} else {
    // DOM already loaded
    const sidebar = new SidebarNavigation({
        apiEndpoint: '/api/navigation',
        authProvider: window.Clerk || null,
        microserviceCode: 'pulse-app'
    });
    window.sidebarNavigation = sidebar;
}
```

---

## Git Submodule Setup (Policies Repository)

### Overview

The policies and procedures repository is included as a Git submodule, allowing you to reference another repository within your project without merging the codebases.

### Step-by-Step Setup

#### 1. Add the Submodule

In your Pulse App repository root, run:

```bash
git submodule add https://github.com/jduarte-refugehouse/refuge-house-knowbase.git policies-repo
```

This creates:
- A `policies-repo/` directory containing the policies repository
- A `.gitmodules` file that tracks the submodule configuration

#### 2. Verify `.gitmodules` File

After adding the submodule, you should have a `.gitmodules` file that looks like:

```ini
[submodule "policies-repo"]
    path = policies-repo
    url = https://github.com/jduarte-refugehouse/refuge-house-knowbase.git
```

#### 3. Commit the Submodule

```bash
git add .gitmodules policies-repo
git commit -m "Add policies and procedures repository as submodule"
git push
```

#### 4. Clone Repository with Submodule

When someone clones your repository, they need to initialize submodules:

```bash
# Clone the repository
git clone https://github.com/your-org/pulse-app.git
cd pulse-app

# Initialize and update submodules
git submodule update --init --recursive
```

Or clone with submodules in one command:

```bash
git clone --recurse-submodules https://github.com/your-org/pulse-app.git
```

#### 5. Update Submodule to Latest

To pull the latest changes from the policies repository:

```bash
cd policies-repo
git pull origin main
cd ..
git add policies-repo
git commit -m "Update policies submodule to latest"
git push
```

#### 6. Working with Submodule Content

**Important**: The `policies-repo/` directory is a separate Git repository. Changes made there are committed to the `refuge-house-knowbase` repository, not the Pulse App repository.

**To make changes to policies:**

```bash
cd policies-repo
# Make your changes
git add .
git commit -m "Update policy document"
git push origin main  # Pushes to refuge-house-knowbase repo
cd ..
git add policies-repo
git commit -m "Update submodule reference"
git push  # Updates Pulse App to reference new submodule commit
```

**To read files from submodule in your application:**

```javascript
// In your API route or server-side code
const fs = require('fs');
const path = require('path');

const policyPath = path.join(process.cwd(), 'policies-repo', 'policies-procedures', 'policy-fc-t3c-01.md');
const policyContent = fs.readFileSync(policyPath, 'utf-8');
```

#### 7. Vercel/Deployment Considerations

**For Vercel deployments:**

Vercel will automatically clone submodules during build if:
1. The submodule repository is public, OR
2. You add the submodule repository as a Vercel environment variable

**If the submodule is private:**

1. Go to Vercel project settings
2. Add environment variable: `GITHUB_TOKEN` with a GitHub personal access token
3. Vercel will use this token to clone private submodules

**Note**: The submodule is primarily for local development and Cursor AI visibility. For production, you may want to fetch content via GitHub API instead of relying on the submodule being present in deployment.

#### 8. Cursor AI Integration

Once the submodule is added, Cursor AI can see and reference files in the `policies-repo/` directory. This allows you to:

- Ask Cursor AI to review policy documents
- Generate forms based on policy requirements
- Reference policy content in code comments
- Search across both codebase and policies

**Example Cursor AI prompt:**
```
"Review the policy document in policies-repo/policies-procedures/ and 
suggest how we can implement compliance checking in the Pulse App."
```

### Troubleshooting

**Submodule appears empty:**
```bash
git submodule update --init --recursive
```

**Submodule out of sync:**
```bash
cd policies-repo
git fetch
git pull origin main
cd ..
git add policies-repo
git commit -m "Sync submodule"
```

**Remove submodule (if needed):**
```bash
git submodule deinit -f policies-repo
git rm -f policies-repo
rm -rf .git/modules/policies-repo
```

---

## Authentication Integration

### Clerk Integration (Current Implementation)

If you're using Clerk (like the Foster Home Visit app):

```javascript
// Wait for Clerk to load
window.addEventListener('load', () => {
    if (window.Clerk && window.Clerk.user) {
        const sidebar = new SidebarNavigation({
            apiEndpoint: '/api/navigation',
            authProvider: window.Clerk,
            microserviceCode: 'pulse-app'
        });
    }
});
```

### Custom Authentication

If you have a custom auth system:

```javascript
class CustomAuthProvider {
    constructor() {
        this.user = null;
        this.loadUser();
    }
    
    async loadUser() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            const response = await fetch('/api/user', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                this.user = await response.json();
            }
        }
    }
    
    signOut() {
        localStorage.removeItem('auth_token');
        window.location.href = '/sign-in';
    }
}

const authProvider = new CustomAuthProvider();
const sidebar = new SidebarNavigation({
    apiEndpoint: '/api/navigation',
    authProvider: authProvider,
    microserviceCode: 'pulse-app'
});
```

---

## Active Route Detection

The sidebar automatically highlights the current page by:

1. **Exact match**: If the current URL exactly matches a navigation item URL
2. **Prefix match**: If the current URL starts with a navigation item URL (for nested routes)

```javascript
// This is handled automatically in updateActiveRoute()
// But you can manually trigger it:
window.sidebarNavigation.updateActiveRoute();
```

### Handling Client-Side Routing

If you're using a client-side router (like React Router, Vue Router, etc.), listen for route changes:

```javascript
// Example for React Router
import { useLocation } from 'react-router-dom';

function App() {
    const location = useLocation();
    
    useEffect(() => {
        if (window.sidebarNavigation) {
            window.sidebarNavigation.updateActiveRoute();
        }
    }, [location.pathname]);
}
```

---

## Icon System

### Using Lucide Icons

The implementation uses Lucide icons. You can:

1. **Use SVG paths directly** (as shown in the JavaScript)
2. **Use a CDN**:
```html
<script src="https://unpkg.com/lucide@latest"></script>
```

3. **Install via npm**:
```bash
npm install lucide
```

### Adding Custom Icons

Add to the `iconMap` in `SidebarNavigation`:

```javascript
this.iconMap = {
    // ... existing icons
    'CustomIcon': '<path d="..."></path>', // Your SVG path
};
```

---

## Responsive Behavior

### Mobile Sidebar Toggle

Add a hamburger menu button to your header:

```html
<button id="mobile-menu-toggle" class="mobile-menu-toggle">
    <svg viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"></path></svg>
</button>
```

```javascript
// Add to your JavaScript
const mobileToggle = document.getElementById('mobile-menu-toggle');
const sidebar = document.getElementById('app-sidebar');
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';

document.body.appendChild(overlay);

mobileToggle.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
});
```

---

## Testing Checklist

### Functionality Tests

- [ ] Navigation loads from API on page load
- [ ] Loading state displays while fetching
- [ ] Error state displays on API failure
- [ ] Empty state displays when no items
- [ ] Navigation items render correctly
- [ ] Icons display for each item
- [ ] Active route is highlighted
- [ ] Clicking nav items navigates correctly
- [ ] Admin section toggles open/closed
- [ ] User menu dropdown works
- [ ] Sign out button works
- [ ] User info displays in footer
- [ ] Admin badge shows for admins

### Permission Tests

- [ ] Items without permission are hidden
- [ ] Items with permission are visible
- [ ] Admin items only show for admins
- [ ] Unauthenticated users see error message

### Responsive Tests

- [ ] Sidebar hides on mobile (< 768px)
- [ ] Hamburger menu toggles sidebar
- [ ] Overlay appears when sidebar open
- [ ] Clicking overlay closes sidebar
- [ ] Sidebar is sticky on desktop

### Edge Cases

- [ ] Handles missing user info gracefully
- [ ] Handles API timeout
- [ ] Handles network errors
- [ ] Handles malformed API response
- [ ] Handles missing icons gracefully
- [ ] Handles very long user names (truncates)
- [ ] Handles special characters in URLs

---

## Additional Resources

- **Navigation Specification**: See `docs/navigation-specification.md`
- **Vanilla JS Demo**: See `docs/vanilla-js-navigation-demo.html`
- **Style Guide**: See `docs/refuge-house-style-guide.md`

---

## Support

For questions or issues:
1. Check the troubleshooting section
2. Review the database schema
3. Verify API endpoint responses
4. Check browser console for errors

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Author**: Refuge House Development Team

