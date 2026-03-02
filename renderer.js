// ============================================
// TodoList 渲染进程
// ============================================

class TodoApp {
    constructor() {
        this.todos = [];
        this.elements = {
            todoList: document.getElementById('todoList'),
            addInput: document.getElementById('addInput'),
            emptyState: document.getElementById('emptyState'),
            statsText: document.getElementById('statsText'),
            themeBtn: document.getElementById('themeBtn'),
            pinBtn: document.getElementById('pinBtn'),
            autoLaunchBtn: document.getElementById('autoLaunchBtn'),
            minimizeBtn: document.getElementById('minimizeBtn'),
            closeBtn: document.getElementById('closeBtn')
        };

        this.init();
    }

    async init() {
        // 加载数据
        this.todos = await window.todoAPI.loadTodos();

        // 渲染列表
        this.render();

        // 绑定事件
        this.bindEvents();

        // 初始化主题
        this.initTheme();

        // 初始化开机自启动状态
        this.initAutoLaunch();

        // 默认置顶按钮高亮
        this.elements.pinBtn.classList.add('active');
    }

    bindEvents() {
        // 回车新增
        this.elements.addInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.isComposing) {
                e.preventDefault();
                this.addTodo();
            }
        });

        // 切换主题
        this.elements.themeBtn.addEventListener('click', () => {
            this.toggleTheme();
        });

        // 窗口控制按钮
        this.elements.pinBtn.addEventListener('click', async () => {
            const isOnTop = await window.todoAPI.toggleAlwaysOnTop();
            this.elements.pinBtn.classList.toggle('active', isOnTop);
        });

        // 开机自启动
        this.elements.autoLaunchBtn.addEventListener('click', async () => {
            const isEnabled = await window.todoAPI.toggleAutoLaunch();
            this.elements.autoLaunchBtn.classList.toggle('active', isEnabled);
        });

        this.elements.minimizeBtn.addEventListener('click', () => {
            window.todoAPI.minimizeWindow();
        });

        this.elements.closeBtn.addEventListener('click', () => {
            window.todoAPI.closeWindow();
        });
    }

    // 初始化开机自启动状态
    async initAutoLaunch() {
        const isEnabled = await window.todoAPI.getAutoLaunch();
        this.elements.autoLaunchBtn.classList.toggle('active', isEnabled);
    }

    // 初始化主题
    initTheme() {
        const savedTheme = localStorage.getItem('todo-theme') || 'dark';
        this.applyTheme(savedTheme);
    }

    // 切换主题
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        localStorage.setItem('todo-theme', newTheme);
    }

    // 应用主题
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        window.todoAPI.setTheme(theme);

        const isDark = theme === 'dark';
        const sunIcon = this.elements.themeBtn.querySelector('.sun-icon');
        const moonIcon = this.elements.themeBtn.querySelector('.moon-icon');

        if (sunIcon && moonIcon) {
            // 图标表示“点击后切换到的状态”。所以在暗黑模式展示太阳(点击切日间)；明亮模式展示月亮(点击切夜间)
            sunIcon.style.display = isDark ? 'block' : 'none';
            moonIcon.style.display = isDark ? 'none' : 'block';
        }
    }

    // 新增 todo
    addTodo() {
        const text = this.elements.addInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now().toString(),
            text,
            completed: false,
            createdAt: Date.now()
        };

        this.todos.unshift(todo);
        this.elements.addInput.value = '';
        this.save();
        this.render('add', todo.id);
    }

    // 切换完成状态
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        todo.completed = !todo.completed;

        // 排序：未完成在上，已完成在下（各自按创建时间）
        this.sortTodos();
        this.save();
        this.render('complete', id);
    }

    // 删除 todo
    deleteTodo(id) {
        const el = document.querySelector(`[data-id="${id}"]`);
        if (el) {
            el.classList.add('removing');
            // 避免 animationend 在某些情况下不触发，使用 setTimeout 作为降级方案
            setTimeout(() => {
                this.todos = this.todos.filter(t => t.id !== id);
                this.save();
                this.render();
            }, 260);
        } else {
            this.todos = this.todos.filter(t => t.id !== id);
            this.save();
            this.render();
        }
    }

    // 排序：未完成在上，已完成在下
    sortTodos() {
        const active = this.todos.filter(t => !t.completed);
        const completed = this.todos.filter(t => t.completed);
        this.todos = [...active, ...completed];
    }

    // 保存到本地
    async save() {
        await window.todoAPI.saveTodos(this.todos);
    }

    // 更新统计
    updateStats() {
        const active = this.todos.filter(t => !t.completed).length;
        const total = this.todos.length;

        if (total === 0) {
            this.elements.statsText.textContent = '0 个待办';
        } else if (active === 0) {
            this.elements.statsText.textContent = `全部完成 🎉 共 ${total} 项`;
        } else {
            this.elements.statsText.textContent = `${active} 个待办 · ${total - active} 个已完成`;
        }
    }

    // 渲染列表
    render(action, targetId) {
        this.elements.todoList.innerHTML = '';

        const isEmpty = this.todos.length === 0;
        this.elements.emptyState.classList.toggle('visible', isEmpty);

        this.todos.forEach(todo => {
            const li = this.createTodoElement(todo);

            // 新增动画
            if (action === 'add' && todo.id === targetId) {
                li.classList.add('adding');
            }

            // 完成动画
            if (action === 'complete' && todo.id === targetId) {
                li.classList.add('completing');
            }

            this.elements.todoList.appendChild(li);
        });

        this.updateStats();
    }

    // 创建 todo 元素
    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item${todo.completed ? ' completed' : ''}`;
        li.setAttribute('data-id', todo.id);

        li.innerHTML = `
      <div class="todo-check" role="button" aria-label="标记完成">
        <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <span class="todo-text">${this.escapeHtml(todo.text)}</span>
      <button class="todo-delete" aria-label="删除">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="7" y1="7" x2="17" y2="17"/>
          <line x1="7" y1="17" x2="17" y2="7"/>
        </svg>
      </button>
    `;

        // 事件绑定
        li.querySelector('.todo-check').addEventListener('click', () => {
            this.toggleTodo(todo.id);
        });

        li.querySelector('.todo-delete').addEventListener('click', () => {
            this.deleteTodo(todo.id);
        });

        // 双击编辑
        li.querySelector('.todo-text').addEventListener('dblclick', (e) => {
            if (todo.completed) return; // 已完成的不允许编辑
            this.startEdit(li, todo);
        });

        return li;
    }

    // 进入编辑模式
    startEdit(li, todo) {
        if (li.classList.contains('editing')) return;
        li.classList.add('editing');

        const textSpan = li.querySelector('.todo-text');
        const originalText = todo.text;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'todo-edit-input';
        input.value = originalText;
        input.maxLength = 100;

        textSpan.replaceWith(input);
        input.focus();
        input.select();

        const finishEdit = (save) => {
            if (!li.classList.contains('editing')) return;
            li.classList.remove('editing');

            const newText = input.value.trim();
            if (save && newText && newText !== originalText) {
                todo.text = newText;
                this.save();
            }

            const newSpan = document.createElement('span');
            newSpan.className = 'todo-text';
            newSpan.textContent = save && newText ? newText : originalText;
            input.replaceWith(newSpan);

            // 重新绑定双击
            newSpan.addEventListener('dblclick', () => {
                if (todo.completed) return;
                this.startEdit(li, todo);
            });
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.isComposing) {
                e.preventDefault();
                finishEdit(true);
            } else if (e.key === 'Escape') {
                finishEdit(false);
            }
        });

        input.addEventListener('blur', () => {
            finishEdit(true);
        });
    }

    // HTML 转义（防止 XSS）
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
