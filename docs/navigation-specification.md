# 🎯 Navigation Menu - Complete Specification

> **Critical Reference for Vanilla JS Implementation**  
> This document provides pixel-perfect specifications for implementing the Refuge House navigation menu system.

---

## 📐 Layout Architecture

### Overall Structure
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
│  │  ├────────┤  │  │                         │ │   │
│  │  │ Footer │  │  │                         │ │   │
│  │  └────────┘  │  └─────────────────────────┘ │   │
│  └──────────────┴──────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 📏 Sidebar Dimensions & Spacing

### Container
- **Width**: `280px` (fixed)
- **Height**: `100vh` (full viewport height)
- **Position**: `sticky` with `top: 0`
- **Background**: `#ffffff` (white)
- **Border Right**: `1px solid #e2e8f0` (slate-200)

### Sections
```
┌────────────────────────────┐
│  HEADER                    │  Height: 80px
│  - Logo area               │  Padding: 16px (all sides)
│  - Gradient background     │
├────────────────────────────┤
│                            │
│  CONTENT (Scrollable)      │  Flex: 1 (grows)
│  - Navigation groups       │  Padding: 16px
│  - Multiple nav menus      │
│                            │
├────────────────────────────┤
│  ADMIN SECTION             │  Auto height
│  - Admin nav items         │  Padding: 16px
│  - Special styling         │  Border-top: 1px
├────────────────────────────┤
│  FOOTER                    │  Auto height
│  - User menu button        │  Padding: 16px
│  - Avatar + info           │  Border-top: 1px
└────────────────────────────┘
```

---

## 🎨 Sidebar Header Specification

### Dimensions
- **Height**: `80px`
- **Padding**: `16px` all sides
- **Border Bottom**: `1px solid #e2e8f0`

### Background Gradient
```css
background: linear-gradient(
    to right,
    rgba(138, 111, 173, 0.1),  /* refuge-light-purple at 10% */
    rgba(94, 57, 137, 0.05),   /* refuge-purple at 5% */
    rgba(169, 5, 51, 0.1)      /* refuge-magenta at 10% */
);
```

### Logo
- **Height**: `56px` (14 * 4px = 3.5rem in Tailwind)
- **Object Fit**: `contain`
- **Hover Effect**: `scale(1.05)` with `200ms` transition
- **Display**: Centered horizontally and vertically

---

## 📋 Navigation Items Specification

### Group Structure

Each navigation group follows this pattern:

```html
<div class="nav-group">
    <h3 class="nav-group-label">SECTION NAME</h3>
    <ul class="nav-menu">
        <li class="nav-item">
            <a href="#" class="nav-link">
                <svg class="nav-icon">...</svg>
                <span>Link Text</span>
            </a>
        </li>
    </ul>
</div>
```

### Group Label Styling
```css
.nav-group-label {
    font-size: 0.75rem;           /* 12px */
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;               /* slate-500 */
    margin-bottom: 12px;          /* 0.75rem */
    padding: 0 12px;
}
```

### Navigation Link Styling

#### Default State
```css
.nav-link {
    display: flex;
    align-items: center;
    gap: 12px;                    /* 0.75rem */
    padding: 10px 12px;           /* 0.625rem 0.75rem */
    border-radius: 12px;          /* 0.75rem */
    color: #334155;               /* slate-700 */
    font-weight: 500;
    font-size: 0.875rem;          /* 14px */
    transition: all 200ms ease;
    text-decoration: none;
}
```

#### Hover State
```css
.nav-link:hover {
    color: #5E3989;               /* refuge-purple */
    background: linear-gradient(
        to right,
        rgba(138, 111, 173, 0.1),
        rgba(169, 5, 51, 0.1)
    );
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
```

#### Active State
```css
.nav-link.active {
    color: #5E3989;               /* refuge-purple */
    background: linear-gradient(
        to right,
        rgba(138, 111, 173, 0.15),
        rgba(169, 5, 51, 0.15)
    );
    font-weight: 600;
}
```

### Icon Styling

```css
.nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: #64748b;               /* slate-500 */
    transition: color 200ms ease;
}

.nav-link:hover .nav-icon {
    color: #5E3989;               /* refuge-purple */
}

.nav-link.active .nav-icon {
    color: #5E3989;               /* refuge-purple */
}
```

---

## 🛡️ Administration Section

### Container Styling
```css
.sidebar-admin-section {
    border-top: 1px solid #e2e8f0;
    background: linear-gradient(
        to right,
        rgba(94, 57, 137, 0.05),
        rgba(169, 5, 51, 0.05)
    );
    padding: 16px;
}
```

### Admin Group Label
```css
.admin-group-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #5E3989;               /* refuge-purple */
    margin-bottom: 12px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}
```

### Admin Links
- Same structure as regular nav links
- Icon color is always `#5E3989` (refuge-purple)
- Hover changes icon to `#A90533` (refuge-magenta)

---

## 👤 User Menu Footer

### Container
```css
.sidebar-footer {
    padding: 16px;
    border-top: 1px solid #e2e8f0;
    background: linear-gradient(
        to right,
        #f8fafc,                  /* slate-50 */
        rgba(138, 111, 173, 0.1)
    );
}
```

### User Menu Button
```css
.user-menu-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border: none;
    background: transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 200ms ease;
}

.user-menu-button:hover {
    background: linear-gradient(
        to right,
        rgba(138, 111, 173, 0.1),
        rgba(169, 5, 51, 0.1)
    );
}
```

### Avatar
```css
.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(
        135deg,
        #5E3989,                  /* refuge-purple */
        #A90533                   /* refuge-magenta */
    );
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 0.75rem;
    border: 2px solid rgba(138, 111, 173, 0.3);
}
```

### User Info
```css
.user-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #0f172a;               /* slate-900 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-role {
    font-size: 0.75rem;
    color: #5E3989;               /* refuge-purple */
    font-weight: 500;
}
```

---

## 📱 Responsive Behavior

### Mobile (<768px)
```css
@media (max-width: 768px) {
    .app-sidebar {
        position: fixed;
        left: -280px;             /* Hidden off-screen */
        z-index: 40;
        transition: left 300ms ease;
    }
    
    .app-sidebar.mobile-open {
        left: 0;                  /* Slide in */
    }
}
```

---

## 🎯 Navigation Menu Content

### Group 1: Navigation
```javascript
const navigationItems = [
    { 
        title: "Dashboard",
        url: "/dashboard",
        icon: "home",
        order: 1
    },
    { 
        title: "Visits Calendar",
        url: "/visits-calendar",
        icon: "calendar",
        order: 2
    },
    { 
        title: "Visit Forms",
        url: "/visit-forms",
        icon: "file-text",
        order: 3
    },
    { 
        title: "Homes Map",
        url: "/homes-map",
        icon: "map",
        order: 4
    },
    { 
        title: "Homes List",
        url: "/homes-list",
        icon: "list",
        order: 5
    },
    { 
        title: "Reports",
        url: "/reports",
        icon: "bar-chart",
        order: 6
    },
    { 
        title: "On-Call Schedule",
        url: "/on-call-schedule",
        icon: "clock",
        order: 7
    }
];
```

### Group 2: Resources
```javascript
const resourceItems = [
    { 
        title: "User Guide",
        url: "/guide",
        icon: "book-open",
        order: 1
    }
];
```

### Group 3: Administration
```javascript
const adminItems = [
    { 
        title: "Admin Panel",
        url: "/admin",
        icon: "settings",
        order: 1
    },
    { 
        title: "User Management",
        url: "/admin/users",
        icon: "users",
        order: 2
    },
    { 
        title: "Diagnostics",
        url: "/diagnostics",
        icon: "database",
        order: 3
    }
];
```

---

## 🎨 Color Reference

### Brand Colors (Hex)
```
Purple:         #5E3989
Purple Light:   #7B4FA2
Purple Dark:    #4A2C6E
Magenta:        #A90533
Magenta Light:  #C41E3A
Magenta Dark:   #8B0228
Light Purple:   #8A6FAD
```

### Slate Scale (for text/borders)
```
slate-50:   #f8fafc    (lightest backgrounds)
slate-100:  #f1f5f9
slate-200:  #e2e8f0    (borders)
slate-300:  #cbd5e1
slate-400:  #94a3b8
slate-500:  #64748b    (muted text)
slate-600:  #475569    (secondary text)
slate-700:  #334155    (body text)
slate-800:  #1e293b
slate-900:  #0f172a    (primary text)
```

---

## ⚡ Animation & Transitions

### Standard Transitions
```css
/* All interactive elements */
transition: all 200ms ease;

/* Color-only changes */
transition: color 200ms ease;

/* Transform effects */
transition: transform 200ms ease;
```

### Hover Effects
```css
/* Card lift on hover */
transform: translateY(-2px);

/* Button press effect */
transform: scale(0.95);

/* Icon scale on hover */
transform: scale(1.05);
```

---

## 📦 Spacing System

### Tailwind Equivalent Values
```
space-1  = 4px   (0.25rem)
space-2  = 8px   (0.5rem)
space-3  = 12px  (0.75rem)
space-4  = 16px  (1rem)
space-5  = 20px  (1.25rem)
space-6  = 24px  (1.5rem)
space-8  = 32px  (2rem)
space-12 = 48px  (3rem)
```

### Usage Guidelines
- **Gap between nav items**: 4px (space-1)
- **Gap between groups**: 24px (space-6)
- **Internal padding**: 12px (space-3)
- **Container padding**: 16px (space-4)
- **Section padding**: 32px (space-8)

---

## 🔍 Border Radius System

```
rounded-sm  = 6px   (0.375rem)  - Small elements
rounded-md  = 8px   (0.5rem)    - Inputs
rounded-lg  = 12px  (0.75rem)   - Buttons, nav items
rounded-xl  = 16px  (1rem)      - Cards, containers
```

---

## 📊 Typography Scale

### Font Weights
```
font-medium:   500
font-semibold: 600
font-bold:     700
```

### Font Sizes
```
text-xs:   0.75rem  (12px)  - Labels, metadata
text-sm:   0.875rem (14px)  - Nav items, body small
text-base: 1rem     (16px)  - Body text
text-lg:   1.125rem (18px)  - Subheadings
text-xl:   1.25rem  (20px)  - Card titles
text-2xl:  1.5rem   (24px)  - Section headers
text-3xl:  1.875rem (30px)  - Page titles
text-4xl:  2.25rem  (36px)  - Hero text
```

---

## ✅ Implementation Checklist

### Structure
- [ ] Sidebar is 280px fixed width
- [ ] Sidebar uses flexbox column layout
- [ ] Header is 80px tall with gradient
- [ ] Content area has flex: 1 and scrolls
- [ ] Admin section is separate from main nav
- [ ] Footer is at bottom with user menu

### Styling
- [ ] All nav items have 12px border-radius
- [ ] Hover adds gradient background
- [ ] Active state has stronger gradient + bold text
- [ ] Icons are 20x20px with proper stroke
- [ ] All transitions are 200ms
- [ ] Group labels are uppercase, 12px, semibold

### Colors
- [ ] Purple (#5E3989) for primary states
- [ ] Magenta (#A90533) for admin emphasis
- [ ] Slate scale for text/borders
- [ ] Gradient backgrounds use rgba with opacity

### Spacing
- [ ] Nav item padding: 10px 12px
- [ ] Gap between items: 4px
- [ ] Gap between groups: 24px
- [ ] Section padding: 16px

### Responsive
- [ ] Sidebar hidden off-screen on mobile
- [ ] Toggle functionality implemented
- [ ] Smooth slide-in animation (300ms)

---

## 🚀 Quick Start Template

```html
<aside class="app-sidebar">
    <!-- Header -->
    <div class="sidebar-header">
        <img src="logo.png" class="sidebar-logo" alt="Logo">
    </div>
    
    <!-- Content -->
    <div class="sidebar-content">
        <nav class="nav-groups">
            <!-- Regular navigation groups -->
        </nav>
    </div>
    
    <!-- Admin Section -->
    <div class="sidebar-admin-section">
        <!-- Admin nav items -->
    </div>
    
    <!-- Footer -->
    <div class="sidebar-footer">
        <!-- User menu -->
    </div>
</aside>
```

---

## 📚 Additional Resources

- **Full HTML Demo**: See `vanilla-js-navigation-demo.html`
- **React Implementation**: See `components/app-sidebar.tsx`
- **Style Guide**: See `refuge-house-style-guide.md`

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Author**: Refuge House Development Team

