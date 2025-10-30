// ===== 数据面板功能 =====

// ===== 日历TODO融合功能 =====
class CalendarTodo {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null; // 当前选中的日期
        this.todos = storage.get('todos') || [];
        this.currentFilter = 'all';
        this.canEdit = false;
        
        // 迁移旧数据：为没有 dateStr 的任务添加默认日期
        this.migrateTodos();
        
        this.init();
    }

    // 获取日期字符串
    getDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 迁移旧数据
    migrateTodos() {
        let needsSave = false;
        const today = new Date();
        const todayStr = this.getDateString(today);
        
        this.todos = this.todos.map(todo => {
            if (!todo.dateStr) {
                needsSave = true;
                return {
                    ...todo,
                    dateStr: todayStr,
                    displayDate: '今天',
                    createdAt: todo.createdAt || new Date().toISOString()
                };
            }
            return todo;
        });
        
        if (needsSave) {
            storage.set('todos', this.todos);
        }
    }

    async init() {
        this.checkAuth(); // 去掉 await，同步检查
        this.renderCalendar();
        this.renderTodos();
        this.attachEventListeners();
        this.updateStats();
    }

    checkAuth() {
        this.canEdit = auth.isAuthenticated();
        if (!this.canEdit) {
            const addForm = document.querySelector('.add-todo-form');
            if (addForm) addForm.style.display = 'none';
        }
    }

    async requireAuth() {
        if (!this.canEdit) {
            const success = await auth.showLoginDialog('此操作需要管理员权限');
            if (success) {
                this.canEdit = true;
                const addForm = document.querySelector('.add-todo-form');
                if (addForm) addForm.style.display = 'flex';
                this.renderTodos();
            }
            return success;
        }
        return true;
    }

    // 渲染日历
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        document.getElementById('currentMonth').textContent = `${year}年${month + 1}月`;
        
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) {
            console.error('calendarGrid 元素未找到');
            return;
        }
        calendarGrid.innerHTML = '';
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        
        const firstDayWeek = firstDay.getDay();
        const lastDate = lastDay.getDate();
        const prevLastDate = prevLastDay.getDate();
        const today = new Date();
        
        // 上个月的日期
        for (let i = firstDayWeek - 1; i >= 0; i--) {
            const day = prevLastDate - i;
            const cell = this.createDayCell(day, year, month - 1, 'other-month');
            calendarGrid.appendChild(cell);
        }
        
        // 当月日期
        for (let day = 1; day <= lastDate; day++) {
            const isToday = day === today.getDate() && 
                           month === today.getMonth() && 
                           year === today.getFullYear();
            
            const isSelected = this.selectedDate && 
                              day === this.selectedDate.getDate() &&
                              month === this.selectedDate.getMonth() &&
                              year === this.selectedDate.getFullYear();
            
            const cell = this.createDayCell(day, year, month, isToday ? 'today' : (isSelected ? 'selected' : ''));
            calendarGrid.appendChild(cell);
        }
        
        // 下个月的日期
        const remainingCells = 42 - calendarGrid.children.length;
        for (let day = 1; day <= remainingCells; day++) {
            const cell = this.createDayCell(day, year, month + 1, 'other-month');
            calendarGrid.appendChild(cell);
        }
    }

    createDayCell(day, year, month, className = '') {
        const cell = document.createElement('div');
        cell.className = `calendar-day ${className}`;
        cell.textContent = day;
        
        // 检查该日期是否有任务
        const dateStr = this.getDateString(new Date(year, month, day));
        const hasTasks = this.todos.some(todo => todo.dateStr === dateStr);
        if (hasTasks) cell.classList.add('has-tasks');
        
        // 非其他月的日期可点击
        if (!className.includes('other-month')) {
            cell.addEventListener('click', () => {
                this.selectedDate = new Date(year, month, day);
                this.currentFilter = 'date';
                this.renderCalendar();
                this.renderTodos();
                this.updateTitle();
            });
        }
        
        return cell; // 返回 cell 而不是直接 appendChild
    }

    // 更新标题
    updateTitle() {
        const titleEl = document.getElementById('selectedDateTitle');
        if (this.currentFilter === 'date' && this.selectedDate) {
            const month = this.selectedDate.getMonth() + 1;
            const day = this.selectedDate.getDate();
            titleEl.textContent = `${month}月${day}日的任务`;
        } else if (this.currentFilter === 'today') {
            titleEl.textContent = '今天的任务';
        } else {
            titleEl.textContent = '全部任务';
        }
    }

    // 渲染TODO列表
    renderTodos() {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = '';
        
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            todoList.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary);">暂无任务</div>';
            return;
        }
        
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
        
        if (this.canEdit) {
            div.draggable = true;
        }
        
        const actionsHtml = this.canEdit ? `
            <div class="todo-actions">
                <button class="todo-action-btn edit-btn" aria-label="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="todo-action-btn delete-btn" aria-label="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        ` : '';
        
        div.innerHTML = `
            <div class="todo-checkbox">
                <input type="checkbox" id="todo-${todo.id}" ${todo.completed ? 'checked' : ''} ${this.canEdit ? '' : 'disabled'}>
                <label for="todo-${todo.id}"></label>
            </div>
            <div class="todo-content">
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <span class="todo-date">
                    <i class="far fa-clock"></i>
                    ${todo.displayDate || todo.dateStr || '今天'}
                </span>
            </div>
            ${actionsHtml}
        `;
        
        return div;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 事件监听
    attachEventListeners() {
        // 日历导航
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });
        
        // 添加任务
        const addBtn = document.getElementById('addTodoBtn');
        const input = document.getElementById('todoInput');
        
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
                if (this.currentFilter !== 'date') {
                    this.selectedDate = null;
                }
                this.renderCalendar();
                this.renderTodos();
                this.updateTitle();
            });
        });
    }

    // 添加任务
    async addTodo() {
        if (!await this.requireAuth()) return;

        const input = document.getElementById('todoInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        const activeBtn = document.querySelector('.priority-btn.active');
        const priority = activeBtn ? activeBtn.dataset.priority : 'medium';
        
        // 使用选中的日期或今天
        const taskDate = this.selectedDate || new Date();
        const dateStr = this.getDateString(taskDate);
        
        const newTodo = {
            id: generateId(),
            text: text,
            priority: priority,
            completed: false,
            dateStr: dateStr,
            displayDate: this.formatDisplayDate(taskDate),
            createdAt: new Date().toISOString()
        };
        
        this.todos.unshift(newTodo);
        this.saveTodos();
        this.renderCalendar();
        this.renderTodos();
        this.updateStats();
        
        input.value = '';
        
        const firstItem = document.querySelector('.todo-item');
        if (firstItem) {
            firstItem.style.animation = 'slideInLeft 0.3s ease-out';
        }
    }

    // 格式化显示日期
    formatDisplayDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateStr = this.getDateString(date);
        const todayStr = this.getDateString(today);
        const yesterdayStr = this.getDateString(yesterday);
        const tomorrowStr = this.getDateString(tomorrow);
        
        if (dateStr === todayStr) return '今天';
        if (dateStr === yesterdayStr) return '昨天';
        if (dateStr === tomorrowStr) return '明天';
        
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
    }

    // 切换任务完成状态
    async toggleTodo(id) {
        if (!await this.requireAuth()) {
            const checkbox = document.querySelector(`.todo-item[data-id="${id}"] input[type="checkbox"]`);
            if (checkbox) {
                const todo = this.todos.find(t => t.id === id);
                if (todo) checkbox.checked = todo.completed;
            }
            return;
        }

        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
        }
    }

    // 删除任务
    async deleteTodo(id) {
        if (!await this.requireAuth()) return;

        const item = document.querySelector(`.todo-item[data-id="${id}"]`);
        item.style.animation = 'fadeOut 0.3s ease-out';
        
        setTimeout(() => {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.renderCalendar();
            this.renderTodos();
            this.updateStats();
        }, 300);
    }

    // 过滤任务
    getFilteredTodos() {
        let filtered = this.todos;
        
        if (this.currentFilter === 'date' && this.selectedDate) {
            const dateStr = this.getDateString(this.selectedDate);
            filtered = filtered.filter(t => t.dateStr === dateStr);
        } else if (this.currentFilter === 'today') {
            const todayStr = this.getDateString(new Date());
            filtered = filtered.filter(t => t.dateStr === todayStr);
        } else if (this.currentFilter === 'active') {
            filtered = filtered.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }
        
        return filtered;
    }

    // 更新统计
    updateStats() {
        const filtered = this.getFilteredTodos();
        const total = filtered.length;
        const completed = filtered.filter(t => t.completed).length;
        
        document.getElementById('totalCount').textContent = total;
        document.getElementById('completedCount').textContent = completed;
    }

    // 保存到本地存储
    saveTodos() {
        storage.set('todos', this.todos);
    }

    // TODO项事件监听
    attachTodoEventListeners() {
        document.querySelectorAll('.todo-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const todoId = e.target.closest('.todo-item').dataset.id;
                this.toggleTodo(todoId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const todoId = e.target.closest('.todo-item').dataset.id;
                this.deleteTodo(todoId);
            });
        });
        
        if (this.canEdit) {
            document.querySelectorAll('.todo-item').forEach(item => {
                item.addEventListener('dragstart', this.handleDragStart);
                item.addEventListener('dragover', this.handleDragOver);
                item.addEventListener('drop', this.handleDrop.bind(this));
                item.addEventListener('dragend', this.handleDragEnd);
            });
        }
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
            this.renderTodos();
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
                    borderColor: '#1a1a1a',
                    backgroundColor: 'rgba(26, 26, 26, 0.05)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
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
                        },
                        grid: {
                            color: '#f0f0f0'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    try {
        // 初始化日历TODO融合系统
        const calendarTodo = new CalendarTodo();
        
        // 初始化图表
        initCharts();
        
        console.log('数据面板加载完成');
    } catch (error) {
        console.error('数据面板初始化错误:', error);
        alert('数据面板加载失败，请查看控制台: ' + error.message);
    }
});

// 添加fadeOut动画样式
(function() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        @keyframes fadeOut {
            to {
                opacity: 0;
                transform: translateX(-20px);
            }
        }
        
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(styleEl);
})();
