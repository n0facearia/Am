import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode("super-secret-key-change-me");

interface User {
  id: string;
  username: string;
  passwordHash: string;
}

interface Todo {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
}

// In-memory tables
const users: User[] = [];
const todos: Todo[] = [];

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hashBuffer).toString("hex");
}

async function verifyToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.subUserId as string;
  } catch {
    return null;
  }
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ---------------- AUTH ROUTES ----------------
      if (url.pathname === "/api/auth/register" && method === "POST") {
        const body = await req.json();
        const { username, password } = body;
        if (!username || !password) {
          return Response.json({ error: "Username and password required" }, { status: 400, headers: corsHeaders });
        }
        if (users.some((u) => u.username === username)) {
          return Response.json({ error: "Username already exists" }, { status: 400, headers: corsHeaders });
        }
        const passwordHash = await hashPassword(password);
        const user: User = { id: crypto.randomUUID(), username, passwordHash };
        users.push(user);
        return Response.json({ message: "User registered successfully" }, { status: 201, headers: corsHeaders });
      }

      if (url.pathname === "/api/auth/login" && method === "POST") {
        const body = await req.json();
        const { username, password } = body;
        const user = users.find((u) => u.username === username);
        if (!user) {
          return Response.json({ error: "Invalid credentials" }, { status: 401, headers: corsHeaders });
        }
        const passwordHash = await hashPassword(password);
        if (user.passwordHash !== passwordHash) {
          return Response.json({ error: "Invalid credentials" }, { status: 401, headers: corsHeaders });
        }
        const token = await new SignJWT({ subUserId: user.id })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("2h")
          .sign(JWT_SECRET);
        return Response.json({ token, username }, { headers: corsHeaders });
      }

      // ---------------- TODO CRUD ROUTES ----------------
      if (url.pathname.startsWith("/api/todos")) {
        const userId = await verifyToken(req);
        if (!userId) {
          return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
        }

        if (url.pathname === "/api/todos" && method === "GET") {
          const userTodos = todos.filter((t) => t.userId === userId);
          return Response.json(userTodos, { headers: corsHeaders });
        }

        if (url.pathname === "/api/todos" && method === "POST") {
          const body = await req.json();
          const { title } = body;
          if (!title || typeof title !== "string" || title.trim() === "") {
            return Response.json({ error: "Title is required" }, { status: 400, headers: corsHeaders });
          }
          const newTodo: Todo = {
            id: crypto.randomUUID(),
            userId,
            title: title.trim(),
            completed: false,
          };
          todos.push(newTodo);
          return Response.json(newTodo, { status: 201, headers: corsHeaders });
        }

        const match = url.pathname.match(/\/api\/todos\/([a-zA-Z0-9-]+)/);
        if (match) {
          const todoId = match[1];
          const todoIndex = todos.findIndex((t) => t.id === todoId && t.userId === userId);
          if (todoIndex === -1) {
            return Response.json({ error: "Todo not found" }, { status: 404, headers: corsHeaders });
          }

          if (method === "PUT") {
            const body = await req.json();
            const { title, completed } = body;
            if (title !== undefined) {
              todos[todoIndex].title = title;
            }
            if (completed !== undefined) {
              todos[todoIndex].completed = !!completed;
            }
            return Response.json(todos[todoIndex], { headers: corsHeaders });
          }

          if (method === "DELETE") {
            todos.splice(todoIndex, 1);
            return Response.json({ message: "Todo deleted successfully" }, { headers: corsHeaders });
          }
        }
      }

      return Response.json({ error: "Not Found" }, { status: 404, headers: corsHeaders });
    } catch (e: any) {
      return Response.json({ error: e.message || "Internal Server Error" }, { status: 500, headers: corsHeaders });
    }
  },
});

console.log(`Backend server running at http://localhost:${server.port}`);
