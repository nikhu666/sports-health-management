// 健身健康管理系统 - 核心应用逻辑
// 引入其他模块

// 食物数据库 (将在HTML中通过script标签引入)
// <script src="js/food-db.js"></script>

// 健康计算模块
const HealthCalculator = {
    // 计算基础代谢率（BMR）- 哈里斯-本尼迪克特精准版
    calculateBMR(gender, weight, height, age) {
        if (gender === 'male') {
            // 男性：BMR = 88.362 + (13.397 × 体重kg) + (4.799 × 身高cm) - (5.677 × 年龄)
            return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            // 女性：BMR = 447.593 + (9.247 × 体重kg) + (3.098 × 身高cm) - (4.330 × 年龄)
            return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
    },

    // 计算每日总热量消耗（TDEE）
    calculateTDEE(bmr, dailyExerciseCal = 0) {
        // 新公式：每日总消耗 = BMR × 1.3 + 当日运动消耗
        return bmr * 1.3 + dailyExerciseCal;
    },

    // 计算运动热量消耗
    calculateExerciseCalories(exerciseType, duration, weight, metValue = null) {
        // MET值表
        const metValues = {
            // 有氧运动
            'running': 8.0,
            'jumping_rope': 10.0,
            'climbing_stairs': 7.5,
            'walking': 3.5,
            'swimming': 7.0,
            'cycling': 6.8,
            'aerobic_dance': 6.0,
            'elliptical': 5.5,
            // 无氧运动
            'chest': 6.0,
            'back': 5.5,
            'legs': 7.0,
            'arms': 4.5,
            'shoulders': 5.0,
            'abs': 4.0
        };

        const met = metValue || metValues[exerciseType] || 3.0;
        const hours = duration / 60;
        // 热量消耗（大卡）= MET值 × 体重kg × 运动时长（小时）
        return met * weight * hours;
    },

    // 计算热量缺口
    calculateCalorieDeficit(tdee, foodCalories) {
        // 热量缺口 = 每日总消耗（TDEE已包含日常活动+运动消耗） - 饮食摄入热量
        return parseFloat((tdee - foodCalories).toFixed(1));
    }
};

// 修复BMR自动计算函数
function calculateBMR() {
  // 1. 获取输入值
  const gender = document.getElementById('gender').value;
  const age = parseFloat(document.getElementById('age').value) || 0;
  const weight = parseFloat(document.getElementById('weight').value) || 0;
  const height = parseFloat(document.getElementById('height').value) || 0;
  
  // 2. 使用原有BMR公式计算
  const bmr = HealthCalculator.calculateBMR(gender, weight, height, age);
  const bmrFixed = bmr.toFixed(1);
  
  // 3. 更新页面显示
  const bmrElement = document.getElementById('bmr');
  if (bmrElement) {
    bmrElement.textContent = bmrFixed;
  }
  
  // 4. 持久化存储
  localStorage.setItem('userBMR', bmrFixed);
  
  // 5. 计算BMR后自动触发TDEE计算
  calculateTDEE();
}

// 修复TDEE自动计算函数
function calculateTDEE() {
  // 1. 获取BMR（基础代谢率）
  const bmr = parseFloat(localStorage.getItem('userBMR')) || 0;
  
  // 2. 获取当日运动消耗（从localStorage读取）
  const dailyExerciseCal = parseFloat(localStorage.getItem('todayExerciseCalorie')) || 0;
  
  // 3. 使用新公式计算TDEE：每日总消耗 = BMR × 1.3 + 当日运动消耗
  const newTDEE = (bmr * 1.3 + dailyExerciseCal).toFixed(1);
  
  // 4. 更新页面显示
  const tdeeElement = document.getElementById('tdee');
  if (tdeeElement) {
    tdeeElement.textContent = newTDEE;
  }
  
  // 5. 持久化存储
  localStorage.setItem('userTDEE', newTDEE);
  
  // 6. 同步更新饮食页
  if (typeof calculateCalorieBalance === 'function') {
    calculateCalorieBalance();
  }
}

// 实时计算热量盈余/缺口
function calculateCalorieBalance() {
  // 1. 获取基础数据（确保从localStorage实时读取）
  const TDEE = parseFloat(localStorage.getItem('userTDEE')) || 0; // TDEE已包含日常活动+运动消耗
  const dietIntake = parseFloat(localStorage.getItem('todayDietIntake')) || 0;
  
  // 2. 精准计算盈余（公式：盈余=饮食摄入 - 每日总消耗）
  const surplus = (dietIntake - TDEE).toFixed(1);
  
  // 3. 处理数字显示（移除负号）
  let displayNum = surplus;
  if (parseFloat(surplus) < 0) {
    displayNum = Math.abs(parseFloat(surplus)).toFixed(1); // 取绝对值，保留1位小数
  }
  
  // 4. 更新圆环数字
  document.getElementById('calorieDeficit').textContent = displayNum;
  
  // 5. 自动切换文字
  const circleText = document.querySelector('.circle-card.large .label');
  if (parseFloat(surplus) > 0) {
    circleText.textContent = '热量盈余';
  } else if (parseFloat(surplus) < 0) {
    circleText.textContent = '热量缺口';
  } else {
    circleText.textContent = '热量平衡';
  }
}

// 绑定所有触发场景，无需保存立即计算
document.addEventListener('DOMContentLoaded', function() {
  // 1. 页面加载时立即计算
  calculateCalorieBalance();
  
  // 2. 运动消耗同步时触发（监听 storage 变化）
  window.addEventListener('storage', function(e) {
    if (e.key === 'todayExerciseCalorie' || e.key === 'userTDEE') {
      calculateCalorieBalance();
    }
  });
  
  // 3. 添加/删除食物时触发
  // 注意：这里需要在添加/删除食物的具体函数中调用calculateCalorieBalance
});

// 封装获取指定日期盈余状态的函数
function checkDateSurplus(targetDate) {
    // 从localStorage读取该日期数据（使用当前存储格式）
    const dietKey = `diet_${targetDate}`; // 饮食摄入key
    const exerciseKey = `exercise_${targetDate}`; // 运动消耗key
    const TDEE = Number(localStorage.getItem('userTDEE')) || 0;

    // 读取饮食记录并计算总摄入热量
    const dietRecord = JSON.parse(localStorage.getItem(dietKey) || '{}');
    const intake = dietRecord.foods ? dietRecord.foods.reduce((total, food) => total + food.calories, 0) : 0;

    // 读取运动记录并计算总消耗热量
    const exerciseRecord = JSON.parse(localStorage.getItem(exerciseKey) || '{}');
    const consume = exerciseRecord.exercises ? exerciseRecord.exercises.reduce((total, exercise) => total + exercise.calories, 0) : 0;

    // 计算盈余：盈余>0则返回true，否则false
    // TDEE已包含运动消耗，无需重复叠加
    const surplus = intake - TDEE;
    return surplus > 0;
}

// 封装日历高亮函数
function highlightSurplusDates() {
    // 清空所有日期原有边框样式
    document.querySelectorAll('.calendar-date-item').forEach(item => {
        item.style.border = '1px solid #ccc'; // 恢复默认边框
        item.style.borderRadius = '4px';
        item.style.padding = '3px';
        item.style.backgroundColor = ''; // 清空背景色
    });

    // 遍历所有日期按钮，盈余则加红色边框和浅红底色
    document.querySelectorAll('.calendar-date-item').forEach(item => {
        const date = item.getAttribute('data-date');
        if (date && checkDateSurplus(date)) {
            item.style.border = '2px solid #ff0000'; // 红色高亮边框
            item.style.backgroundColor = 'rgba(255,0,0,0.1)'; // 浅红底色增强凸显
        }
    });
}

// 食物数据库模块 - 强制激活搜索功能
const FoodDatabase = {
    // 从food-db.js获取食物数据
    getFoods() {
        return window.FOOD_DB || [];
    },

    // 搜索食物 - 与diet.html中的直接搜索保持一致
    searchFood(keyword) {
        const results = [];
        const lowerKeyword = keyword.toLowerCase();
        const foods = this.getFoods();
        
        foods.forEach(food => {
            const lowerFoodName = food.name.toLowerCase();
            // 增强沙县小吃搜索匹配：支持模糊匹配（如输入"鸡腿饭"匹配"沙县鸡腿饭"）
            if (lowerFoodName.includes(lowerKeyword) || 
                (food.category === "沙县小吃" && lowerFoodName.includes(lowerKeyword))) {
                results.push({
                    id: `${food.category.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: food.name,
                    calories: food.calorie,
                    category: food.category
                });
            }
        });
        
        return results;
    },

    // 获取特定食物
    getFoodById(id) {
        return null;
    }
};

// 数据管理模块
const DataManager = {
    // 用户信息
    getUserInfo() {
        return Storage.get('user_info') || null;
    },

    saveUserInfo(info) {
        return Storage.set('user_info', info);
    },

    // 饮食记录
    getDietRecord(date) {
        const dateStr = Utils.formatDate(date);
        return Storage.get(`diet_${dateStr}`) || {
            date: dateStr,
            foods: []
        };
    },

    saveDietRecord(date, record) {
        const dateStr = Utils.formatDate(date);
        return Storage.set(`diet_${dateStr}`, record);
    },

    addFoodToRecord(date, food) {
        const record = this.getDietRecord(date);
        record.foods.push(food);
        return this.saveDietRecord(date, record);
    },

    removeFoodFromRecord(date, foodId) {
        const record = this.getDietRecord(date);
        record.foods = record.foods.filter(food => food.id !== foodId);
        return this.saveDietRecord(date, record);
    },

    // 运动记录
    getExerciseRecord(date) {
        const dateStr = Utils.formatDate(date);
        return Storage.get(`exercise_${dateStr}`) || {
            date: dateStr,
            exercises: []
        };
    },

    saveExerciseRecord(date, record) {
        const dateStr = Utils.formatDate(date);
        return Storage.set(`exercise_${dateStr}`, record);
    },

    addExerciseToRecord(date, exercise) {
        const record = this.getExerciseRecord(date);
        record.exercises.push(exercise);
        return this.saveExerciseRecord(date, record);
    },

    removeExerciseFromRecord(date, exerciseId) {
        const record = this.getExerciseRecord(date);
        record.exercises = record.exercises.filter(exercise => exercise.id !== exerciseId);
        return this.saveExerciseRecord(date, record);
    },

    // 计算每日饮食总热量
    calculateDailyFoodCalories(date) {
        const record = this.getDietRecord(date);
        return parseFloat(record.foods.reduce((total, food) => total + food.calories, 0).toFixed(1));
    },

    // 计算每日运动总热量
    calculateDailyExerciseCalories(date) {
        const record = this.getExerciseRecord(date);
        return parseFloat(record.exercises.reduce((total, exercise) => total + exercise.calories, 0).toFixed(1));
    },

    // 计算热量缺口/盈余
    calculateCalorieDeficit(date) {
        const userInfo = this.getUserInfo();
        if (!userInfo || !userInfo.tdee) {
            return 0;
        }
        const foodCalories = this.calculateDailyFoodCalories(date);
        // 热量缺口 = 每日总消耗（TDEE已包含日常活动+运动消耗） - 饮食摄入热量
        return HealthCalculator.calculateCalorieDeficit(userInfo.tdee, foodCalories);
    }
};

// 智能建议模块
const SmartAdvice = {
    // 生成减脂建议
    generateWeightLossAdvice(userInfo, foodCalories, exerciseCalories) {
        const { bmr, tdee, goal } = userInfo;
        const deficit = HealthCalculator.calculateCalorieDeficit(tdee, foodCalories);
        const advice = [];

        // 热量缺口建议
        if (deficit < 300) {
            const needed = 300 - deficit;
            advice.push(`建议增加${Utils.toFixedOne(needed)}大卡的热量消耗或减少${Utils.toFixedOne(needed)}大卡的饮食摄入，以达到理想的减脂缺口。`);
            advice.push(`可以增加约${Utils.toFixedOne(needed / (8.0 * (userInfo.weight || 60)) * 60)}分钟的跑步。`);
        } else if (deficit > 500) {
            const excess = deficit - 500;
            advice.push(`当前热量缺口过大（${Utils.toFixedOne(deficit)}大卡），建议适当增加${Utils.toFixedOne(excess)}大卡的摄入，避免代谢下降。`);
            advice.push(`可以增加约${Utils.toFixedOne(excess / 116 * 100)}克米饭或${Utils.toFixedOne(excess / 165 * 100)}克鸡胸肉的摄入。`);
        } else {
            advice.push(`当前热量缺口（${Utils.toFixedOne(deficit)}大卡）处于理想范围，继续保持！`);
        }

        // 运动建议
        if (exerciseCalories < 200) {
            advice.push(`今日运动消耗较少，建议增加有氧运动时间，如30分钟跑步可额外消耗约${Utils.toFixedOne(8.0 * (userInfo.weight || 60) * 0.5)}大卡。`);
        }

        if (exerciseCalories > 0 && exerciseCalories < 100) {
            advice.push(`建议补充一些无氧运动，如20分钟的腿部训练，有助于维持肌肉量。`);
        }

        return advice;
    },

    // 生成增肌建议
    generateMuscleGainAdvice(userInfo, foodCalories, exerciseCalories) {
        const { bmr, tdee, goal } = userInfo;
        const surplus = foodCalories - tdee;
        const advice = [];

        // 热量盈余建议
        if (surplus < 200) {
            const needed = 200 - surplus;
            advice.push(`建议增加${Utils.toFixedOne(needed)}大卡的热量摄入，以达到理想的增肌盈余。`);
            advice.push(`可以增加约${Utils.toFixedOne(needed / 116 * 100)}克米饭或${Utils.toFixedOne(needed / 165 * 100)}克鸡胸肉的摄入。`);
        } else if (surplus > 500) {
            const excess = surplus - 500;
            advice.push(`当前热量盈余过大（${Utils.toFixedOne(surplus)}大卡），建议适当减少${Utils.toFixedOne(excess)}大卡的摄入，避免过多脂肪堆积。`);
        } else {
            advice.push(`当前热量盈余（${Utils.toFixedOne(surplus)}大卡）处于理想范围，继续保持！`);
        }

        // 运动建议
        if (exerciseCalories < 300) {
            advice.push(`今日运动消耗较少，建议增加无氧运动时间，如40分钟的力量训练，有助于肌肉生长。`);
        }

        return advice;
    },

    // 生成综合建议
    generateAdvice(userInfo, foodCalories, exerciseCalories) {
        if (!userInfo) {
            return ['请先在个人信息页完善您的身体数据，以便获取个性化建议。'];
        }

        if (userInfo.goal === 'weight_loss') {
            return this.generateWeightLossAdvice(userInfo, foodCalories);
    } else {
        return this.generateMuscleGainAdvice(userInfo, foodCalories);
    }
    }
};

// 初始化页面功能
document.addEventListener('DOMContentLoaded', function() {
    // 根据当前页面执行相应的初始化
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    
    switch (currentPage) {
        case 'index':
            initIndexPage();
            break;
        case 'diet':
            initDietPage();
            break;
        case 'exercise':
            initExercisePage();
            break;
        case 'advice':
            initAdvicePage();
            break;
    }
});

// 重构TDEE计算函数
function calculateTDEE() {
  // 1. 获取BMR（基础代谢率，保留原有BMR计算逻辑）
  const bmr = parseFloat(localStorage.getItem('userBMR')) || 0;
  // 2. 获取当日运动消耗（从localStorage读取）
  const dailyExerciseCal = parseFloat(localStorage.getItem('todayExerciseCalorie')) || 0;
  // 3. 新公式：每日总消耗 = BMR × 1.3 + 当日运动消耗
  const newTDEE = (bmr * 1.3 + dailyExerciseCal).toFixed(1);
  
  // 4. 更新页面显示+持久化存储
  const tdeeDisplay = document.querySelector('#tdee');
  if (tdeeDisplay) {
    tdeeDisplay.textContent = newTDEE;
  }
  localStorage.setItem('userTDEE', newTDEE);
  
  // 5. 同步更新饮食页的热量盈余/缺口计算
  if (typeof calculateCalorieBalance === 'function') {
    calculateCalorieBalance();
  }
}

// 初始化个人信息页
function initIndexPage() {
    const form = document.getElementById('userInfoForm');
    if (!form) return;

    // 加载已保存的用户信息
    const savedInfo = DataManager.getUserInfo();
    if (savedInfo) {
        document.getElementById('name').value = savedInfo.name || '';
        document.getElementById('gender').value = savedInfo.gender || 'male';
        document.getElementById('age').value = savedInfo.age || '';
        document.getElementById('height').value = savedInfo.height || '';
        document.getElementById('weight').value = savedInfo.weight || '';
        document.getElementById(savedInfo.goal || 'weight_loss').checked = true;
    }

    // 保存信息 - 监听新的保存按钮
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const userInfo = getFormData();
            // 验证必填字段
            if (!userInfo.name || !userInfo.age || !userInfo.height || !userInfo.weight) {
                alert('请填写所有必填字段');
                return;
            }
            
            // 保存用户信息
            DataManager.saveUserInfo(userInfo);
            alert('信息保存成功');
        });
    }

    // 头像上传
    const avatarInput = document.getElementById('avatar');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const avatarPreview = document.getElementById('avatarPreview');
                    avatarPreview.src = e.target.result;
                    
                    // 保存头像到localStorage
                    const savedInfo = DataManager.getUserInfo() || {};
                    savedInfo.avatar = e.target.result;
                    DataManager.saveUserInfo(savedInfo);
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // 绑定BMR输入触发（年龄/身高/体重/性别变化时）
    document.querySelectorAll('#age, #weight, #height, #gender').forEach(el => {
        el.addEventListener('input', calculateBMR);
        el.addEventListener('change', calculateBMR);
    });
    
    // 绑定运动消耗变化触发
    window.addEventListener('storage', function(e) {
        if (e.key === 'todayExerciseCalorie') {
            calculateTDEE();
        }
    });
    
    // 页面加载时初始化计算
    window.addEventListener('DOMContentLoaded', function() {
        calculateBMR(); // 先算BMR，再自动算TDEE
    });

    // 获取表单数据
    function getFormData() {
        const formData = new FormData(form);
        return {
            name: formData.get('name'),
            gender: formData.get('gender'),
            age: parseFloat(formData.get('age')),
            height: parseFloat(formData.get('height')),
            weight: parseFloat(formData.get('weight')),
            goal: formData.get('goal')
        };
    }
}

// 初始化饮食记录页
function initDietPage() {
    // 页面初始化逻辑将在diet.html中调用
}

// 初始化运动记录页
function initExercisePage() {
    // 页面初始化逻辑将在exercise.html中调用
}

// 初始化智能建议页
function initAdvicePage() {
    // 页面初始化逻辑将在advice.html中调用
}

// 导出模块（如果在模块化环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HealthCalculator,
        FoodDatabase,
        DataManager,
        SmartAdvice
    };
}