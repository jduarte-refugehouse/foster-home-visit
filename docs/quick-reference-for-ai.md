# 🚀 Quick Reference for AI - Refuge House Style Implementation

> **Use this guide to match the Refuge House React app styling in vanilla JS**

---

## 📦 Tech Stack Summary

```
Framework:    Next.js 14 with React 18
Styling:      Tailwind CSS 3.4.3
Components:   shadcn/ui (Radix UI primitives)
Icons:        Lucide React
Font:         Inter (Google Fonts)
Theme:        next-themes (dark/light mode)
```

---

## 🎨 Brand Colors - Copy/Paste Ready

```css
/* PRIMARY COLORS */
--refuge-purple: #5E3989;
--refuge-purple-light: #7B4FA2;
--refuge-purple-dark: #4A2C6E;
--refuge-magenta: #A90533;
--refuge-magenta-light: #C41E3A;
--refuge-magenta-dark: #8B0228;
--refuge-light-purple: #8A6FAD;

/* USAGE */
Primary actions:        --refuge-purple
Important/Destructive:  --refuge-magenta
Hover states:          --refuge-purple-dark
Active states:         --refuge-purple-dark
```

---

## 📐 Layout Pattern - Copy/Paste

```html
<div class="app-container" style="display: flex; min-height: 100vh; width: 100%;">
    <!-- Sidebar: 280px fixed -->
    <aside class="sidebar" style="width: 280px; border-right: 1px solid #e2e8f0;">
        <!-- Sidebar content -->
    </aside>
    
    <!-- Main Area: flex-1 -->
    <div class="main-wrapper" style="flex: 1; display: flex; flex-direction: column;">
        <!-- Header: 64px tall -->
        <header style="height: 64px; border-bottom: 1px solid #e2e8f0;">
            <!-- Header content -->
        </header>
        
        <!-- Content: scrollable -->
        <main style="flex: 1; overflow-y: auto; background: #f8fafc;">
            <div style="max-width: 1280px; margin: 0 auto; padding: 32px 24px;">
                <!-- Page content -->
            </div>
        </main>
    </div>
</div>
```

---

## 🎯 Navigation Items - Exact Styling

```css
/* NAV LINK - DEFAULT */
.nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    color: #334155;
    font-weight: 500;
    font-size: 14px;
    text-decoration: none;
    transition: all 200ms ease;
}

/* NAV LINK - HOVER */
.nav-link:hover {
    color: #5E3989;
    background: linear-gradient(to right, rgba(138, 111, 173, 0.1), rgba(169, 5, 51, 0.1));
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* NAV LINK - ACTIVE */
.nav-link.active {
    color: #5E3989;
    background: linear-gradient(to right, rgba(138, 111, 173, 0.15), rgba(169, 5, 51, 0.15));
    font-weight: 600;
}

/* NAV ICON */
.nav-icon {
    width: 20px;
    height: 20px;
    color: #64748b;
    transition: color 200ms ease;
}

.nav-link:hover .nav-icon,
.nav-link.active .nav-icon {
    color: #5E3389;
}
```

---

## 🃏 Card Component - Copy/Paste

```css
.card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    transition: all 200ms ease;
}

.card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    border-color: rgba(94, 57, 137, 0.2);
}
```

```html
<div class="card">
    <div class="card-header" style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
        <div style="width: 48px; height: 48px; padding: 12px; border-radius: 16px; background: rgba(94, 57, 137, 0.1);">
            <svg style="width: 24px; height: 24px; color: #5E3989;"><!-- icon --></svg>
        </div>
        <div>
            <h3 style="font-size: 20px; font-weight: 600; color: #0f172a;">Card Title</h3>
            <p style="font-size: 14px; color: #475569;">Card description</p>
        </div>
    </div>
    <p style="font-size: 14px; color: #475569; margin-bottom: 16px;">
        Card body content goes here
    </p>
    <button class="btn-primary">Take Action</button>
</div>
```

---

## 🔘 Button Styles - Copy/Paste

```css
/* PRIMARY BUTTON (Purple) */
.btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px;
    background: #5E3989;
    color: white;
    font-weight: 500;
    font-size: 14px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: all 200ms ease;
}

.btn-primary:hover {
    background: #4A2C6E;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: scale(0.95);
}

/* SECONDARY BUTTON (Magenta) */
.btn-secondary {
    background: #A90533;
    /* ... same other properties */
}

.btn-secondary:hover {
    background: #8B0228;
}

/* GHOST BUTTON */
.btn-ghost {
    background: transparent;
    color: #5E3989;
}

.btn-ghost:hover {
    background: rgba(94, 57, 137, 0.1);
}
```

---

## 🏷️ Badge Component - Copy/Paste

```css
.badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
}

.badge-purple {
    background: rgba(94, 57, 137, 0.1);
    color: #5E3989;
}

.badge-green {
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
}

.badge-red {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
}

.badge-amber {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
}
```

---

## 📊 Data Table - Basic Structure

```html
<div style="border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <table style="width: 100%; border-collapse: collapse;">
        <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 12px 16px; text-align: left; font-size: 14px; font-weight: 600; color: #475569;">
                    Column Name
                </th>
            </tr>
        </thead>
        <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">
                    Cell Content
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

---

## 🎨 Gradient Patterns - Copy/Paste

```css
/* HEADER GRADIENT */
background: linear-gradient(
    to right,
    rgba(138, 111, 173, 0.1),
    rgba(94, 57, 137, 0.05),
    rgba(169, 5, 51, 0.1)
);

/* BANNER GRADIENT */
background: linear-gradient(
    to bottom right,
    rgba(94, 57, 137, 0.1),
    transparent,
    rgba(169, 5, 51, 0.1)
);

/* HOVER GRADIENT */
background: linear-gradient(
    to right,
    rgba(138, 111, 173, 0.1),
    rgba(169, 5, 51, 0.1)
);

/* SECTION BACKGROUND */
background: linear-gradient(
    to right,
    rgba(94, 57, 137, 0.05),
    rgba(169, 5, 51, 0.05)
);
```

---

## 📏 Spacing Scale - Quick Reference

```
4px   = gap between nav items
8px   = small padding
12px  = nav item padding, icon gap
16px  = section padding
24px  = card padding, group spacing
32px  = page padding
48px  = section spacing
```

---

## 🔲 Border Radius Scale

```
6px   = small elements
8px   = inputs
12px  = buttons, nav items
16px  = cards, containers
```

---

## 🎭 Shadow Scale

```css
/* SUBTLE */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* MEDIUM */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
            0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* LARGE */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
```

---

## 📱 Grid Layouts

```css
/* 2-COLUMN */
.grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
}

/* 3-COLUMN */
.grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}

/* 4-COLUMN STATS */
.grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
}

/* RESPONSIVE */
@media (max-width: 768px) {
    .grid-2, .grid-3, .grid-4 {
        grid-template-columns: 1fr;
    }
}
```

---

## 🎯 Dashboard Stats Card

```html
<div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; text-align: center;">
    <div style="font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 8px;">
        Metric Name
    </div>
    <div style="font-size: 24px; font-weight: 700; color: #0f172a;">
        247
    </div>
</div>
```

---

## 📝 Typography Styles

```css
/* PAGE TITLE */
font-size: 36px;
font-weight: 700;
color: #0f172a;

/* SECTION HEADING */
font-size: 24px;
font-weight: 600;
color: #0f172a;

/* CARD TITLE */
font-size: 20px;
font-weight: 600;
color: #0f172a;

/* BODY TEXT */
font-size: 16px;
line-height: 1.6;
color: #475569;

/* SMALL TEXT */
font-size: 14px;
color: #475569;

/* LABEL / METADATA */
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.05em;
color: #64748b;
```

---

## ⚡ Transitions - Standard

```css
/* ALL PROPERTIES */
transition: all 200ms ease;

/* SPECIFIC PROPERTIES */
transition: color 200ms ease;
transition: background 200ms ease;
transition: transform 200ms ease;
transition: box-shadow 200ms ease;
```

---

## 🎨 Color Variables - Complete Set

```css
/* BRAND */
--refuge-purple: #5E3989;
--refuge-magenta: #A90533;
--refuge-light-purple: #8A6FAD;

/* SLATE (Text & Borders) */
--slate-50: #f8fafc;
--slate-200: #e2e8f0;
--slate-400: #94a3b8;
--slate-500: #64748b;
--slate-600: #475569;
--slate-700: #334155;
--slate-900: #0f172a;

/* STATUS COLORS */
--green-600: #16a34a;    /* Success */
--amber-600: #d97706;    /* Warning */
--red-600: #dc2626;      /* Error/Danger */
--sky-600: #0284c7;      /* Info */
```

---

## 📋 Complete Navigation Menu Items

```javascript
// Main Navigation
[
    { title: "Dashboard", url: "/dashboard", icon: "home" },
    { title: "Visits Calendar", url: "/visits-calendar", icon: "calendar" },
    { title: "Visit Forms", url: "/visit-forms", icon: "file-text" },
    { title: "Homes Map", url: "/homes-map", icon: "map" },
    { title: "Homes List", url: "/homes-list", icon: "list" },
    { title: "Reports", url: "/reports", icon: "bar-chart" },
    { title: "On-Call Schedule", url: "/on-call-schedule", icon: "clock" }
]

// Resources
[
    { title: "User Guide", url: "/guide", icon: "book-open" }
]

// Administration
[
    { title: "Admin Panel", url: "/admin", icon: "settings" },
    { title: "User Management", url: "/admin/users", icon: "users" },
    { title: "Diagnostics", url: "/diagnostics", icon: "database" }
]
```

---

## 🚀 Quick Implementation Steps

1. **Copy the full HTML demo** → `vanilla-js-navigation-demo.html`
2. **Replace colors** with Refuge House brand colors
3. **Use the grid layouts** for your content
4. **Apply card styles** to all containers
5. **Use button styles** for all actions
6. **Add badges** for status indicators
7. **Test responsive** behavior on mobile

---

## 📚 Key Files to Reference

- **Full Demo**: `vanilla-js-navigation-demo.html` ← START HERE
- **Detailed Specs**: `navigation-specification.md`
- **Style Guide**: `refuge-house-style-guide.md`
- **React Sidebar**: `components/app-sidebar.tsx`
- **React Dashboard**: `app/(protected)/dashboard/page.tsx`

---

## ✅ Style Checklist

- [ ] Purple (#5E3989) for primary actions
- [ ] Magenta (#A90533) for important/destructive
- [ ] 12px border-radius on buttons/nav items
- [ ] 16px border-radius on cards
- [ ] All transitions are 200ms
- [ ] Hover adds subtle gradient background
- [ ] Active state has stronger gradient
- [ ] Icons are 20x20px
- [ ] Proper spacing (12px, 16px, 24px)
- [ ] Shadows on cards (subtle)
- [ ] Font: Inter or system fonts

---

**TIP**: Start with the HTML demo file, it has everything you need!

