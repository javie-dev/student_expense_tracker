/* ==========================================================
   data.js  -  the "brain": data + CRUD logic (no HTML here)
   ========================================================== */

const STORAGE_KEY = "student-expense-tracker:v1";

// Fixed list of categories (an array of strings)
const CATEGORIES = ["Food", "Transport", "School", "Bills", "Health", "Fun", "Other"];

// App state. `expenses` is an ARRAY of OBJECTS. Each object looks like:
// { id, title, amount, category, date, note, createdAt }
let expenses = [];
let budget = 0; // monthly budget in pesos (0 = not set)

/* ---------- Saving and loading (localStorage) ---------- */

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ expenses, budget }));
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    expenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
    budget = Number(parsed.budget) || 0;
  } catch (error) {
    // Corrupted data? Start fresh instead of crashing.
    expenses = [];
    budget = 0;
  }
}

/* ---------- CRUD ---------- */

// CREATE
function createExpense({ title, amount, category, date, note }) {
  const expense = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: title.trim(),
    amount: Number(amount),
    category,
    date,                       // "YYYY-MM-DD"
    note: (note || "").trim(),
    createdAt: Date.now()
  };
  expenses.push(expense);
  saveData();
  return expense;
}

// READ (one)
function getExpenseById(id) {
  return expenses.find((expense) => expense.id === id);
}

// READ (many, with filters)
function filterExpenses({ month = "", category = "all", search = "" } = {}) {
  const query = search.trim().toLowerCase();

  return expenses
    .filter((expense) => {
      if (month && !expense.date.startsWith(month)) return false;
      if (category !== "all" && expense.category !== category) return false;
      if (query) {
        const haystack = (expense.title + " " + expense.note).toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    // newest date first; same date -> newest entry first
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

// UPDATE
function updateExpense(id, changes) {
  const expense = getExpenseById(id);
  if (!expense) return null;

  expense.title = changes.title.trim();
  expense.amount = Number(changes.amount);
  expense.category = changes.category;
  expense.date = changes.date;
  expense.note = (changes.note || "").trim();

  saveData();
  return expense;
}

// DELETE
function deleteExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveData();
}

function clearAllExpenses() {
  expenses = [];
  saveData();
}

function setBudget(amount) {
  budget = Math.max(0, Number(amount) || 0);
  saveData();
}

/* ---------- Calculations ---------- */

function totalOf(list) {
  return list.reduce((sum, expense) => sum + expense.amount, 0);
}

// Returns e.g. [{ category: "Food", total: 850 }, ...] biggest first
function totalsByCategory(list) {
  const totals = {};
  list.forEach((expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
  });
  return Object.entries(totals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/* ---------- Export ---------- */

function expensesToCSV(list) {
  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [["Date", "Title", "Category", "Amount", "Note"]];
  list.forEach((e) => rows.push([e.date, e.title, e.category, e.amount.toFixed(2), e.note]));
  return rows.map((row) => row.map(escape).join(",")).join("\n");
}
