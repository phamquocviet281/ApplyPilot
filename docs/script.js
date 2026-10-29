const STORAGE_KEY = 'applypilot-applications-v1';
const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];
let applications = loadApplications();
let toastTimer;

const elements = {
  body: document.getElementById('applicationsBody'),
  empty: document.getElementById('emptyState'),
  resultCount: document.getElementById('resultCount'),
  search: document.getElementById('searchInput'),
  filter: document.getElementById('statusFilter'),
  dialog: document.getElementById('applicationDialog'),
  form: document.getElementById('applicationForm'),
  id: document.getElementById('applicationId'),
  company: document.getElementById('companyInput'),
  position: document.getElementById('positionInput'),
  status: document.getElementById('applicationStatus'),
  date: document.getElementById('dateInput'),
  notes: document.getElementById('notesInput'),
  title: document.getElementById('dialogTitle'),
  error: document.getElementById('formError'),
  toast: document.getElementById('toast')
};

function loadApplications() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(isValidApplication) : [];
  } catch (error) {
    return [];
  }
}

function isValidApplication(job) {
  return job && typeof job.id === 'string' && typeof job.company === 'string' &&
    typeof job.position === 'string' && STATUSES.includes(job.status) && typeof job.date === 'string';
}

function saveApplications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return escapeHTML(dateString);
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function getVisibleApplications() {
  const search = elements.search.value.trim().toLowerCase();
  const status = elements.filter.value;
  return applications.filter(job => {
    const matchesSearch = `${job.company} ${job.position} ${job.notes || ''}`.toLowerCase().includes(search);
    return matchesSearch && (status === 'All' || job.status === status);
  }).sort((a, b) => b.date.localeCompare(a.date));
}

function renderApplications() {
  const visible = getVisibleApplications();
  elements.body.innerHTML = visible.map(job => `
    <tr>
      <td class="company-name">${escapeHTML(job.company)}</td>
      <td class="position-name">${escapeHTML(job.position)}</td>
      <td><span class="status-pill status-${job.status}">${job.status}</span></td>
      <td>${formatDate(job.date)}</td>
      <td><div class="action-group">
        <button class="action-button" data-action="edit" data-id="${escapeHTML(job.id)}">Edit</button>
        <button class="action-button delete" data-action="delete" data-id="${escapeHTML(job.id)}">Delete</button>
      </div></td>
    </tr>`).join('');
  elements.empty.classList.toggle('show', visible.length === 0);
  elements.body.closest('table').style.display = visible.length === 0 ? 'none' : 'table';
  elements.resultCount.textContent = `${visible.length} application${visible.length === 1 ? '' : 's'} shown`;
  renderStatistics();
}

function renderStatistics() {
  const counts = Object.fromEntries(STATUSES.map(status => [status, applications.filter(job => job.status === status).length]));
  document.getElementById('totalCount').textContent = applications.length;
  document.getElementById('appliedCount').textContent = counts.Applied;
  document.getElementById('interviewCount').textContent = counts.Interview;
  document.getElementById('offerCount').textContent = counts.Offer;
  document.getElementById('rejectedCount').textContent = counts.Rejected;
  const total = applications.length || 1;
  document.getElementById('statusBreakdown').innerHTML = STATUSES.map(status => `
    <div class="breakdown-row"><span>${status}</span><div class="bar-track"><div class="bar-fill bar-${status}" style="width:${counts[status] / total * 100}%"></div></div><strong>${counts[status]}</strong></div>`).join('');
}

function openDialog(job = null) {
  elements.form.reset();
  elements.error.textContent = '';
  elements.id.value = job ? job.id : '';
  elements.title.textContent = job ? 'Edit application' : 'Add an application';
  elements.company.value = job ? job.company : '';
  elements.position.value = job ? job.position : '';
  elements.status.value = job ? job.status : 'Applied';
  elements.date.value = job ? job.date : new Date().toISOString().slice(0, 10);
  elements.notes.value = job ? (job.notes || '') : '';
  elements.dialog.showModal();
  elements.company.focus();
}

function closeDialog() {
  elements.dialog.close();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2600);
}

function handleSubmit(event) {
  event.preventDefault();
  const company = elements.company.value.trim();
  const position = elements.position.value.trim();
  const date = elements.date.value;
  if (!company || !position || !date) {
    elements.error.textContent = 'Please fill in the company, position, and date.';
    return;
  }
  const existingId = elements.id.value;
  const oldJob = applications.find(job => job.id === existingId);
  const job = {
    id: existingId || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    company, position, status: elements.status.value, date,
    notes: elements.notes.value.trim(),
    createdAt: oldJob ? oldJob.createdAt : new Date().toISOString()
  };
  if (oldJob) {
    applications = applications.map(item => item.id === existingId ? job : item);
  } else {
    applications.push(job);
  }
  saveApplications();
  closeDialog();
  renderApplications();
  showToast(oldJob ? 'Application updated.' : 'Application added.');
}

function handleTableClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const job = applications.find(item => item.id === button.dataset.id);
  if (!job) return;
  if (button.dataset.action === 'edit') {
    openDialog(job);
  } else if (button.dataset.action === 'delete') {
    const confirmed = window.confirm(`Delete the application for ${job.company}? This cannot be undone.`);
    if (!confirmed) return;
    applications = applications.filter(item => item.id !== job.id);
    saveApplications();
    renderApplications();
    showToast('Application deleted.');
  }
}

function clearFilters() {
  elements.search.value = '';
  elements.filter.value = 'All';
  renderApplications();
}

document.getElementById('addTopButton').addEventListener('click', () => openDialog());
document.getElementById('addPanelButton').addEventListener('click', () => openDialog());
document.getElementById('emptyAddButton').addEventListener('click', () => openDialog());
document.getElementById('closeDialog').addEventListener('click', closeDialog);
document.getElementById('cancelDialog').addEventListener('click', closeDialog);
document.getElementById('clearSearchButton').addEventListener('click', clearFilters);
elements.form.addEventListener('submit', handleSubmit);
elements.body.addEventListener('click', handleTableClick);
elements.search.addEventListener('input', renderApplications);
elements.filter.addEventListener('change', renderApplications);
elements.dialog.addEventListener('click', event => {
  if (event.target === elements.dialog) closeDialog();
});

renderApplications();
