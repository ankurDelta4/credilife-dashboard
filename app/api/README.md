# API Documentation

This folder contains all the API routes for the Loan Application system. Each subfolder represents a different resource or feature.

## Folder Structure

```
api/
├── auth/           # Authentication endpoints
├── users/          # User management endpoints
├── loans/          # Loan management endpoints
└── README.md       # This file
```

## How to Create New API Endpoints

### 1. Create a New Route File

For each API endpoint, create a file named `route.ts` in the appropriate folder:

```
app/api/users/route.ts          # GET /api/users, POST /api/users
app/api/users/[id]/route.ts     # GET /api/users/[id], PUT /api/users/[id], DELETE /api/users/[id]
```

### 2. Export HTTP Methods

Each route file should export functions named after HTTP methods:

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Handle GET request
  return NextResponse.json({ data: [] });
}

export async function POST(request: NextRequest) {
  // Handle POST request
  const body = await request.json();
  return NextResponse.json({ success: true });
}
```

### 3. Handle Dynamic Routes

For dynamic routes (like `/api/users/[id]`), access the parameter:

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // Use the id parameter
  return NextResponse.json({ id });
}
```

### 4. Error Handling

Always include proper error handling:

```typescript
export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ data: [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### 5. Request Validation

Validate incoming requests:

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Process the request
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }
}
```

## Best Practices

1. **Consistent Response Format**: Use a consistent response structure across all endpoints
2. **Error Handling**: Always handle errors gracefully with appropriate HTTP status codes
3. **Validation**: Validate all incoming data
4. **TypeScript**: Use TypeScript for better type safety
5. **Documentation**: Document your API endpoints with clear comments
6. **Security**: Implement proper authentication and authorization where needed

## Example Response Format

```typescript
// Success response
{
  "success": true,
  "data": { /* your data */ },
  "message": "Operation completed successfully"
}

// Error response
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Testing Your APIs

You can test your APIs using:
- Postman
- curl commands
- The built-in Next.js API testing
- Frontend components (see `/lib/services/` folder for examples)

## Authentication

For protected routes, check for authentication:

```typescript
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization');
  
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Verify token and proceed
}
```
