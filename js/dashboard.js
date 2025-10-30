// ===== 数据面板功能 =====

// ===== 日历功能 =====
class Calendar {
    constructor(containerEl) {
        this.container = containerEl;
        this.currentDate = new Date();
        this.viewMode = 'month';
        this.events = storage.get('calendar_events') || {};
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 更新月份显示
        document.getElementById('currentMonth').textContent = 
            `${year}年${month + 1}月`;
        
        // 清空日历
        this.container.innerHTML = '';
        
        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        
        const firstDayWeek = firstDay.getDay();
        const lastDate = lastDay.getDate();
        const prevLastDate = prevLastDay.getDate();
        
        // 上个月的日期
        for (let i = firstDayWeek - 1; i >= 0; i--) {
            const day = prevLastDate - i;
            this.createDayCell(day, 'other-month');
        }
        
        // 当月日期
        const today = new Date();
        for (let day = 1; day <= lastDate; day++) {
            const isToday = 
                day === today.getDate() && 
                month === today.getMonth() && 
                year === today.getFullYear();
            
            const dateKey = `${year}-${month + 1}-${day}`;
            const hasTasks = this.events[dateKey] && this.events[dateKey].length > 0;
            
            const classes = isToday ? 'today' : '';
            this.createDayCell(day, classes, hasTasks);
        }
        
        // 下个月的日期
        const remainingCells = 42 - this.container.children.length;
        for (let day = 1; day <= remainingCells; day++) {
            this.createDayCell(day, 'other-month');
        }
    }

    createDayCell(day, className = '', hasTasks = false) {
        const cell = document.createElement('div');
        cell.className = `calendar-day ${className}`;
        if (hasTasks) cell.classList.add('has-tasks');
        cell.textContent = day;
        
        cell.addEventListener('click', () => {
            console.log(`选中日期: ${day}`);
            // 这里可以添加显示当天任务的功能
        });
        
        this.container.appendChild(cell);
    }

    attachEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });
        
        // 视图模式切换
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.view-mode-btn').forEach(b => 
                    b.classList.remove('active'));
                this.classList.add('active');
                // 可以在这里实现不同视图的切换
            });
        });
    }
}

// ===== TODO列表功能 =====
class TodoList {
    constructor() {
        this.todos = storage.get('todos') || this.getDefaultTodos();
        this.currentFilter = 'all';
        this.selectedPriority = 'medium';
        this.init();
    }

    getDefaultTodos() {
        return [
            { id: generateId(), text: '完成个人网站首页设计', priority: 'high', completed: false, date: '今天 14:00' },
            { id: generateId(), text: '学习TypeScript高级特性', priority: 'medium', completed: false, date: '明天 10:00' },
            { id: generateId(), text: '阅读React文档', priority: 'low', completed: true, date: '昨天 16:00' }
        ];
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.updateStats();
    }

    render() {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = '';
        
        const filteredTodos = this.getFilteredTodos();
        
        filteredTodos.forEach(todo => {
            const todoEl = this.createTodoElement(todo);
            todoList.appendChild(todoEl);
        });
        
        this.attachTodoEventListeners();
    }

    createTodoElement(todo) {
        const div = document.createElement('div');
        div.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        div.dataset.priority = todo.priority;
        div.dataset.id = todo.id;
        div.draggable = true;
        
        div.innerHTML = `
            <div class="todo-checkbox">
                <input type="checkbox" id="todo-${todo.id}" ${todo.completed ? 'checked' : ''}>
                <label for="todo-${todo.id}"></label>
            </div>
            <div class="todo-content">
                <span class="todo-text">${todo.text}</span>
                <span class="todo-date">
                    <i class="far fa-clock"></i>
                    ${todo.date}
                </span>
            </div>
            <div class="todo-actions">
                <button class="todo-action-btn edit-btn" aria-label="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="todo-action-btn delete-btn" aria-label="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return div;
    }

    attachEventListeners() {
        const addBtn = document.getElementById('addTodoBtn');
        const input = document.getElementById('todoInput');
        
        // 添加任务
        addBtn.addEventListener('click', () => this.addTodo());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        // 优先级选择
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.priority-btn').forEach(b => 
                    b.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // 筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => 
                    b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });
    }

    attachTodoEventListeners() {
        // 复选框
        document.querySelectorAll('.todo-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const todoId = e.target.closest('.todo-item').dataset.id;
                this.toggleTodo(todoId);
            });
        });
        
        // 删除按钮
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const todoId = e.target.closest('.todo-item').dataset.id;
                this.deleteTodo(todoId);
            });
        });
        
        // 拖拽事件
        document.querySelectorAll('.todo-item').forEach(item => {
            item.addEventListener('dragstart', this.handleDragStart);
            item.addEventListener('dragover', this.handleDragOver);
            item.addEventListener('drop', this.handleDrop.bind(this));
            item.addEventListener('dragend', this.handleDragEnd);
        });
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        const activeBtn = document.querySelector('.priority-btn.active');
        const priority = activeBtn ? activeBtn.dataset.priority : 'medium';
        
        const newTodo = {
            id: generateId(),
            text: text,
            priority: priority,
            completed: false,
            date: '今天 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };
        
        this.todos.unshift(newTodo);
        this.saveTodos();
        this.render();
        this.updateStats();
        
        input.value = '';
        
        // 动画效果
        const firstItem = document.querySelector('.todo-item');
        if (firstItem) {
            firstItem.style.animation = 'slideInLeft 0.3s ease-out';
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    deleteTodo(id) {
        const item = document.querySelector(`.todo-item[data-id="${id}"]`);
        
        // 删除动画
        item.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.render();
            this.updateStats();
        }, 300);
    }

    getFilteredTodos() {
        if (this.currentFilter === 'all') return this.todos;
        if (this.currentFilter === 'active') return this.todos.filter(t => !t.completed);
        if (this.currentFilter === 'completed') return this.todos.filter(t => t.completed);
        return this.todos;
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        
        document.getElementById('totalCount').textContent = total;
        document.getElementById('completedCount').textContent = completed;
    }

    saveTodos() {
        storage.set('todos', this.todos);
    }

    // 拖拽处理
    handleDragStart(e) {
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.classList.add('drag-over');
        return false;
    }

    handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        
        const dragging = document.querySelector('.dragging');
        const dragOver = e.currentTarget;
        
        if (dragging !== dragOver) {
            const allItems = [...document.querySelectorAll('.todo-item')];
            const dragIndex = allItems.indexOf(dragging);
            const dropIndex = allItems.indexOf(dragOver);
            
            // 重新排序todos数组
            const [removed] = this.todos.splice(dragIndex, 1);
            this.todos.splice(dropIndex, 0, removed);
            
            this.saveTodos();
            this.render();
        }
        
        return false;
    }

    handleDragEnd() {
        document.querySelectorAll('.todo-item').forEach(item => {
            item.classList.remove('dragging', 'drag-over');
        });
    }
}

// ===== 图表功能 =====
function initCharts() {
    // 任务完成趋势图
    const trendCtx = document.getElementById('taskTrendChart');
    if (trendCtx && typeof Chart !== 'undefined') {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                datasets: [{
                    label: '已完成任务',
                    data: [5, 8, 6, 9, 7, 10, 8],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 2
                        }
                    }
                }
            }
        });
    }

    // 学习时间分布饼图
    const pieCtx = document.getElementById('studyTimeChart');
    if (pieCtx && typeof Chart !== 'undefined') {
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['前端开发', '后端开发', 'UI设计', '算法学习', '其他'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#4facfe',
                        '#43e97b'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    // 初始化日历
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
        new Calendar(calendarGrid);
    }

    // 初始化TODO列表
    new TodoList();

    // 初始化图表
    initCharts();

    // 刷新按钮
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.querySelector('i').style.animation = 'spin 0.5s linear';
            setTimeout(() => {
                this.querySelector('i').style.animation = '';
            }, 500);
        });
    }

    console.log('数据面板加载完成');
});

// 添加fadeOut动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: translateX(-20px);
        }
    }
`;
document.head.appendChild(style);
