/* ==========================================================
   app.js  -  connects user actions (clicks, typing) to the
   data functions (data.js) and the drawing functions (ui.js)
   ========================================================== */

let editingId = null; // null = adding new, otherwise the id being edited

/* ---------- Validation ---------- */

function validateForm(values) {
  if (!values.title.trim()) return "Enter what you spent on.";
  const amount = Number(values.amount);
  if (!values.amount || isNaN(amount) || amount <= 0) return "Amount must be greater than zero.";
  if (!values.date) return "Pick a date.";
  if (!CATEGORIES.includes(values.category)) return "Pick a category.";
  return "";
}

/* ---------- Add / edit ---------- */

$("expense-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const values = readForm();
  const error = validateForm(values);
  if (error) {
    $("form-error").textContent = error;
    return;
  }

  if (editingId) {
    updateExpense(editingId, values);   // UPDATE
  } else {
    createExpense(values);              // CREATE
  }

  // Make sure the new/edited expense is visible under the current filters
  if ($("filter-month").value && !values.date.startsWith($("filter-month").value)) {
    $("filter-month").value = values.date.slice(0, 7);
  }

  editingId = null;
  resetForm();
  renderAll();
});

$("cancel-btn").addEventListener("click", () => {
  editingId = null;
  resetForm();
});

/* ---------- Edit / delete buttons (event delegation) ---------- */

$("expense-list").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.closest(".expense").dataset.id;

  if (button.dataset.action === "edit") {
    const expense = getExpenseById(id);
    if (!expense) return;
    editingId = id;
    fillFormForEdit(expense);
    $("expense-form").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (button.dataset.action === "delete") {
    const expense = getExpenseById(id);
    if (expense && confirm(`Delete "${expense.title}"?`)) {
      deleteExpense(id);                // DELETE
      if (editingId === id) {
        editingId = null;
        resetForm();
      }
      renderAll();
    }
  }
});

/* ---------- Budget ---------- */

$("budget-form").addEventListener("submit", (event) => {
  event.preventDefault();
  setBudget($("budget-input").value);
  renderAll();
});

/* ---------- Filters ---------- */

["filter-month", "filter-category"].forEach((id) => $(id).addEventListener("change", renderAll));
$("filter-search").addEventListener("input", renderAll);

$("all-time-btn").addEventListener("click", () => {
  $("filter-month").value = "";
  renderAll();
});

/* ---------- Export + clear ---------- */

$("export-btn").addEventListener("click", () => {
  const list = filterExpenses(getFilters());
  if (!list.length) {
    alert("There are no expenses to export.");
    return;
  }
  const blob = new Blob([expensesToCSV(list)], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "expenses.csv";
  link.click();
  URL.revokeObjectURL(link.href);
});

$("clear-btn").addEventListener("click", () => {
  if (!expenses.length) return;
  if (confirm("Delete ALL expenses? This cannot be undone.")) {
    clearAllExpenses();
    editingId = null;
    resetForm();
    renderAll();
  }
});

/* ---------- Start the app ---------- */

loadData();
fillCategorySelects();
resetForm();
$("filter-month").value = currentMonthString();
renderAll();
