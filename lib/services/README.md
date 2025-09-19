# Services Documentation

This folder contains all the API service functions and custom hooks for consuming the backend APIs. It provides a clean abstraction layer between your components and the API endpoints.

## Folder Structure

```
lib/services/
├── api/              # Base API configuration and utilities
├── auth.ts           # Authentication services
├── users.ts          # User management services
├── loans.ts          # Loan management services
├── hooks/            # Custom React hooks
│   ├── useAuth.ts    # Authentication hook
│   ├── useUsers.ts   # Users management hook
│   └── useLoans.ts   # Loans management hook
└── README.md         # This file
```

## How to Use Services

### 1. Import and Use Service Functions

```typescript
import { authService } from '@/lib/services/auth';
import { usersService } from '@/lib/services/users';
import { loansService } from '@/lib/services/loans';

// In your component
const handleLogin = async () => {
  try {
    const response = await authService.login('user@example.com', 'password');
    console.log('Login successful:', response.data);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### 2. Use Custom Hooks

```typescript
import { useAuth } from '@/lib/services/hooks/useAuth';
import { useUsers } from '@/lib/services/hooks/useUsers';
import { useLoans } from '@/lib/services/hooks/useLoans';

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth();
  const { users, fetchUsers, createUser } = useUsers();
  const { loans, fetchLoans, createLoan } = useLoans();

  // Use the data and functions in your component
}
```

## Service Functions

### Authentication Service (`auth.ts`)

- `login(email, password)` - User login
- `register(email, password)` - User registration
- `getCurrentUser()` - Get current user info
- `logout()` - User logout

### Users Service (`users.ts`)

- `getUsers(params?)` - Get all users with optional filters
- `getUser(id)` - Get user by ID
- `createUser(userData)` - Create new user
- `updateUser(id, userData)` - Update user
- `deleteUser(id)` - Delete user

### Loans Service (`loans.ts`)

- `getLoans(params?)` - Get all loans with optional filters
- `getLoan(id)` - Get loan by ID
- `createLoan(loanData)` - Create new loan application
- `updateLoan(id, loanData)` - Update loan
- `deleteLoan(id)` - Delete loan
- `approveLoan(id)` - Approve loan
- `rejectLoan(id, reason?)` - Reject loan

## Custom Hooks

### useAuth Hook

Provides authentication state and functions:

```typescript
const {
  user,           // Current user object
  isAuthenticated, // Boolean authentication status
  isLoading,      // Loading state
  login,          // Login function
  register,       // Register function
  logout,         // Logout function
  error           // Error state
} = useAuth();
```

### useUsers Hook

Provides user management functionality:

```typescript
const {
  users,          // Array of users
  isLoading,      // Loading state
  error,          // Error state
  fetchUsers,     // Fetch users function
  getUser,        // Get single user function
  createUser,     // Create user function
  updateUser,     // Update user function
  deleteUser      // Delete user function
} = useUsers();
```

### useLoans Hook

Provides loan management functionality:

```typescript
const {
  loans,          // Array of loans
  isLoading,      // Loading state
  error,          // Error state
  fetchLoans,     // Fetch loans function
  getLoan,        // Get single loan function
  createLoan,     // Create loan function
  updateLoan,     // Update loan function
  deleteLoan,     // Delete loan function
  approveLoan,    // Approve loan function
  rejectLoan      // Reject loan function
} = useLoans();
```

## Error Handling

All services include proper error handling:

```typescript
try {
  const response = await usersService.getUsers();
  // Handle success
} catch (error) {
  // Error is already formatted with proper structure
  console.error('Error:', error.message);
  console.error('Code:', error.code);
}
```

## Response Format

All API responses follow a consistent format:

```typescript
// Success response
{
  success: true,
  data: { /* your data */ },
  message: "Operation completed successfully"
}

// Error response
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE"
}
```

## Best Practices

1. **Use Custom Hooks**: Prefer using custom hooks over direct service calls in components
2. **Error Handling**: Always handle errors appropriately in your components
3. **Loading States**: Use loading states to provide better UX
4. **TypeScript**: All services are fully typed for better development experience
5. **Caching**: Consider implementing caching for frequently accessed data
6. **Optimistic Updates**: Use optimistic updates for better perceived performance

## Adding New Services

1. Create a new service file (e.g., `notifications.ts`)
2. Add the service functions following the same pattern
3. Create a corresponding custom hook (e.g., `useNotifications.ts`)
4. Export the hook from the hooks index file
5. Update this README with documentation

## Example Usage in Components

```typescript
import { useAuth } from '@/lib/services/hooks/useAuth';
import { useLoans } from '@/lib/services/hooks/useLoans';

function LoanApplication() {
  const { user, isAuthenticated } = useAuth();
  const { createLoan, isLoading } = useLoans();

  const handleSubmit = async (formData) => {
    if (!isAuthenticated) {
      alert('Please login first');
      return;
    }

    try {
      await createLoan({
        userId: user.id,
        ...formData
      });
      alert('Loan application submitted successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
    </form>
  );
}
```
