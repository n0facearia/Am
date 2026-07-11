const API_BASE = "http://localhost:3000/api";

// Elements
const authView = document.getElementById("auth-view");
const dashboardView = document.getElementById("dashboard-view");
const authTitle = document.getElementById("auth-title");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authError = document.getElementById("auth-error");
const authForm = document.getElementById("auth-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const toggleAuthMode = document.getElementById("toggle-auth-mode");
const toggleMessage = document.getElementById("toggle-message");

const userDisplay = document.getElementById("user-display");
const logoutBtn = document.getElementById("logout-btn");
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoError = document.getElementById("todo-error");
const todoList = document.getElementById("todo-list");

let isLoginMode = true;
let token = localStorage.getItem("token") || null;
let currentUser = localStorage.getItem("username") || null;

// Initialize View
function init() {
    if (token) {
        showDashboard();
    } else {
        showAuth();
    }
}

function showAuth() {
    authView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
    authError.classList.add("hidden");
    usernameInput.value = "";
    passwordInput.value = "";
}

function showDashboard() {
    authView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    todoError.classList.add("hidden");
    userDisplay.textContent = currentUser;
    fetchTodos();
}

// Toggle Auth Mode
toggleAuthMode.addEventListener("click", (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.textContent = "Login";
        authSubmitBtn.textContent = "Login";
        toggleMessage.textContent = "Don't have an account?";
        toggleAuthMode.textContent = "Register";
    } else {
        authTitle.textContent = "Register";
        authSubmitBtn.textContent = "Register";
        toggleMessage.textContent = "Already have an account?";
        toggleAuthMode.textContent = "Login";
    }
    authError.classList.add("hidden");
});

// Auth Form Submission
authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authError.classList.add("hidden");

    const username = usernameInput.value;
    const password = passwordInput.value;
    const endpoint = isLoginMode ? "/auth/login" : "/auth/register";

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "An error occurred");
        }

        if (isLoginMode) {
            token = data.token;
            currentUser = data.username;
            localStorage.setItem("token", token);
            localStorage.setItem("username", currentUser);
            showDashboard();
        } else {
            // Successfully registered, auto-switch to login mode
            alert("Registration successful! Please login.");
            isLoginMode = true;
            authTitle.textContent = "Login";
            authSubmitBtn.textContent = "Login";
            toggleMessage.textContent = "Don't have an account?";
            toggleAuthMode.textContent = "Register";
            passwordInput.value = "";
        }
    } catch (err) {
        authError.textContent = err.message;
        authError.classList.remove("hidden");
    }
});

// Logout
logoutBtn.addEventListener("click", () => {
    token = null;
    currentUser = null;
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    showAuth();
});

// Fetch Todos
async function fetchTodos() {
    try {
        const response = await fetch(`${API_BASE}/todos`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Could not fetch tasks");
        }
        renderTodos(data);
    } catch (err) {
        todoError.textContent = err.message;
        todoError.classList.remove("hidden");
    }
}

// Render Todos
function renderTodos(todos) {
    todoList.innerHTML = "";
    todos.forEach(todo => {
        const li = document.createElement("li");
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="todo-left">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${todo.title}</span>
            </div>
            <div class="todo-actions">
                <button class="delete-btn">Delete</button>
            </div>
        `;

        // Checkbox change event
        const checkbox = li.querySelector(".todo-checkbox");
        checkbox.addEventListener("change", () => toggleTodo(todo.id, checkbox.checked));

        // Delete button event
        const deleteBtn = li.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

        todoList.appendChild(li);
    });
}

// Add Todo
todoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    todoError.classList.add("hidden");
    const title = todoInput.value.trim();
    if (!title) return;

    try {
        const response = await fetch(`${API_BASE}/todos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Could not add task");
        }
        todoInput.value = "";
        fetchTodos();
    } catch (err) {
        todoError.textContent = err.message;
        todoError.classList.remove("hidden");
    }
});

// Toggle Todo status
async function toggleTodo(id, completed) {
    try {
        const response = await fetch(`${API_BASE}/todos/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ completed })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Could not update task");
        }
        fetchTodos();
    } catch (err) {
        todoError.textContent = err.message;
        todoError.classList.remove("hidden");
    }
}

// Delete Todo
async function deleteTodo(id) {
    try {
        const response = await fetch(`${API_BASE}/todos/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Could not delete task");
        }
        fetchTodos();
    } catch (err) {
        todoError.textContent = err.message;
        todoError.classList.remove("hidden");
    }
}

// Start app
init();
