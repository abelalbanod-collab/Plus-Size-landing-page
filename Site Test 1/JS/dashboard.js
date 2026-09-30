const targetInput = document.querySelector('#goal-target');
const progressBar = document.querySelector('.progress-track');
const progressFill = document.querySelector('#goal-progress');
const progressLabel = document.querySelector('#goal-percent');
const remainingLabel = document.querySelector('#goal-remaining');
const goalPeriodLabel = document.querySelector('#goal-period-label');
const taskList = document.querySelector('#task-list');
const taskForm = document.querySelector('#task-form');
const taskDetails = document.querySelector('.add-task-details');
const taskCount = document.querySelector('#task-count');
const periodSelect = document.querySelector('#report-period');
const metricValues = document.querySelectorAll('.metric-value');
const metricNotes = document.querySelectorAll('.metric-note');
const currentDateLabel = document.querySelector('#current-date');

const samplePeriods = {
    'this-month': {
        revenue: 24800,
        costs: 13450,
        profit: 11350,
        customers: 18,
        target: 30000,
        targetLabel: 'Monthly target',
        notes: [['+8.2%', 'vs previous period'], ['Stable', 'vs previous period'], ['+6.4%', 'vs previous period'], ['+3', 'vs previous period']],
    },
    'last-month': {
        revenue: 22900,
        costs: 12980,
        profit: 9920,
        customers: 15,
        target: 28000,
        targetLabel: 'Monthly target',
        notes: [['+5.1%', 'vs month before'], ['−2.4%', 'vs month before'], ['+7.8%', 'vs month before'], ['+2', 'vs month before']],
    },
    'this-quarter': {
        revenue: 71400,
        costs: 39750,
        profit: 31650,
        customers: 49,
        target: 85000,
        targetLabel: 'Quarterly target',
        notes: [['+11.6%', 'vs previous quarter'], ['+4.3%', 'vs previous quarter'], ['+14.2%', 'vs previous quarter'], ['+8', 'vs previous quarter']],
    },
};

let currentRevenue = samplePeriods[periodSelect.value].revenue;

currentDateLabel.textContent = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
}).format(new Date());

const defaultTasks = [
    { id: 'sample-1', title: 'Review monthly cash flow', due: 'Today', completed: false },
    { id: 'sample-2', title: "Set next month's sales priorities", due: 'Oct 3', completed: false },
    { id: 'sample-3', title: 'Identify one customer follow-up', due: 'Oct 6', completed: false },
];

function readTasks() {
    try {
        const storedTasks = JSON.parse(localStorage.getItem('plussize-dashboard-tasks'));
        return Array.isArray(storedTasks) ? storedTasks : defaultTasks;
    } catch {
        return defaultTasks;
    }
}

let tasks = readTasks();

function saveTasks() {
    localStorage.setItem('plussize-dashboard-tasks', JSON.stringify(tasks));
}

function formatDueDate(value) {
    if (!value) return 'No due date';

    const [year, month, day] = value.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(dueDate);
}

function updateTaskCount() {
    const openTasks = tasks.filter(task => !task.completed).length;
    taskCount.textContent = `${openTasks} open ${openTasks === 1 ? 'task' : 'tasks'}`;
}

function renderTasks() {
    taskList.replaceChildren();

    tasks.forEach(task => {
        const item = document.createElement('li');
        item.className = `task-item${task.completed ? ' is-complete' : ''}`;
        item.dataset.taskId = task.id;

        const label = document.createElement('label');
        label.className = 'task-check';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.setAttribute('aria-label', `Mark ${task.title} as ${task.completed ? 'open' : 'complete'}`);

        const checkmark = document.createElement('span');
        checkmark.className = 'checkmark';
        checkmark.setAttribute('aria-hidden', 'true');

        const title = document.createElement('span');
        title.className = 'task-text';
        title.textContent = task.title;

        const due = document.createElement('span');
        due.className = 'task-due';
        due.textContent = task.due;

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-task';
        removeButton.type = 'button';
        removeButton.setAttribute('aria-label', `Remove ${task.title}`);
        removeButton.textContent = '×';

        label.append(checkbox, checkmark, title);
        item.append(label, due, removeButton);
        taskList.append(item);
    });

    updateTaskCount();
}

function updateGoal() {
    const target = Math.max(1, Number(targetInput.value) || 1);
    const percentage = Math.min(100, Math.round((currentRevenue / target) * 100));
    const remaining = Math.max(0, target - currentRevenue);
    const currency = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    });

    progressFill.style.width = `${percentage}%`;
    progressLabel.textContent = `${percentage}% of target`;
    remainingLabel.textContent = remaining === 0 ? 'Target reached' : `${currency.format(remaining)} to go`;
    progressBar.setAttribute('aria-valuenow', String(percentage));
    localStorage.setItem(`plussize-dashboard-target-${periodSelect.value}`, String(target));
}

function updatePeriod() {
    const sample = samplePeriods[periodSelect.value];
    const currency = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    });
    const values = [sample.revenue, sample.costs, sample.profit, sample.customers];

    currentRevenue = sample.revenue;
    metricValues.forEach((element, index) => {
        element.textContent = index === 3 ? String(values[index]) : currency.format(values[index]);
    });
    metricNotes.forEach((element, index) => {
        const [trend, description] = sample.notes[index];
        const trendElement = element.querySelector('span');
        trendElement.textContent = trend;
        trendElement.className = trend === 'Stable' ? 'trend-neutral' : 'trend-up';
        element.replaceChildren(trendElement, document.createTextNode(` ${description}`));
    });

    goalPeriodLabel.textContent = sample.targetLabel;
    const savedTarget = Number(localStorage.getItem(`plussize-dashboard-target-${periodSelect.value}`));
    targetInput.value = String(savedTarget > 0 ? savedTarget : sample.target);
    updateGoal();
}

targetInput.addEventListener('input', updateGoal);
periodSelect.addEventListener('change', updatePeriod);
updatePeriod();
renderTasks();

taskForm.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(taskForm);
    const title = String(formData.get('task') || '').trim();
    if (!title) return;

    tasks.push({
        id: `task-${Date.now()}`,
        title,
        due: formatDueDate(String(formData.get('due') || '')),
        completed: false,
    });
    saveTasks();
    renderTasks();
    taskForm.reset();
    taskDetails.open = false;
});

taskList.addEventListener('change', event => {
    if (!(event.target instanceof HTMLInputElement) || event.target.type !== 'checkbox') return;

    const item = event.target.closest('.task-item');
    const task = tasks.find(currentTask => currentTask.id === item?.dataset.taskId);
    if (!task) return;

    task.completed = event.target.checked;
    saveTasks();
    renderTasks();
});

taskList.addEventListener('click', event => {
    const button = event.target.closest('.remove-task');
    if (!button) return;

    const item = button.closest('.task-item');
    tasks = tasks.filter(task => task.id !== item?.dataset.taskId);
    saveTasks();
    renderTasks();
});

