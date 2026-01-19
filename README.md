# 📚 E-Office Web Application - Complete Developer Guide

> Modern document management system built with Next.js 14, TypeScript, and Shadcn UI for Fakultas Sains dan Matematika, Universitas Diponegoro.

---

## 📖 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Creating New Pages](#-creating-new-pages)
- [Working with Components](#-working-with-components)
- [State Management & Hooks](#-state-management--hooks)
- [Styling Guide](#-styling-guide)
- [Environment Variables](#-environment-variables)
- [Git Workflow](#-git-workflow)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Project Overview

E-Office is a comprehensive document management system designed to streamline administrative processes for academic institutions. The application handles:

- **Document Submissions (Pengajuan)** - Create, edit, and track SK (Surat Keputusan) and ST (Surat Tugas)
- **Document Numbering (Penomoran)** - Automated and manual numbering system
- **User Management** - Role-based access control (Operator, Drafter, Verifikator, Dekan)
- **Approval Workflow** - Multi-stage document approval process
- **Analytics Dashboard** - Real-time statistics and insights

---

## 🛠️ Tech Stack

### Core Framework
- **Next.js 14** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn UI** - Accessible component library built on Radix UI
- **Lucide React** - Beautiful, consistent icons

### Form Handling & Validation
- **Zod** - TypeScript-first schema validation
- **React Hook Form** - Performant form library (to be integrated)

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Turbopack** - Next.js bundler for fast builds

---

## 🏗️ Project Architecture

### Feature-First Structure

We follow a **feature-first architecture** where each major feature has its own folder containing all related components, hooks, types, and utilities:

```
src/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Route group: Authentication
│   │   └── login/page.tsx
│   ├── (dashboard)/              # Route group: Main app
│   │   ├── layout.tsx           # Shared layout with navigation
│   │   ├── dashboard/
│   │   ├── pengajuan/
│   │   ├── nomor/
│   │   ├── pengguna/
│   │   └── pengaturan/
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   └── page.tsx                 # Root redirect
│
├── components/
│   ├── ui/                      # Shadcn UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   └── layout/                  # Layout components
│       ├── top-nav.tsx
│       └── page-container.tsx
│
├── features/                    # Feature modules
│   ├── auth/
│   │   ├── components/         # Auth-specific components
│   │   ├── hooks/              # Auth hooks (useAuth)
│   │   └── types/              # Auth types
│   ├── pengajuan/
│   │   ├── components/
│   │   │   ├── forms/          # Submission forms
│   │   │   ├── tables/         # Data tables
│   │   │   └── details/        # Detail views
│   │   ├── hooks/
│   │   └── types/
│   └── ...
│
├── lib/                        # Shared utilities
│   ├── utils.ts               # Helper functions (cn, etc.)
│   └── validations.ts         # Zod schemas
│
└── types/                      # Global types
    └── schema.ts              # Core type definitions
```

### Key Architectural Decisions

1. **Route Groups** - Organize routes without affecting URL structure
2. **Colocation** - Keep related code close together
3. **Separation of Concerns** - Clear boundaries between features
4. **Type Safety** - TypeScript everywhere for better DX

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required
Node.js 18+ or Bun runtime
Git

# Recommended
VS Code with extensions:
- ESLint
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd e-office-webapp-v2

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
# or
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### First Run Checklist

- [ ] Dependencies installed successfully
- [ ] `.env` file configured
- [ ] Development server running
- [ ] Can access login page at `/login`
- [ ] Can navigate to dashboard at `/dashboard`

---

## 💻 Development Workflow

### Daily Development Flow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start development server
npm run dev

# 4. Make changes and test

# 5. Commit changes
git add .
git commit -m "feat: your feature description"

# 6. Push to remote
git push origin feature/your-feature-name

# 7. Create pull request
```

### Code Quality Checks

```bash
# Run linter
npm run lint

# Build for production (checks for errors)
npm run build

# Type checking
npx tsc --noEmit
```

---

## 📄 Creating New Pages

### Basic Page Creation

#### 1. Simple Static Page

Create a new file in `src/app/(dashboard)/your-page/page.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function YourPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Page Title</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Section Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your content here</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 2. Page with Data Fetching

```tsx
import { Suspense } from "react";
import YourDataComponent from "@/features/your-feature/components/your-data-component";

export default function YourPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Page</h1>
      
      <Suspense fallback={<div>Loading...</div>}>
        <YourDataComponent />
      </Suspense>
    </div>
  );
}
```

#### 3. Dynamic Routes

Create `src/app/(dashboard)/items/[id]/page.tsx`:

```tsx
interface PageProps {
  params: { id: string };
}

export default function ItemDetailPage({ params }: PageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Item {params.id}</h1>
      {/* Your content */}
    </div>
  );
}
```

### Advanced Page Patterns

#### Page with Form

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FormPage() {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Create New Item</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}
```

#### Page with Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const items = [
  { id: 1, name: "Item 1", status: "Active" },
  { id: 2, name: "Item 2", status: "Inactive" },
];

export default function TablePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Items List</h1>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

### Adding Navigation Links

Update `src/components/layout/top-nav.tsx`:

```tsx
const navItems = [
  { label: "Dasbor", href: "/dashboard" },
  { label: "Pengguna", href: "/pengguna" },
  { label: "Pengajuan", href: "/pengajuan" },
  { label: "Nomor", href: "/nomor" },
  { label: "Your New Page", href: "/your-page" }, // Add this
  { label: "Pengaturan", href: "/pengaturan" },
];
```

---

## 🧩 Working with Components

### Creating UI Components

#### 1. Simple Reusable Component

Create in `src/components/` or feature-specific folder:

```tsx
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "pending" | "rejected";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      variants[status],
      className
    )}>
      {status}
    </span>
  );
}
```

#### 2. Feature Component

Create in `src/features/[feature]/components/`:

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useYourHook } from "../hooks/use-your-hook";

export default function YourFeatureComponent() {
  const { data, isLoading } = useYourHook();

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your feature content */}
      </CardContent>
    </Card>
  );
}
```

### Using Shadcn UI Components

All available components are in `src/components/ui/`. To use:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Use them in your component
<Button variant="default">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### Available Shadcn Components

- `button` - Buttons with multiple variants
- `card` - Container components
- `input` - Text inputs
- `label` - Form labels
- `table` - Data tables
- `avatar` - User avatars
- `badge` - Status badges
- `dropdown-menu` - Dropdown menus
- `select` - Select dropdowns
- `textarea` - Multiline inputs
- `separator` - Dividers
- `dialog` - Modals
- `switch` - Toggle switches

---

## 🎣 State Management & Hooks

### Creating Custom Hooks

Create hooks in `src/features/[feature]/hooks/`:

```tsx
// src/features/items/hooks/use-items.ts
"use client";

import { useState, useEffect } from "react";

interface Item {
  id: string;
  name: string;
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        // Replace with actual API call
        const response = await fetch("/api/items");
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  const addItem = async (item: Omit<Item, "id">) => {
    // Add item logic
  };

  const updateItem = async (id: string, updates: Partial<Item>) => {
    // Update item logic
  };

  const deleteItem = async (id: string) => {
    // Delete item logic
  };

  return {
    items,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
  };
}
```

### Using the Hook

```tsx
"use client";

import { useItems } from "@/features/items/hooks/use-items";

export default function ItemsList() {
  const { items, isLoading, error } = useItems();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

---

## 🎨 Styling Guide

### Using Tailwind CSS

```tsx
// Basic styling
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Dark mode
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">

// Hover states
<button className="bg-blue-500 hover:bg-blue-600 transition-colors">
```

### Custom Styles with cn() Utility

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-styles",
  isActive && "active-styles",
  isDisabled && "disabled-styles",
  className // Allow prop override
)}>
```

### Theme Colors

We use CSS variables for theming (see `src/app/globals.css`):

```tsx
// Use semantic colors
<div className="bg-primary text-primary-foreground">
<div className="bg-secondary text-secondary-foreground">
<div className="bg-destructive text-destructive-foreground">
<div className="bg-muted text-muted-foreground">
```

### Component Styling Patterns

```tsx
// Container patterns
<div className="container mx-auto py-6 px-4">
<div className="max-w-7xl mx-auto">
<div className="max-w-md mx-auto">

// Card patterns
<Card className="hover:shadow-lg transition-shadow">

// Form patterns
<div className="space-y-4">
  <div className="space-y-2">
    <Label>Field Label</Label>
    <Input className="w-full" />
  </div>
</div>
```

---

## 🔐 Environment Variables

### Configuration Structure

Create `.env` file in the root directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Database (if needed)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Using Environment Variables

```tsx
// Client-side (must prefix with NEXT_PUBLIC_)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Server-side only
const dbUrl = process.env.DATABASE_URL;
```

### Environment-Specific Configs

```bash
# Development
.env.local

# Production
.env.production

# Template
.env.example
```

**Important**: Never commit `.env` or `.env.local` files!

---

## 🔄 Git Workflow

### Branch Naming Convention

```bash
# Features
feature/add-document-approval
feature/user-authentication

# Bug fixes
fix/login-redirect-issue
fix/table-pagination

# Hotfixes
hotfix/critical-security-patch

# Refactoring
refactor/reorganize-components

# Documentation
docs/update-readme
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <description>

# Examples
feat(auth): add forgot password functionality
fix(pengajuan): resolve form validation error
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(hooks): extract common logic to custom hook
test(auth): add login component tests
chore(deps): update dependencies
```

### Pull Request Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes and commit
git add .
git commit -m "feat: your feature description"

# 3. Keep branch updated
git fetch origin
git rebase origin/main

# 4. Push changes
git push origin feature/your-feature

# 5. Create PR on GitHub/GitLab
# 6. Request code review
# 7. Address feedback
# 8. Merge when approved
```

### Working with Team

```bash
# Pull latest changes before starting
git pull origin main

# Stash changes if needed
git stash
git pull
git stash pop

# Resolve conflicts
git status
# Edit conflicted files
git add .
git commit -m "merge: resolve conflicts"
```

---

## 🧪 Testing

### Component Testing (Setup Required)

```tsx
// Example test setup
import { render, screen } from "@testing-library/react";
import { LoginForm } from "@/features/auth/components/login-form";

describe("LoginForm", () => {
  it("renders login form", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

- [ ] Page loads without errors
- [ ] Forms validate correctly
- [ ] Buttons trigger expected actions
- [ ] Navigation works
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark mode (if implemented) works
- [ ] No console errors

---

## 🚀 Deployment

### Build for Production

```bash
# Create production build
npm run build

# Test production build locally
npm start
```

### Deployment Platforms

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Docker

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Build completes without errors
- [ ] All pages accessible
- [ ] API endpoints working
- [ ] Database connected (if applicable)
- [ ] Performance optimized
- [ ] SEO meta tags added

---

## 🔧 Troubleshooting

### Common Issues

#### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

#### Type Errors

```bash
# Regenerate types
npx tsc --noEmit

# Check TypeScript version
npx tsc --version
```

#### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

#### Styling Not Applied

```bash
# Check Tailwind config
# Ensure content paths include your files
# Restart dev server
```

### Getting Help

1. Check this documentation
2. Search existing issues on GitHub
3. Review Next.js documentation
4. Check Shadcn UI docs
5. Ask team members
6. Create new issue with detailed description

---

## 📚 Additional Resources

### Documentation Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Zod Documentation](https://zod.dev)

### Learning Resources

- Next.js 14 App Router Tutorial
- React Hooks Deep Dive
- TypeScript for React Developers
- Tailwind CSS Fundamentals

---

## 👥 Contributing

### Code Review Guidelines

- Write clear, descriptive commit messages
- Keep PRs focused and small
- Add comments for complex logic
- Update documentation when needed
- Ensure tests pass
- Follow existing code style

### Code Style

- Use TypeScript for all new files
- Use functional components
- Prefer named exports for components
- Use destructuring for props
- Keep components focused and small
- Use meaningful variable names

---

## 📝 License

Private - Fakultas Sains dan Matematika, Universitas Diponegoro

---

**Happy Coding! 🎉**

For questions or issues, contact the development team or create an issue in the repository.
