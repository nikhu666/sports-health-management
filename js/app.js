// 健身健康管理系统 - 核心应用逻辑
// 引入其他模块

// 食物数据库 (将在HTML中通过script标签引入)
// <script src="js/food-db.js"></script>

// 健康计算模块
const HealthCalculator = {
    // 计算基础代谢率（BMR）- 标准公式
    calculateBMR(gender, weight, height, age) {
        if (gender === 'male') {
            // 男性标准公式：BMR = 10×体重(kg) + 6.25×身高(cm) - 5×年龄(岁) + 5
            return 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            // 女性标准公式：BMR = 10×体重(kg) + 6.25×身高(cm) - 5×年龄(岁) - 161
            return 10 * weight + 6.25 * height - 5 * age - 161;
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

// BMR自动计算函数
function calculateBMR() {
  // 1. 获取输入值
  const gender = document.getElementById('gender').value;
  const age = parseFloat(document.getElementById('age').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);
  const name = document.getElementById('name').value;
  
  // 2. 数值校验
  const bmrElement = document.getElementById('bmr');
  const tdeeElement = document.getElementById('tdee');
  
  // 姓名为空校验
  if (!name.trim()) {
    if (bmrElement) bmrElement.textContent = '请完善姓名信息';
    if (tdeeElement) tdeeElement.textContent = '请完善姓名信息';
    return;
  }
  
  // 年龄/身高/体重非数字校验
  if (isNaN(age) || isNaN(weight) || isNaN(height)) {
    if (bmrElement) bmrElement.textContent = '请输入有效数字';
    if (tdeeElement) tdeeElement.textContent = '请输入有效数字';
    return;
  }
  
  // 3. 使用标准BMR公式计算
  // 异常处理：当年龄/身高/体重任一为0时，BMR显示0
  let bmr = 0;
  if (age > 0 && weight > 0 && height > 0) {
    bmr = HealthCalculator.calculateBMR(gender, weight, height, age);
  }
  const bmrFixed = bmr.toFixed(1);
  
  // 4. 更新页面显示
  if (bmrElement) {
    bmrElement.textContent = bmrFixed;
  }
  
  // 5. 持久化存储
  localStorage.setItem('userBMR', bmrFixed);
  
  // 6. 计算BMR后自动触发TDEE计算
  calculateTDEE();
}

// TDEE自动计算函数
function calculateTDEE() {
  // 1. 获取BMR（基础代谢率）
  const bmr = parseFloat(localStorage.getItem('userBMR')) || 0;
  
  // 2. 获取当日运动消耗（从localStorage读取）
  const dailyExerciseCal = parseFloat(localStorage.getItem('todayExerciseCalorie')) || 0;
  
  // 3. TDEE计算规则：完全沿用原有计算公式
  // 异常处理：BMR为0时，TDEE同步显示0
  let newTDEE = 0;
  if (bmr > 0) {
    // 使用原有公式：每日总消耗 = BMR × 1.3 + 当日运动消耗
    newTDEE = bmr * 1.3 + dailyExerciseCal;
  }
  const tdeeFixed = newTDEE.toFixed(1);
  
  // 4. 更新页面显示
  const tdeeElement = document.getElementById('tdee');
  if (tdeeElement) {
    tdeeElement.textContent = tdeeFixed;
  }
  
  // 5. 持久化存储
  localStorage.setItem('userTDEE', tdeeFixed);
  
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
  
  // 4. 如果是建议页面，初始化运动建议模块
  console.log('当前页面URL:', window.location.href);
  console.log('当前页面pathname:', window.location.pathname);
  if (window.location.pathname.includes('advice.html') || window.location.href.includes('advice.html')) {
    console.log('检测到是建议页面，准备初始化运动建议模块');
    initAdvicePage();
  } else {
    console.log('不是建议页面，不初始化运动建议模块');
  }
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
            return this.generateWeightLossAdvice(userInfo, foodCalories, exerciseCalories);
        } else {
            return this.generateMuscleGainAdvice(userInfo, foodCalories, exerciseCalories);
        }
    },
    
    // 新功能：智能运动建议生成
    generateSmartExerciseAdvice(userInfo, exerciseRecord) {
        if (!userInfo || !exerciseRecord) {
            return {
                combinationScore: 0,
                combinationAnalysis: '请先完善个人信息并记录运动数据',
                totalDuration: 0,
                durationAnalysis: '暂无分析',
                totalCalories: 0,
                intensityAnalysis: '暂无分析',
                dietSuggestion: '暂无建议',
                recoveryTips: '暂无建议',
                tomorrowExercise: '暂无建议'
            };
        }
        
        const { goal, weight, height, age, gender, tdee = 0, experienceLevel = 'beginner' } = userInfo;
        const exercises = exerciseRecord.exercises || [];
        
        // 计算总时长和总消耗
        const totalDuration = exercises.reduce((sum, exercise) => sum + (exercise.duration || 0), 0);
        const totalCalories = exercises.reduce((sum, exercise) => sum + (exercise.calories || 0), 0);
        
        // 定义详细的运动类型分类
        const exerciseTypeMap = {
            // 有氧运动
            'running': { type: 'cardio', subType: 'running', met: 8.0, description: '跑步' },
            'jogging': { type: 'cardio', subType: 'running', met: 6.5, description: '慢跑' },
            'walking': { type: 'cardio', subType: 'walking', met: 3.5, description: '步行' },
            'fast_walk': { type: 'cardio', subType: 'walking', met: 5.0, description: '快走' },
            'swimming': { type: 'cardio', subType: 'swimming', met: 6.0, description: '游泳' },
            'cycling': { type: 'cardio', subType: 'cycling', met: 5.0, description: '骑自行车' },
            'rope_skipping': { type: 'cardio', subType: 'high_intensity', met: 10.0, description: '跳绳' },
            'aerobic': { type: 'cardio', subType: 'general', met: 7.0, description: '有氧运动' },
            'hiit': { type: 'cardio', subType: 'high_intensity', met: 12.0, description: '高强度间歇训练' },
            '椭圆机': { type: 'cardio', subType: 'general', met: 5.5, description: '椭圆机' },
            '划船机': { type: 'cardio', subType: 'general', met: 6.0, description: '划船机' },
            // 无氧运动
            'strength': { type: 'strength', subType: 'general', met: 3.5, description: '力量训练' },
            'weightlifting': { type: 'strength', subType: 'weightlifting', met: 4.0, description: '举重' },
            'bodyweight': { type: 'strength', subType: 'bodyweight', met: 3.8, description: '自重训练' },
            'resistance': { type: 'strength', subType: 'resistance', met: 3.5, description: '阻力训练' },
            'yoga': { type: 'flexibility', subType: 'yoga', met: 2.8, description: '瑜伽' },
            'pilates': { type: 'flexibility', subType: 'pilates', met: 3.0, description: '普拉提' },
            '拉伸': { type: 'flexibility', subType: 'stretching', met: 2.5, description: '拉伸' },
            // 中文名称映射
            '跑步': { type: 'cardio', subType: 'running', met: 8.0, description: '跑步' },
            '快走': { type: 'cardio', subType: 'walking', met: 5.0, description: '快走' },
            '游泳': { type: 'cardio', subType: 'swimming', met: 6.0, description: '游泳' },
            '骑自行车': { type: 'cardio', subType: 'cycling', met: 5.0, description: '骑自行车' },
            '跳绳': { type: 'cardio', subType: 'high_intensity', met: 10.0, description: '跳绳' },
            '力量训练': { type: 'strength', subType: 'general', met: 3.5, description: '力量训练' },
            '自重训练': { type: 'strength', subType: 'bodyweight', met: 3.8, description: '自重训练' },
            '阻力训练': { type: 'strength', subType: 'resistance', met: 3.5, description: '阻力训练' },
            '瑜伽': { type: 'flexibility', subType: 'yoga', met: 2.8, description: '瑜伽' }
        };
        
        // 计算有氧/无氧/灵活性比例和强度
        let cardioDuration = 0;
        let strengthDuration = 0;
        let flexibilityDuration = 0;
        let totalMet = 0;
        let exerciseTypes = new Set();
        let subTypes = new Set();
        let actualIntensity = 'moderate'; // 默认强度
        
        exercises.forEach(exercise => {
            const exerciseName = exercise.name ? exercise.name.toLowerCase() : '';
            const exerciseType = exercise.type ? exercise.type.toLowerCase() : exerciseName;
            const duration = exercise.duration || 0;
            let intensity = exercise.intensity ? exercise.intensity.toLowerCase() : 'moderate';
            
            // 确定运动类型
            let matchedType = exerciseTypeMap[exerciseType] || exerciseTypeMap[exerciseName] || { type: 'other', subType: 'general', met: 4.0, description: '其他运动' };
            
            // 根据实际强度调整MET值
            let intensityMultiplier = 1.0;
            if (intensity === 'low') intensityMultiplier = 0.8;
            if (intensity === 'high') intensityMultiplier = 1.3;
            if (intensity === 'very_high') intensityMultiplier = 1.6;
            
            // 考虑用户体重对MET的影响
            const weightMultiplier = weight ? (weight / 70) : 1.0;
            const met = (exercise.met || matchedType.met) * intensityMultiplier * weightMultiplier;
            
            // 记录实际强度
            if (intensity === 'high' || intensity === 'very_high') {
                actualIntensity = intensity;
            }
            
            totalMet += met * duration;
            exerciseTypes.add(matchedType.type);
            subTypes.add(matchedType.subType);
            
            // 分类统计时长
            if (matchedType.type === 'cardio') {
                cardioDuration += duration;
            } else if (matchedType.type === 'strength') {
                strengthDuration += duration;
            } else if (matchedType.type === 'flexibility') {
                flexibilityDuration += duration;
            }
        });
        
        const avgMet = totalDuration > 0 ? totalMet / totalDuration : 0;
        let exerciseType = 'mixed';
        
        // 确定主要运动类型
        if (cardioDuration > strengthDuration && cardioDuration > flexibilityDuration) {
            exerciseType = 'cardio';
        } else if (strengthDuration > cardioDuration && strengthDuration > flexibilityDuration) {
            exerciseType = 'strength';
        } else if (flexibilityDuration > cardioDuration && flexibilityDuration > strengthDuration) {
            exerciseType = 'flexibility';
        }
        
        // 1. 运动搭配评分（多维度智能加权升级）
        let combinationScore = 0;
        let combinationAnalysis = '';
        let combinationRating = '';
        
        if (totalDuration > 0) {
            // 维度1：运动类型与目标匹配度（40%）
            let typeMatchScore = 0;
            
            // 基于更详细的运动类型和目标的匹配度
            if (goal === 'weight_loss') {
                // 减脂：优先考虑高强度有氧和HIIT
                if (subTypes.has('high_intensity') || exerciseType === 'cardio') {
                    typeMatchScore = 40;
                } else if (exerciseType === 'mixed' && cardioDuration > strengthDuration) {
                    typeMatchScore = 35;
                } else if (exerciseType === 'mixed') {
                    typeMatchScore = 30;
                } else {
                    typeMatchScore = 20;
                }
            } else if (goal === 'muscle_gain') {
                // 增肌：优先考虑力量训练和自重训练
                if (exerciseType === 'strength' && (subTypes.has('weightlifting') || subTypes.has('bodyweight'))) {
                    typeMatchScore = 40;
                } else if (exerciseType === 'strength') {
                    typeMatchScore = 35;
                } else if (exerciseType === 'mixed' && strengthDuration > cardioDuration) {
                    typeMatchScore = 30;
                } else {
                    typeMatchScore = 20;
                }
            } else {
                // 维持：强调均衡和灵活性
                if (exerciseTypes.size >= 2 || exerciseType === 'flexibility') {
                    typeMatchScore = 40;
                } else if (exerciseType === 'mixed') {
                    typeMatchScore = 35;
                } else {
                    typeMatchScore = 30;
                }
            }
            
            // 维度2：时长与目标适配范围匹配度（30%）
            let durationMatchScore = 0;
            if (goal === 'weight_loss') {
                // 减脂有氧建议20-60分钟
                if (totalDuration >= 30 && totalDuration <= 50) {
                    durationMatchScore = 30;
                } else if ((totalDuration >= 20 && totalDuration < 30) || (totalDuration > 50 && totalDuration <= 60)) {
                    durationMatchScore = 25;
                } else if (totalDuration >= 10 && totalDuration < 20) {
                    durationMatchScore = 15;
                } else {
                    durationMatchScore = 10;
                }
            } else if (goal === 'muscle_gain') {
                // 增肌建议45-90分钟
                if (totalDuration >= 45 && totalDuration <= 75) {
                    durationMatchScore = 30;
                } else if ((totalDuration >= 30 && totalDuration < 45) || (totalDuration > 75 && totalDuration <= 90)) {
                    durationMatchScore = 25;
                } else if (totalDuration >= 15 && totalDuration < 30) {
                    durationMatchScore = 15;
                } else {
                    durationMatchScore = 10;
                }
            } else {
                // 维持建议20-60分钟
                if (totalDuration >= 25 && totalDuration <= 50) {
                    durationMatchScore = 30;
                } else if ((totalDuration >= 20 && totalDuration < 25) || (totalDuration > 50 && totalDuration <= 60)) {
                    durationMatchScore = 25;
                } else if (totalDuration >= 10 && totalDuration < 20) {
                    durationMatchScore = 15;
                } else {
                    durationMatchScore = 10;
                }
            }
            
            // 维度3：强度与目标适配度（30%）
            let intensityMatchScore = 0;
            if (goal === 'weight_loss') {
                // 减脂→中等强度（MET 4-7）
                if (avgMet >= 4 && avgMet <= 7) {
                    intensityMatchScore = 30;
                } else if ((avgMet >= 3 && avgMet < 4) || (avgMet > 7 && avgMet <= 9)) {
                    intensityMatchScore = 25;
                } else {
                    intensityMatchScore = 15;
                }
            } else if (goal === 'muscle_gain') {
                // 增肌→中-高强度（MET 6-10）
                if (avgMet >= 6 && avgMet <= 10) {
                    intensityMatchScore = 30;
                } else if ((avgMet >= 4 && avgMet < 6) || (avgMet > 10 && avgMet <= 12)) {
                    intensityMatchScore = 25;
                } else {
                    intensityMatchScore = 15;
                }
            } else {
                // 维持→低-中等强度（MET 3-6）
                if (avgMet >= 3 && avgMet <= 6) {
                    intensityMatchScore = 30;
                } else if ((avgMet >= 2 && avgMet < 3) || (avgMet > 6 && avgMet <= 8)) {
                    intensityMatchScore = 25;
                } else {
                    intensityMatchScore = 15;
                }
            }
            
            // 计算总分
            combinationScore = typeMatchScore + durationMatchScore + intensityMatchScore;
            
            // 评级
            if (combinationScore >= 85) {
                combinationRating = '卓越';
            } else if (combinationScore >= 70) {
                combinationRating = '优秀';
            } else if (combinationScore >= 50) {
                combinationRating = '良好';
            } else if (combinationScore >= 30) {
                combinationRating = '待优化';
            } else {
                combinationRating = '不合理';
            }
            
            // 详细分析
            const typeMatchText = exerciseType === 'cardio' ? '有氧运动' : exerciseType === 'strength' ? '无氧运动' : '混合运动';
            const durationMatchText = totalDuration >= 30 ? '时长贴合范围' : '时长略短';
            const intensityMatchText = avgMet >= 4 ? '强度适中' : avgMet < 4 ? '强度略低' : '强度较高';
            
            combinationAnalysis = `综合评分：${combinationScore}分（${combinationRating}）\n\n运动类型高度适配${goal === 'weight_loss' ? '减脂' : goal === 'muscle_gain' ? '增肌' : '维持'}目标${totalDuration >= 30 ? '，时长贴合范围' : '，但时长略短'}。${avgMet >= 4 ? '强度适中，' : avgMet < 4 ? '强度略低，' : '强度较高，'}建议${goal === 'weight_loss' ? '继续保持中高强度有氧，单次30-50分钟' : goal === 'muscle_gain' ? '增加大重量无氧训练，单次45-75分钟' : '保持低中等强度混合训练'}，以达到更好的${goal === 'weight_loss' ? '燃脂' : goal === 'muscle_gain' ? '增肌' : '维持'}效果。`;
        } else {
            combinationScore = 0;
            combinationAnalysis = `今日暂无运动记录，无法评估运动搭配。\n\n${goal === 'weight_loss' ? '减脂目标' : goal === 'muscle_gain' ? '增肌目标' : '维持目标'}建议：\n- 运动类型：${goal === 'weight_loss' ? '优先选择HIIT、跑步等高强度有氧运动' : goal === 'muscle_gain' ? '优先选择重量训练、自重训练等无氧运动' : '建议结合有氧运动和无氧运动'} \n- 运动时长：${goal === 'weight_loss' ? '每次30-50分钟' : goal === 'muscle_gain' ? '每次45-75分钟' : '每次25-50分钟'} \n- 运动强度：${goal === 'weight_loss' ? '中高强度' : goal === 'muscle_gain' ? '中高强度' : '低中等强度'}`;
        }
        
        // 2. 时长合理性分析（基于运动类型和目标）
        let durationAnalysis = '';
        if (totalDuration > 0) {
            // 根据运动类型和目标提供更具体的时长分析
            if (goal === 'weight_loss') {
                if (subTypes.has('high_intensity')) {
                    if (totalDuration >= 20 && totalDuration <= 45) {
                        durationAnalysis = 'HIIT训练时长处于理想区间（20-45分钟），短时间内即可达到良好的燃脂效果，避免过度疲劳。';
                    } else if (totalDuration < 20) {
                        durationAnalysis = 'HIIT训练时长不足（建议20-45分钟），可能影响燃脂效果，建议适当增加运动时间。';
                    } else {
                        durationAnalysis = 'HIIT训练时长过长（建议20-45分钟），高强度训练持续过久可能导致身体过度疲劳，建议控制在合理范围内。';
                    }
                } else if (exerciseType === 'cardio') {
                    if (totalDuration >= 30 && totalDuration <= 90) {
                        durationAnalysis = '有氧运动时长处于理想区间（30-90分钟），有助于持续燃烧脂肪且不会过度疲劳。';
                    } else if (totalDuration < 30) {
                        durationAnalysis = '有氧运动时长不足（建议30-90分钟），可能影响燃脂效果，建议适当增加运动时间。';
                    } else {
                        durationAnalysis = '有氧运动时长过长（建议30-90分钟），长时间有氧运动可能导致肌肉流失，建议控制在合理范围内。';
                    }
                } else {
                    durationAnalysis = `当前运动时长为${totalDuration}分钟，建议结合有氧运动和力量训练，保持30-90分钟的总时长以达到最佳减脂效果。`;
                }
            } else if (goal === 'muscle_gain') {
                if (subTypes.has('weightlifting')) {
                    if (totalDuration >= 45 && totalDuration <= 120) {
                        durationAnalysis = '重量训练时长处于理想区间（45-120分钟），充足的时间有助于全面刺激肌肉群。';
                    } else if (totalDuration < 45) {
                        durationAnalysis = '重量训练时长不足（建议45-120分钟），可能无法充分刺激肌肉生长，建议适当增加训练时间。';
                    } else {
                        durationAnalysis = '重量训练时长过长（建议45-120分钟），过长时间的力量训练可能导致肌肉疲劳，影响训练质量。';
                    }
                } else if (subTypes.has('bodyweight')) {
                    if (totalDuration >= 30 && totalDuration <= 90) {
                        durationAnalysis = '自重训练时长处于理想区间（30-90分钟），适合刺激肌肉生长。';
                    } else if (totalDuration < 30) {
                        durationAnalysis = '自重训练时长不足（建议30-90分钟），可能影响肌肉生长效果，建议适当增加训练时间。';
                    } else {
                        durationAnalysis = '自重训练时长过长（建议30-90分钟），建议控制在合理范围内，避免过度疲劳。';
                    }
                } else {
                    durationAnalysis = `当前运动时长为${totalDuration}分钟，建议增加力量训练时间至45-120分钟，以达到最佳增肌效果。`;
                }
            } else {
                if (totalDuration >= 20 && totalDuration <= 70) {
                    durationAnalysis = '运动时长处于理想区间（20-70分钟），有助于维持身体健康和体能。';
                } else if (totalDuration < 20) {
                    durationAnalysis = '运动时长不足（建议20-70分钟），可能影响健康效果，建议适当增加运动时间。';
                } else {
                    durationAnalysis = '运动时长过长（建议20-70分钟），可能导致身体疲劳，建议控制在合理范围内。';
                }
            }
        } else {
            durationAnalysis = `${goal === 'weight_loss' ? '减脂目标' : goal === 'muscle_gain' ? '增肌目标' : '维持目标'}的理想运动时长建议：\n- 高强度训练（如HIIT）：20-45分钟\n- 有氧运动：${goal === 'weight_loss' ? '30-50分钟' : goal === 'muscle_gain' ? '20-30分钟' : '25-40分钟'} \n- 力量训练：${goal === 'weight_loss' ? '40-60分钟' : goal === 'muscle_gain' ? '50-75分钟' : '30-45分钟'}\n\n建议根据个人体能情况，从较短时长开始，逐步增加到理想区间。`;
        }
        
        // 3. 运动强度调整建议（基于实际运动类型和强度）
        let intensityAnalysis = '';
        if (totalCalories > 0 && tdee > 0) {
            // 计算当日运动消耗占TDEE的比例
            const calorieRatio = totalCalories / tdee;
            const goalRatioRange = {
                min: goal === 'weight_loss' ? 0.15 : goal === 'muscle_gain' ? 0.1 : 0.08,
                max: goal === 'weight_loss' ? 0.35 : goal === 'muscle_gain' ? 0.25 : 0.2
            };
            
            let specificAdvice = '';
            
            if (exerciseType === 'cardio') {
                if (subTypes.has('high_intensity')) {
                    specificAdvice = goal === 'weight_loss' ? 
                        '・HIIT训练：增加间歇时间比例，提高冲刺强度' : 
                        '・HIIT训练：保持高强度冲刺阶段，适当增加低强度恢复时间';
                } else if (subTypes.has('running')) {
                    specificAdvice = goal === 'weight_loss' ? 
                        '・跑步：提高配速或增加坡度，延长跑步时间' : 
                        '・跑步：保持适中配速，可考虑间歇跑增强心肺功能';
                } else {
                    specificAdvice = goal === 'weight_loss' ? 
                        '・有氧运动：提高运动强度，缩短休息时间' : 
                        '・有氧运动：保持适中强度，作为力量训练的补充';
                }
            } else if (exerciseType === 'strength') {
                if (subTypes.has('weightlifting')) {
                    specificAdvice = goal === 'muscle_gain' ? 
                        '・重量训练：增加重量或组数，保持8-12次的每组次数' : 
                        '・重量训练：维持现有重量，增加次数至15-20次以增强耐力';
                } else if (subTypes.has('bodyweight')) {
                    specificAdvice = goal === 'muscle_gain' ? 
                        '・自重训练：增加难度（如单腿俯卧撑、负重引体向上）' : 
                        '・自重训练：增加组数，缩短组间休息';
                } else {
                    specificAdvice = goal === 'muscle_gain' ? 
                        '・力量训练：增加抗阻力，确保肌肉充分收缩' : 
                        '・力量训练：保持适中强度，注重肌肉控制';
                }
            } else {
                specificAdvice = '・建议结合有氧运动和力量训练，根据目标调整强度';
            }
            
            if (calorieRatio >= goalRatioRange.min && calorieRatio <= goalRatioRange.max) {
                intensityAnalysis = `运动消耗占TDEE比例为${(calorieRatio * 100).toFixed(1)}%，处于目标范围（${(goalRatioRange.min * 100).toFixed(0)}%-${(goalRatioRange.max * 100).toFixed(0)}%）。\n\n当前强度水平非常适合您的目标，建议继续保持！`;
            } else if (calorieRatio < goalRatioRange.min) {
                intensityAnalysis = `运动消耗占TDEE比例为${(calorieRatio * 100).toFixed(1)}%，低于目标范围（${(goalRatioRange.min * 100).toFixed(0)}%-${(goalRatioRange.max * 100).toFixed(0)}%）。\n\n建议增加运动强度：\n${specificAdvice}`;
            } else {
                // 消耗占比过高
                intensityAnalysis = `运动消耗占TDEE比例为${(calorieRatio * 100).toFixed(1)}%，高于目标范围（${(goalRatioRange.min * 100).toFixed(0)}%-${(goalRatioRange.max * 100).toFixed(0)}%）。\n\n建议降低运动强度：\n${specificAdvice.replace('增加', '降低').replace('提高', '降低').replace('缩短', '延长')}`;
            }
        } else if (totalDuration > 0) {
            // 根据实际强度提供建议
            let intensityText = '';
            if (actualIntensity === 'high' || actualIntensity === 'very_high') {
                intensityText = '当前运动强度较高，建议适当休息，避免过度训练';
            } else if (actualIntensity === 'moderate') {
                intensityText = '当前运动强度适中，适合长期坚持';
            } else {
                intensityText = '当前运动强度较低，建议适当增加强度以达到更好的训练效果';
            }
            intensityAnalysis = `今日暂无TDEE数据，${intensityText}。`;
        } else {
            intensityAnalysis = `${goal === 'weight_loss' ? '减脂目标' : goal === 'muscle_gain' ? '增肌目标' : '维持目标'}的运动强度建议：\n- 高强度训练（如HIIT）：每周2-3次，每次20-45分钟\n- 中高强度（如跑步、力量训练）：每周3-5次，根据时长调整强度\n- 中低强度（如步行、瑜伽）：每周可多次，作为放松和恢复\n\n建议根据个人体能情况选择合适强度，循序渐进，避免过度训练。`;
        }
        
        // 4. 锻炼饮食建议（根据运动类型和强度定制）
        let dietSuggestion = '';
        if (totalDuration > 0) {
            // 训练前建议（1-2小时）
            let preWorkout = '';
            if (goal === 'weight_loss') {
                if (actualIntensity === 'high' || actualIntensity === 'very_high') {
                    preWorkout = '训练前1-2小时：补充低GI碳水+少量蛋白（如1片全麦面包+1个鸡蛋），避免高油高糖食物，为高强度训练提供持续能量';
                } else {
                    preWorkout = '训练前1-2小时：补充少量易消化碳水（如1根香蕉+少量坚果），避免空腹训练导致的低血糖';
                }
            } else if (goal === 'muscle_gain') {
                if (exerciseType === 'strength') {
                    preWorkout = '训练前1-2小时：补充中GI碳水+适量蛋白（如1碗燕麦粥+1杯牛奶），提供肌肉生长所需的营养和能量';
                } else {
                    preWorkout = '训练前1-2小时：补充均衡营养（如1片全麦面包+2个鸡蛋），确保有足够能量完成训练';
                }
            } else {
                preWorkout = '训练前1-2小时：补充适量营养（如1个苹果+少量坚果），避免空腹训练';
            }
            
            // 训练中建议
            let duringWorkout = '';
            if (totalDuration > 45) {
                if (actualIntensity === 'high' || actualIntensity === 'very_high') {
                    duringWorkout = '训练中：每30分钟补充100-200ml电解质水或1支能量胶，维持血糖水平，避免脱水和能量不足';
                } else {
                    duringWorkout = '训练中：少量多次补充水分（每次100ml左右），保持身体水分平衡';
                }
            } else {
                duringWorkout = '训练中：适量补充水分，保持身体水分平衡即可';
            }
            
            // 训练后建议（30分钟内）
            let postWorkout = '';
            if (goal === 'weight_loss') {
                if (exerciseType === 'cardio') {
                    postWorkout = '训练后30分钟内：补充20-30g蛋白（如150g鸡胸肉或1杯蛋白粉），控制碳水摄入量，保持热量缺口';
                } else {
                    postWorkout = '训练后30分钟内：补充20-30g蛋白+少量碳水（如150g鸡胸肉+100g糙米饭），促进肌肉修复同时控制总热量';
                }
            } else if (goal === 'muscle_gain') {
                if (exerciseType === 'strength') {
                    const requiredProtein = weight ? (weight * 1.8).toFixed(0) : 120;
                    postWorkout = `训练后30分钟内：补充30-40g蛋白+50-70g碳水（如4个鸡蛋+1碗米饭），保持热量盈余200-500大卡，确保每日蛋白摄入≥${requiredProtein}g`;
                } else {
                    postWorkout = '训练后30分钟内：补充30-40g蛋白+30-50g碳水（如150g鸡胸肉+100g米饭），促进肌肉修复和生长';
                }
            } else {
                postWorkout = '训练后30分钟内：补充均衡营养（如1杯蛋白粉+1根香蕉），热量匹配TDEE，保持身体平衡';
            }
            
            dietSuggestion = `${preWorkout}\n\n${duringWorkout}\n\n${postWorkout}`;
        } else {
            dietSuggestion = `${goal === 'weight_loss' ? '减脂目标' : goal === 'muscle_gain' ? '增肌目标' : '维持目标'}的日常饮食建议：\n- 蛋白质：每日摄入${weight ? (weight * 1.2).toFixed(0) : 84}g-\n- 碳水化合物：${goal === 'weight_loss' ? '控制在总热量的40-50%' : goal === 'muscle_gain' ? '占总热量的50-60%' : '占总热量的45-55%'}，优先选择全谷物、蔬菜和水果\n- 脂肪：占总热量的20-30%，优先选择健康脂肪（如橄榄油、坚果、鱼类）\n- 水分：每日至少饮用${weight ? (weight * 30 / 1000).toFixed(1) : 2.1}升水\n\n建议定时定量进食，避免暴饮暴食，保持饮食多样性。`;
        }
        
        // 5. 恢复与技巧建议（根据运动类型和强度定制）
        let recoveryTips = '';
        
        if (totalDuration > 0) {
            let specificRecovery = '';
            let sleepAdvice = '';
            let hydrationAdvice = '';
            
            // 针对不同运动类型的恢复建议
            if (exerciseType === 'cardio') {
                if (subTypes.has('high_intensity')) {
                    specificRecovery = '・HIIT训练后：进行5-10分钟的低强度有氧运动（如慢走），帮助身体逐渐恢复';
                } else if (subTypes.has('running')) {
                    specificRecovery = '・跑步后：重点拉伸腿部肌肉（股四头肌、腘绳肌、小腿三头肌），每组30秒';
                } else {
                    specificRecovery = '・有氧运动后：进行全身拉伸，放松紧张的肌肉群';
                }
            } else if (exerciseType === 'strength') {
                if (subTypes.has('weightlifting')) {
                    specificRecovery = '・重量训练后：使用泡沫轴按摩目标肌群，缓解肌肉紧张和酸痛';
                } else if (subTypes.has('bodyweight')) {
                    specificRecovery = '・自重训练后：进行针对性的肌肉拉伸，重点关注训练过的肌群';
                } else {
                    specificRecovery = '・力量训练后：进行静态拉伸，保持每个姿势30-60秒';
                }
            } else {
                specificRecovery = '・运动后：进行全身放松练习，如瑜伽或深呼吸，帮助缓解疲劳';
            }
            
            // 睡眠和水分建议
            if (actualIntensity === 'high' || actualIntensity === 'very_high') {
                sleepAdvice = '・睡眠：保证7-9小时的充足睡眠，有助于身体恢复和肌肉修复';
                hydrationAdvice = '・水分：运动后补充足够水分，建议每公斤体重补充30-40ml水';
            } else {
                sleepAdvice = '・睡眠：保证7-8小时的充足睡眠，维持身体正常代谢';
                hydrationAdvice = '・水分：运动后适量补充水分，保持身体水分平衡';
            }
            
            // 营养补充建议
            let nutritionAdvice = '';
            if (goal === 'muscle_gain') {
                nutritionAdvice = '・营养：训练后及时补充蛋白质和碳水化合物，促进肌肉生长和修复';
            } else if (goal === 'weight_loss') {
                nutritionAdvice = '・营养：保持均衡饮食，控制热量摄入，确保有足够营养支持身体恢复';
            } else {
                nutritionAdvice = '・营养：保持均衡饮食，确保摄入足够的维生素和矿物质';
            }
            
            recoveryTips = `${specificRecovery}\n\n${sleepAdvice}\n\n${hydrationAdvice}\n\n${nutritionAdvice}`;
        } else {
            recoveryTips = `${goal === 'weight_loss' ? '减脂目标' : goal === 'muscle_gain' ? '增肌目标' : '维持目标'}的身体恢复建议：\n- 睡眠：每日保证7-9小时的高质量睡眠，建议在22:30-07:30之间保持规律作息\n- 水分：每日至少饮用${weight ? (weight * 30 / 1000).toFixed(1) : 2.1}升水，保持身体水分平衡\n- 拉伸：每日进行5-10分钟的全身拉伸，特别是容易紧张的部位（如肩部、颈部、腿部）\n- 按摩：定期使用泡沫轴或按摩球放松肌肉，缓解肌肉紧张\n- 休息：每周安排1-2天的完全休息或低强度活动，让身体充分恢复\n\n良好的恢复习惯有助于提高运动效果，减少受伤风险。`;
        }
        
        // 6. 明日运动建议（智能交替升级）
        let tomorrowExercise = '';
        if (totalDuration > 0) {
            // 根据今日运动类型规划明日运动（交替训练原则）
            const todayType = exerciseType;
            const tomorrowType = todayType === 'cardio' ? 'strength' : todayType === 'strength' ? 'cardio' : Math.random() > 0.5 ? 'cardio' : 'strength';
            
            // 结合运动目的调整强度
            const intensityLevel = goal === 'weight_loss' ? '中等' : goal === 'muscle_gain' ? '中-高' : '低-中';
            
            // 匹配用户体能（年龄>40岁降低强度）
            const adjustedIntensity = age > 40 ? '低-中' : intensityLevel;
            
            // 建议时长
            const suggestedDuration = tomorrowType === 'cardio' ? 
                (goal === 'weight_loss' ? '30-50分钟' : goal === 'muscle_gain' ? '20-30分钟' : '25-40分钟') : 
                (goal === 'weight_loss' ? '40-60分钟' : goal === 'muscle_gain' ? '50-75分钟' : '30-45分钟');
            
            // 运动类型文本
            const tomorrowTypeText = tomorrowType === 'cardio' ? '有氧运动' : '无氧力量训练';
            
            // 规划理由
            const reason = `交替训练避免肌肉疲劳，提高训练效果。${tomorrowType === 'cardio' ? '有氧运动有助于提升心肺功能和燃脂' : '无氧力量训练有助于增加肌肉量和基础代谢率'}`;
            
            // 注意事项
            const precautions = age > 40 ? '注意控制运动强度，避免过度疲劳' : '记得做好热身和拉伸准备';
            
            tomorrowExercise = `明日建议：${tomorrowTypeText}，强度：${adjustedIntensity}，时长：${suggestedDuration}\n\n规划理由：${reason}，符合${goal === 'weight_loss' ? '减脂' : goal === 'muscle_gain' ? '增肌' : '维持'}目标的训练需求。\n\n注意事项：${precautions}，保持训练的规律性和一致性。`;
        } else {
            tomorrowExercise = `基于${goal === 'weight_loss' ? '减脂' : goal === 'muscle_gain' ? '增肌' : '维持'}目标的明日运动计划建议：\n\n推荐运动组合：\n- ${goal === 'weight_loss' ? '高强度间歇训练（HIIT）+ 力量训练' : goal === 'muscle_gain' ? '重量训练 + 低强度有氧' : '有氧 + 力量的平衡组合'} \n- 强度：低-中强度开始，逐步提升到中-高强度\n- 时长：总时长建议30-60分钟\n\n规划理由：${goal === 'weight_loss' ? '结合高强度有氧和力量训练，既燃烧脂肪又保留肌肉' : goal === 'muscle_gain' ? '力量训练刺激肌肉生长，低强度有氧维持心肺功能' : '平衡有氧和力量训练，全面提升身体健康水平'}\n\n注意事项：记得做好热身和拉伸准备，保持训练的规律性，每周建议运动3-5次。`;
        }
        
        return {
            combinationScore: combinationScore,
            combinationAnalysis: combinationAnalysis,
            totalDuration: totalDuration,
            durationAnalysis: durationAnalysis,
            totalCalories: totalCalories,
            intensityAnalysis: intensityAnalysis,
            dietSuggestion: dietSuggestion,
            recoveryTips: recoveryTips,
            tomorrowExercise: tomorrowExercise
        };
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
        // 保存按钮显隐规则：初始状态默认显示，无隐藏场景
        // 禁用条件：当姓名为空时，按钮置灰（不可点击）
        function updateSaveButtonState() {
            const name = document.getElementById('name').value;
            if (!name.trim()) {
                saveButton.disabled = true;
                saveButton.textContent = '请完善必填信息';
                saveButton.style.backgroundColor = '#90CAF9'; // 置灰颜色
            } else {
                saveButton.disabled = false;
                saveButton.textContent = '保存个人信息';
                saveButton.style.backgroundColor = '#21d07a'; // 绿色背景，与CSS保持一致
            }
        }
        
        // 实时更新保存按钮状态
        document.getElementById('name').addEventListener('input', updateSaveButtonState);
        updateSaveButtonState(); // 初始状态检查
        
        saveButton.addEventListener('click', function() {
            const userInfo = getFormData();
            
            // 验证姓名必填
            if (!userInfo.name.trim()) {
                alert('请先填写姓名');
                return;
            }
            
            // 保存用户信息
            const oldInfo = DataManager.getUserInfo();
            DataManager.saveUserInfo(userInfo);
            
            // 保存反馈：信息已保存过再次点击时，提示"信息已更新"
            if (oldInfo) {
                alert('信息已更新');
            } else {
                alert('信息保存成功');
            }
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
            age: parseFloat(formData.get('age')) || 0, // 年龄为0时仍可保存
            height: parseFloat(formData.get('height')) || 0, // 身高为0时仍可保存
            weight: parseFloat(formData.get('weight')) || 0, // 体重为0时仍可保存
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
    // 初始化饮食建议（已在diet.html中实现）
    
    // 初始化运动建议
    initExerciseAdvice();
}

// 初始化运动建议
function initExerciseAdvice() {
    // 加载用户信息和今日运动记录
    const userInfo = DataManager.getUserInfo() || {
        name: '测试用户',
        gender: 'male',
        age: 30,
        height: 175,
        weight: 70,
        goal: 'weight_loss',
        tdee: 2000
    };
    
    const today = new Date();
    let exerciseRecord = DataManager.getExerciseRecord(today);
    
    // 若数据为空，补充兜底数据
    if (!exerciseRecord || !exerciseRecord.exercises || exerciseRecord.exercises.length === 0) {
        exerciseRecord = {
            date: new Date().toISOString().split('T')[0],
            exercises: [
                {
                    name: '跑步',
                    type: 'aerobic',
                    duration: 30,
                    calories: 300,
                    intensity: 'moderate'
                },
                {
                    name: '力量训练',
                    type: 'strength',
                    duration: 30,
                    calories: 150,
                    intensity: 'high'
                }
            ]
        };
    }
    
    // 生成智能运动建议
    const exerciseAdvice = SmartAdvice.generateSmartExerciseAdvice(userInfo, exerciseRecord);
    
    // 更新运动建议显示
    updateExerciseAdviceDisplay(exerciseAdvice);
    
    // 绑定运动数据变化的监听
    window.addEventListener('storage', function(e) {
        if (e.key.startsWith('exercise_')) {
            // 运动数据发生变化，重新生成建议
            const updatedExerciseRecord = DataManager.getExerciseRecord(today);
            const updatedAdvice = SmartAdvice.generateSmartExerciseAdvice(userInfo, updatedExerciseRecord);
            updateExerciseAdviceDisplay(updatedAdvice);
        }
    });
}

// 更新运动建议显示
function updateExerciseAdviceDisplay(advice) {
    // 更新运动搭配评分
    updateAdviceContent('exercise-combination', [
        { label: '当日运动搭配评分', value: `${advice.combinationScore.toFixed(1)}/100`, isValue: true },
        { content: advice.combinationAnalysis.replace(/\n/g, '<br>') }
    ]);
    
    // 更新时长合理性分析
    updateAdviceContent('duration-rationality', [
        { label: '今日总运动时长', value: `${advice.totalDuration}分钟`, isValue: true },
        { content: advice.durationAnalysis }
    ]);
    
    // 更新运动强度调整建议
    updateAdviceContent('intensity-adjustment', [
        { label: '今日总消耗热量', value: `${advice.totalCalories}大卡`, isValue: true },
        { content: advice.intensityAnalysis.replace(/\n/g, '<br>') }
    ]);
    
    // 更新锻炼饮食建议
    updateAdviceContent('exercise-diet', [
        { content: advice.dietSuggestion.replace(/\n/g, '<br>') }
    ]);
    
    // 更新恢复与技巧建议
    updateAdviceContent('recovery-tips', [
        { content: advice.recoveryTips || '暂无建议' }
    ]);
    
    // 更新明日运动建议
    updateAdviceContent('tomorrow-suggestion', [
        { content: advice.tomorrowExercise || '暂无建议' }
    ]);
}

// 通用更新建议内容的函数
function updateAdviceContent(elementId, contentItems) {
    const contentElement = document.getElementById(elementId);
    if (!contentElement) return;
    
    contentElement.innerHTML = '<div class="advice-section"></div>';
    const sectionElement = contentElement.querySelector('.advice-section');
    
    contentItems.forEach(item => {
        const pElement = document.createElement('p');
        
        if (item.label && item.value) {
            // 带标签和值的内容
            pElement.innerHTML = `${item.label}：${item.isValue ? `<span class="data-value">${item.value}</span>` : item.value}`;
        } else if (item.content) {
            // 纯文本内容
            pElement.innerHTML = item.content;
        }
        
        sectionElement.appendChild(pElement);
    });
}

// 建议项展开/收起功能
function toggleAdviceItem(itemId) {
    const content = document.getElementById(itemId);
    const icon = content.previousElementSibling.querySelector('.icon');
    
    if (content.classList.contains('show')) {
        // 当前是展开状态，收起
        content.classList.remove('show');
        icon.textContent = '▶';
    } else {
        // 当前是收起状态，展开
        content.classList.add('show');
        icon.textContent = '▼';
    }
}

// 将函数暴露到全局作用域，确保HTML中的onclick事件可以调用
window.toggleAdviceItem = toggleAdviceItem;

// 导出模块（如果在模块化环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HealthCalculator,
        FoodDatabase,
        DataManager,
        SmartAdvice
    };
}