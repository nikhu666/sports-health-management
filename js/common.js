// common.js - 全局功能模块

// 页面跳转功能
function initNav() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            window.location.href = `${page}.html`;
        });
    });
}

// 高亮当前页面的导航按钮
function highlightNav() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    const navBtn = document.querySelector(`.nav-btn[data-page="${currentPage}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }
}

// localStorage 存储封装
const Storage = {
    // 保存数据
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('存储数据失败:', error);
            return false;
        }
    },

    // 获取数据
    get(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('读取数据失败:', error);
            return null;
        }
    },

    // 删除数据
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    },

    // 清空所有数据
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }
};

// 联网适配功能
const Network = {
    // 检查网络状态
    checkStatus() {
        return navigator.onLine;
    },

    // 检查是否为WiFi连接
    isWifi() {
        if (!navigator.connection) return true; // 不支持connection API时默认认为是WiFi
        const connection = navigator.connection;
        return connection.type === 'wifi' || connection.effectiveType?.includes('wifi');
    },

    // 请求用户确认是否使用流量
    confirmMobileData() {
        return new Promise((resolve) => {
            if (this.isWifi()) {
                resolve(true);
            } else {
                const confirmed = confirm('当前处于移动数据网络，是否继续使用？');
                resolve(confirmed);
            }
        });
    }
};

// 日历组件
class Calendar {
    constructor(container, options = {}) {
        this.container = container;
        this.currentDate = options.currentDate || new Date();
        this.onSelect = options.onSelect || function() {};
        this.render();
        this.bindEvents();
    }

    // 渲染日历
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // 清空容器
        this.container.innerHTML = '';

        // 创建日历头部
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `
            <button id="prev-month" class="btn btn-small">‹</button>
            <span>${year}年${month + 1}月</span>
            <button id="next-month" class="btn btn-small">›</button>
        `;
        this.container.appendChild(header);

        // 创建星期标题
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekHeader = document.createElement('div');
        weekHeader.className = 'calendar-grid';
        weekdays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            weekHeader.appendChild(dayElement);
        });
        this.container.appendChild(weekHeader);

        // 创建日期网格
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDay.getDay();
        const totalDays = lastDay.getDate();

        // 创建空白单元格填充当月第一天之前的位置
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            grid.appendChild(emptyDay);
        }

        // 创建当月日期单元格
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(year, month, i);
            
            const dayElement = document.createElement('button');
            dayElement.className = 'calendar-day calendar-date-item';
            dayElement.textContent = i;
            
            // 设置data-date为本地日期字符串，避免时区问题
            const yearStr = date.getFullYear().toString();
            const monthStr = String(date.getMonth() + 1).padStart(2, '0');
            const dayStr = String(date.getDate()).padStart(2, '0');
            const localDateStr = `${yearStr}-${monthStr}-${dayStr}`;
            dayElement.dataset.date = localDateStr;

            // 判断是否为当天
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            if (localDateStr === todayStr) {
                dayElement.classList.add('today');
            }

            // 添加点击事件
            dayElement.addEventListener('click', () => {
                this.selectDate(date);
            });

            grid.appendChild(dayElement);
        }

        this.container.appendChild(grid);
    }

    // 选择日期
    selectDate(date) {
        // 移除之前的选中状态
        document.querySelectorAll('.calendar-day.active').forEach(day => {
            day.classList.remove('active');
        });
        
        // 添加当前选中状态
        const yearStr = date.getFullYear().toString();
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        const localDateStr = `${yearStr}-${monthStr}-${dayStr}`;
        
        const selectedDay = document.querySelector(`[data-date="${localDateStr}"]`);
        if (selectedDay) {
            selectedDay.classList.add('active');
        }
        
        // 更新弹窗标题显示选中日期
        const modalDateDisplay = document.querySelector('.modal-title-date');
        if (modalDateDisplay) {
            modalDateDisplay.textContent = localDateStr;
        }
        
        // 调用回调函数
        this.onSelect(date);
    }

    // 绑定事件
    bindEvents() {
        // 月份切换按钮
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
            // 延迟执行确保日历DOM已重新渲染
            setTimeout(() => {
                if (typeof highlightSurplusDates === 'function') {
                    highlightSurplusDates();
                }
            }, 100);
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
            // 延迟执行确保日历DOM已重新渲染
            setTimeout(() => {
                if (typeof highlightSurplusDates === 'function') {
                    highlightSurplusDates();
                }
            }, 100);
        });
    }

    // 设置当前日期
    setDate(date) {
        this.currentDate = date;
        this.render();
        this.selectDate(date);
    }

    // 获取当前选中的日期
    getSelectedDate() {
        const activeDay = document.querySelector('.calendar-day.active');
        if (activeDay) {
            // 直接使用data-date属性创建日期对象，确保没有时区偏移
            const dateStr = activeDay.dataset.date;
            const [year, month, day] = dateStr.split('-').map(Number);
            // 创建本地时间的日期对象（月份需要减1）
            return new Date(year, month - 1, day);
        }
        return null;
    }
}

// 弹窗组件
class Modal {
    constructor(container) {
        this.container = container;
        this.isOpen = false;
    }

    // 显示弹窗
    open() {
        this.container.style.display = 'flex';
        this.isOpen = true;
    }

    // 隐藏弹窗
    close() {
        this.container.style.display = 'none';
        this.isOpen = false;
    }

    // 切换弹窗状态
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    // 初始化
    init() {
        const closeBtn = this.container.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // 点击弹窗外部关闭
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close();
            }
        });
    }
}

// 工具函数
const Utils = {
    // 格式化日期
    formatDate(date, format = 'YYYY-MM-DD') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    },

    // 获取今天的日期字符串
    getTodayString() {
        return this.formatDate(new Date());
    },

    // 计算两个日期之间的天数差
    daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const diffTime = Math.abs(date2 - date1);
        return Math.ceil(diffTime / oneDay);
    },

    // 数字保留一位小数
    toFixedOne(num) {
        return parseFloat(num.toFixed(1));
    },

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// 初始化全局功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化导航
    initNav();
    highlightNav();

    // 阻止页面滚动穿透（当弹窗打开时）
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });
});

// 导出模块（如果在模块化环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNav,
        highlightNav,
        Storage,
        Network,
        Calendar,
        Modal,
        Utils
    };
}