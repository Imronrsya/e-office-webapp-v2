# Frontend E-Office Application

> Modern E-Office web application built with Next.js 14 App Router, Shadcn UI, TypeScript, and Bun.

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Installation & Setup](#-installation--setup)
- [Project Structure](#-project-structure)
- [Shadcn UI Components](#-shadcn-ui-components)
- [Key Features](#-key-features)
- [Development Guidelines](#-development-guidelines)
- [Best Practices](#-best-practices)

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Package Manager**: Bun
- **UI Library**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **Form Validation**: Zod
- **State Management**: React Hooks + Custom Hooks
- **HTTP Client**: Fetch API

---

## 🚀 Installation & Setup

### Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 18+ (for compatibility)
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd e-office-monorepo
   ```

2. **Navigate to frontend folder**
   ```bash
   cd e-office-webapp-v2
   ```

3. **Install dependencies**
   ```bash
   bun install
   ```

4. **Setup environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local and configure your API endpoint
   # Example:
   # NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

5. **Run development server**
   ```bash
   bun dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

### Available Scripts

```bash
bun dev          # Start development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
```

---

## 📁 Project Structure

Proyek ini menggunakan **Feature-First Architecture** yang memisahkan kode berdasarkan fitur bisnis, bukan berdasarkan tipe file teknis. Pendekatan ini meningkatkan maintainability dan scalability.

```
e-office-webapp-v2/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   ├── components/                   # Shared components
│   ├── features/                     # Feature-first modules ⭐
│   ├── lib/                          # Utilities & helpers
│   └── types/                        # Global type definitions
├── public/                           # Static assets
└── [config files]
```

### 📂 Detailed Structure Explanation

#### 1️⃣ `src/app/` - Next.js 14 App Router

Next.js 14 menggunakan **file-system based routing**. Folder ini mengatur semua routing dan layout aplikasi.

```
app/
├── (auth)/                           # Route Group: Authentication
│   └── login/
│       └── page.tsx                  # Route: /login
│
├── (dashboard)/                      # Route Group: Dashboard (dengan layout)
│   ├── layout.tsx                    # Shared layout untuk semua dashboard routes
│   ├── dashboard/
│   │   └── page.tsx                  # Route: /dashboard
│   ├── pengajuan/
│   │   ├── page.tsx                  # Route: /pengajuan (list view)
│   │   ├── tambah/
│   │   │   └── page.tsx              # Route: /pengajuan/tambah
│   │   └── [id]/
│   │       └── page.tsx              # Route: /pengajuan/[id] (dynamic)
│   ├── nomor/
│   │   └── page.tsx                  # Route: /nomor
│   ├── pengguna/
│   │   └── page.tsx                  # Route: /pengguna
│   └── pengaturan/
│       └── page.tsx                  # Route: /pengaturan
│
├── layout.tsx                        # Root layout (global)
├── page.tsx                          # Route: / (homepage/redirect)
└── globals.css                       # Global styles & Tailwind imports
```

**🔑 Key Concepts:**

- **Route Groups** `(auth)`, `(dashboard)`: Folder dengan tanda kurung tidak mempengaruhi URL path. Digunakan untuk organize routes dan apply shared layouts.
  - `(auth)`: Routes tanpa navigation bar (login screen)
  - `(dashboard)`: Routes dengan TopNav dan layout dashboard
  
- **Dynamic Routes** `[id]`: Bracket syntax untuk dynamic segments (e.g., `/pengajuan/123`)

- **Nested Layouts**: Setiap `layout.tsx` wrap semua child routes di bawahnya

---

#### 2️⃣ `src/components/` - Shared Components

Komponen yang digunakan di berbagai fitur. **Hanya komponen presentational/UI generic**.

```
components/
├── ui/                               # Shadcn UI Primitives (DO NOT EDIT MANUALLY)
│   ├── button.tsx                    # Base button component
│   ├── input.tsx                     # Form input
│   ├── table.tsx                     # Data table
│   ├── card.tsx                      # Card container
│   ├── dropdown-menu.tsx             # Dropdown menu
│   ├── dialog.tsx                    # Modal dialog
│   └── [other-ui-components].tsx
│
└── layout/                           # Layout components
    ├── top-nav.tsx                   # Top navigation bar (used in dashboard)
    ├── page-container.tsx            # Wrapper untuk page content
    ├── navbar.tsx                    # (deprecated - for reference)
    └── sidebar.tsx                   # (deprecated - for reference)
```

**⚠️ Important:**
- **`components/ui/`**: Komponen dari Shadcn UI CLI. Jangan edit manual kecuali perlu customization minor.
- **`components/layout/`**: Layout wrappers yang digunakan di berbagai page.

---

#### 3️⃣ `src/features/` - Feature-First Architecture ⭐

**Ini adalah inti arsitektur aplikasi.** Setiap folder di `features/` merepresentasikan satu **domain bisnis** yang berdiri sendiri (self-contained).

```
features/
├── auth/                             # 🔐 Authentication Feature
│   ├── components/
│   │   ├── login-form.tsx            # Login form with Zod validation
│   │   └── forgot-password-modal.tsx # Password reset modal
│   ├── hooks/
│   │   └── use-auth.ts               # Auth state management & API calls
│   └── types/
│       └── index.ts                  # Auth-specific TypeScript types
│
├── dashboard/                        # 📊 Dashboard Feature
│   └── components/
│       ├── stats-card.tsx            # Statistics display card
│       └── recent-activity.tsx       # Recent activity widget
│
├── pengajuan/                        # 📝 Submission Management Feature
│   ├── components/
│   │   ├── forms/
│   │   │   └── submission-form.tsx   # Create/edit submission form
│   │   ├── tables/
│   │   │   └── pengajuan-table-view.tsx # Data table with actions
│   │   └── details/
│   │       └── submission-detail.tsx # Detail view component
│   ├── hooks/
│   │   └── use-submissions.ts        # CRUD operations & state
│   └── types/
│       └── index.ts                  # Submission-specific types
│
├── penomoran/                        # 🔢 Numbering Feature
│   └── components/
│       ├── numbering-modal.tsx       # Modal untuk assign nomor surat
│       └── numbering-table.tsx       # Table untuk manage penomoran
│
└── users/                            # 👥 User Management Feature
    └── components/
        └── user-table.tsx            # User CRUD operations table
```

**🎯 Feature-First Philosophy:**

Setiap feature module mengandung **semua yang dibutuhkan** untuk feature tersebut:

1. **`components/`**: UI components specific untuk feature ini
   - Bisa nested (forms/, tables/, details/) untuk organization
   - Hanya digunakan dalam feature ini, tidak di-share

2. **`hooks/`**: Custom React hooks untuk:
   - Data fetching (API calls)
   - State management (local state)
   - Business logic (validations, transformations)
   
   **Contoh**: `use-submissions.ts` handle semua CRUD operations untuk submissions.

3. **`types/`**: TypeScript interfaces & types specific untuk feature
   - Extend dari global types di `src/types/schema.ts`
   - Feature-specific validations atau derived types

**✅ Benefits:**
- **Encapsulation**: Semua terkait feature X ada di folder `features/X/`
- **Scalability**: Tambah feature baru tanpa affect existing code
- **Team Collaboration**: Multiple developers bisa kerja parallel pada different features
- **Code Discovery**: Easy to find where feature logic lives

---

#### 4️⃣ `src/lib/` - Utilities & Helpers

Shared utilities yang digunakan across features.

```
lib/
├── api.ts                            # API client & request helpers
├── utils.ts                          # Utility functions (cn(), formatters, etc.)
└── validations.ts                    # Shared Zod validation schemas
```

**Purpose:**
- **`api.ts`**: Centralized API configuration, base URL, auth headers
- **`utils.ts`**: Helper functions (Shadcn's `cn()` for classnames, date formatters, etc.)
- **`validations.ts`**: Reusable Zod schemas untuk form validation

---

#### 5️⃣ `src/types/` - Global Type Definitions

```
types/
└── schema.ts                         # Core data contracts
```

Contains **global TypeScript types** shared across entire application:
- `User`, `Submission`, `Department`, etc.
- API response/request types
- Shared enums

**Rule**: Hanya untuk types yang truly global. Feature-specific types masuk ke `features/[feature]/types/`.

---

## 🎨 Shadcn UI Components

Shadcn UI adalah collection of **copy-paste components** built on Radix UI. Components di-install ke `src/components/ui/` dan fully customizable.

### Adding New Components

Gunakan Shadcn CLI untuk add components:

```bash
# Using Bun (recommended)
bunx shadcn-ui@latest add button
bunx shadcn-ui@latest add dialog
bunx shadcn-ui@latest add form

# Using npx (alternative)
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dropdown-menu
```

### Available Commands

```bash
# Add a specific component
bunx shadcn-ui@latest add [component-name]

# Add multiple components at once
bunx shadcn-ui@latest add button input label

# Update existing components
bunx shadcn-ui@latest update

# View all available components
bunx shadcn-ui@latest
```

### Common Components

| Component | Use Case | Command |
|-----------|----------|---------|
| `button` | Buttons & actions | `bunx shadcn-ui@latest add button` |
| `input` | Form inputs | `bunx shadcn-ui@latest add input` |
| `table` | Data tables | `bunx shadcn-ui@latest add table` |
| `dialog` | Modals | `bunx shadcn-ui@latest add dialog` |
| `dropdown-menu` | Dropdown menus | `bunx shadcn-ui@latest add dropdown-menu` |
| `form` | Form handling | `bunx shadcn-ui@latest add form` |
| `card` | Content containers | `bunx shadcn-ui@latest add card` |
| `badge` | Status badges | `bunx shadcn-ui@latest add badge` |
| `select` | Dropdown select | `bunx shadcn-ui@latest add select` |
| `toast` | Notifications | `bunx shadcn-ui@latest add toast` |

### Component Configuration

Configuration ada di `components.json`:

```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Important Notes

- ⚠️ **DO NOT edit** files in `components/ui/` manually unless necessary
- Components are meant to be **copy-paste**, so you own the code
- Customize via **Tailwind classes** or **CSS variables** in `globals.css`
- Semua components support **dark mode** via Tailwind's `dark:` variant

---

## ✨ Key Features

### 1. 🔐 Authentication (`features/auth/`)
- Login dengan email & password
- Session management
- Forgot password flow
- Protected routes

### 2. 📊 Dashboard (`features/dashboard/`)
- Statistics cards (total submissions, pending, approved, etc.)
- Recent activity feed
- Quick actions
- Data visualization (charts)

### 3. 📝 Submission Management (`features/pengajuan/`)
- **List View**: Table dengan filtering, sorting, searching
- **Create**: Form untuk submission baru dengan validation
- **Edit**: Update existing submissions
- **Detail**: View lengkap submission dengan history
- **Status Tracking**: Pending → In Review → Approved/Rejected

### 4. 🔢 Document Numbering (`features/penomoran/`)
- Assign nomor surat otomatis
- Format: [PREFIX]/[NUMBER]/[YEAR]
- Tracking nomor yang sudah digunakan
- History penomoran

### 5. 👥 User Management (`features/users/`)
- CRUD operations untuk users
- Role-based access control (RBAC)
- User activation/deactivation
- Search & filter users

---

## 💻 Development Guidelines

### File Naming Conventions

```
✅ kebab-case for files:     login-form.tsx, use-auth.ts
✅ PascalCase for components: LoginForm, StatsCard
✅ camelCase for functions:   handleSubmit, fetchUsers
✅ UPPER_CASE for constants:  API_BASE_URL, MAX_FILE_SIZE
```

### Component Structure

```tsx
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface LoginFormProps {
  onSubmit: (data: LoginData) => void;
}

// 3. Component
export function LoginForm({ onSubmit }: LoginFormProps) {
  // 3a. Hooks
  const [email, setEmail] = useState('');
  
  // 3b. Handlers
  const handleSubmit = () => {
    // ...
  };
  
  // 3c. Render
  return (
    <form onSubmit={handleSubmit}>
      {/* JSX */}
    </form>
  );
}
```

### Custom Hooks Pattern

```typescript
// features/pengajuan/hooks/use-submissions.ts
export function useSubmissions() {
  const [data, setData] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchSubmissions = async () => {
    setLoading(true);
    // API call...
    setLoading(false);
  };
  
  return {
    data,
    loading,
    fetchSubmissions,
    // other operations
  };
}
```

### Adding a New Feature

1. **Create feature folder**
   ```bash
   mkdir -p src/features/new-feature/{components,hooks,types}
   ```

2. **Create necessary files**
   ```
   features/new-feature/
   ├── components/
   │   └── new-feature-form.tsx
   ├── hooks/
   │   └── use-new-feature.ts
   └── types/
       └── index.ts
   ```

3. **Add route in `app/`**
   ```bash
   mkdir -p src/app/\(dashboard\)/new-feature
   # Create page.tsx
   ```

4. **Update navigation** in `components/layout/top-nav.tsx`

---

## 🎯 Best Practices

### 1. Package Management
- ✅ **Always use Bun** as package manager
  ```bash
  bun add [package]        # Add dependency
  bun remove [package]     # Remove dependency
  bun install              # Install all dependencies
  ```
- ❌ **Don't mix** npm, yarn, or pnpm commands

### 2. Shadcn UI Components
- ✅ **Use CLI** untuk add components: `bunx shadcn-ui@latest add [component]`
- ✅ Customize via Tailwind classes atau CSS variables
- ❌ **Jangan edit** files di `components/ui/` secara manual kecuali absolutely necessary
- ✅ Jika perlu customization complex, consider membuat wrapper component

### 3. State Management
- ✅ **Local state** (useState) untuk UI state (modals, forms)
- ✅ **Custom hooks** untuk feature-specific state & business logic
- ✅ **Lift state up** hanya when necessary
- ❌ **Avoid prop drilling** → gunakan hooks atau context

### 4. Business Logic Placement
- ✅ **Logika bisnis** masuk ke `features/[feature]/hooks/`
- ✅ **API calls** di custom hooks, bukan di components
- ✅ **Validations** dengan Zod schemas di `lib/validations.ts` atau feature types
- ❌ **Jangan taruh** complex logic di UI components

### 5. Code Organization
- ✅ **Feature-first**: Group by feature, bukan by technical type
- ✅ **Co-location**: Keep related files close (component + hook + type)
- ✅ **Single Responsibility**: One component = one responsibility
- ❌ **Avoid** God components (500+ lines)

### 6. TypeScript
- ✅ **Always type** props, state, API responses
- ✅ Use **interfaces** untuk object shapes
- ✅ Use **types** untuk unions, intersections
- ❌ **Avoid `any`** → use `unknown` if type is truly unknown

### 7. Performance
- ✅ Use **React.memo** untuk expensive components
- ✅ Use **useMemo/useCallback** untuk expensive computations
- ✅ **Lazy load** routes dengan Next.js dynamic imports
- ✅ **Optimize images** dengan Next.js `<Image>` component

### 8. Styling
- ✅ Use **Tailwind utility classes** first
- ✅ Use **CSS modules** untuk complex component-specific styles
- ✅ Use **Shadcn's `cn()`** utility untuk conditional classes
  ```tsx
  import { cn } from '@/lib/utils';
  
  <div className={cn("base-class", isActive && "active-class")} />
  ```
- ❌ **Avoid** inline styles unless dynamic

### 9. Forms & Validation
- ✅ Use **Zod** untuk schema validation
- ✅ Use **React Hook Form** untuk complex forms (optional)
- ✅ **Validate on blur** untuk better UX
- ✅ Show **clear error messages**

### 10. API Calls
- ✅ **Centralize** API config di `lib/api.ts`
- ✅ Handle **loading states** (skeleton, spinners)
- ✅ Handle **error states** (toast notifications, error boundaries)
- ✅ Implement **retry logic** untuk critical operations

---

## 📚 Additional Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Bun Documentation](https://bun.sh/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Validation](https://zod.dev/)

---

## 🤝 Contributing

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit: `git commit -m "feat: add your feature"`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

---

## 📝 Notes

- **Monorepo Structure**: Frontend ini adalah bagian dari monorepo. Backend API ada di `../e-office-api-v2/`
- **API Integration**: Configure `NEXT_PUBLIC_API_URL` di `.env.local` untuk connect ke backend
- **Authentication**: Token disimpan di localStorage/cookies (check `features/auth/hooks/use-auth.ts`)

---

**Happy Coding! 🚀**

Built with ❤️ using Next.js 14, Shadcn UI, and Bun.
