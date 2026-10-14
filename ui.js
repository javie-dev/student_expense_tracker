/* ==========================================================
   ui.js  -  everything that draws on the page
   ========================================================== */

const $ = (id) => document.getElementById(id);

/* ---------- Small helpers ---------- */

const pesoFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const formatPeso = (number) => pesoFormatter.format(number);

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

// Local date (not UTC) so "today" is correct in the Philippines
function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function currentMonthString() {
  return todayString().slice(0, 7);
}

// Stops user text from being treated as HTML
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

/* ---------- Form + filters ---------- */

function fillCategorySelects() {
  $("category").innerHTML = CATEGORIES
    .map((name) => `<option value="${name}">${name}</option>`)
    .join("");

  $("filter-category").innerHTML =
    `<option value="all">All categories</option>` +
    CATEGORIES.map((name) => `<option value="${name}">${name}</option>`).join("");
}

function getFilters() {
  return {
    month: $("filter-month").value,
    category: $("filter-category").value,
    search: $("filter-search").value
  };
}

function readForm() {
  return {
    title: $("title").value,
    amount: $("amount").value,
    category: $("category").value,
    date: $("date").value,
    note: $("note").value
  };
}

function resetForm() {
  $("expense-form").reset();
  $("date").value = todayString();
  $("form-error").textContent = "";
  $("form-title").textContent = "Add expense";
  $("submit-btn").textContent = "Add expense";
  $("cancel-btn").hidden = true;
}

function fillFormForEdit(expense) {
  $("title").value = expense.title;
  $("amount").value = expense.amount;
  $("category").value = expense.category;
  $("date").value = expense.date;
  $("note").value = expense.note;
  $("form-error").textContent = "";
  $("form-title").textContent = "Edit expense";
  $("submit-btn").textContent = "Save changes";
  $("cancel-btn").hidden = false;
  $("title").focus();
}

/* ---------- Rendering ---------- */

function renderSummary(list) {
  $("stat-total").textContent = formatPeso(totalOf(list));
  $("stat-count").textContent = list.length;

  const byCategory = totalsByCategory(list);
  $("stat-top").textContent = byCategory.length ? byCategory[0].category : "None yet";
}

function renderBudget(month) {
  const figure = $("budget-figure");
  const message = $("budget-message");
  const fill = $("meter-fill");
  const meter = $("meter");

  $("budget-input").value = budget || "";
  fill.className = "meter-fill";

  if (!month) {
    figure.textContent = "";
    fill.style.width = "0%";
    meter.setAttribute("aria-valuenow", 0);
    message.textContent = "Pick a month in the filters to compare it with your budget.";
    return;
  }

  // Budget compares against the whole month, ignoring category and search filters
  const spent = totalOf(filterExpenses({ month }));

  if (budget <= 0) {
    figure.textContent = `${formatPeso(spent)} spent this month`;
    fill.style.width = "0%";
    meter.setAttribute("aria-valuenow", 0);
    message.textContent = "Set a monthly budget to see how much you have left.";
    return;
  }

  const percent = Math.min(100, (spent / budget) * 100);
  figure.textContent = `${formatPeso(spent)} of ${formatPeso(budget)}`;
  fill.style.width = percent + "%";
  meter.setAttribute("aria-valuenow", Math.round(percent));

  if (spent > budget) {
    fill.classList.add("over");
    message.textContent = `You are ${formatPeso(spent - budget)} over budget.`;
  } else if (percent >= 75) {
    fill.classList.add("warn");
    message.textContent = `${formatPeso(budget - spent)} left. You have used ${Math.round(percent)}% already.`;
  } else {
    fill.classList.add("ok");
    message.textContent = `${formatPeso(budget - spent)} left. You are on track.`;
  }
}

function renderBreakdown(list) {
  const rows = totalsByCategory(list);
  const total = totalOf(list);

  if (!rows.length) {
    $("breakdown").innerHTML = `<li class="breakdown-empty">Nothing to show yet.</li>`;
    return;
  }

  $("breakdown").innerHTML = rows.map(({ category, total: amount }) => {
    const percent = total ? Math.round((amount / total) * 100) : 0;
    return `
      <li class="breakdown-row" data-cat="${category}">
        <span class="breakdown-name">${category}</span>
        <span class="bar"><span class="bar-fill" style="width:${percent}%"></span></span>
        <span class="breakdown-amount">${formatPeso(amount)} <small>${percent}%</small></span>
      </li>`;
  }).join("");
}

function renderList(list) {
  $("empty-state").hidden = list.length > 0;

  $("expense-list").innerHTML = list.map((expense) => `
    <li class="expense" data-id="${expense.id}" data-cat="${expense.category}">
      <div class="expense-main">
        <span class="expense-title">${escapeHtml(expense.title)}</span>
        <span class="expense-meta">
          <span class="pill">${expense.category}</span>
          <span>${formatDate(expense.date)}</span>
          ${expense.note ? `<span class="expense-note">${escapeHtml(expense.note)}</span>` : ""}
        </span>
      </div>
      <span class="expense-amount">${formatPeso(expense.amount)}</span>
      <div class="expense-actions">
        <button type="button" class="btn btn-small" data-action="edit" aria-label="Edit ${escapeHtml(expense.title)}">Edit</button>
        <button type="button" class="btn btn-small btn-danger-outline" data-action="delete" aria-label="Delete ${escapeHtml(expense.title)}">Delete</button>
      </div>
    </li>`).join("");
}

// Redraws everything from the current data + filters
function renderAll() {
  const filters = getFilters();
  const list = filterExpenses(filters);

  renderSummary(list);
  renderBudget(filters.month);
  renderBreakdown(list);
  renderList(list);
}
