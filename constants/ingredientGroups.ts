// Map of Group Name -> List of variant names (synonyms or subtypes)
// The key is the "Display Name" for the group.
// The first item in the array is considered the "Primary" ingredient ID to toggle by default.


// 1. Static List (Highest Priority - for specific overrides)
export const INGREDIENT_GROUPS: Record<string, string[]> = {
    '土豆': ['土豆', '大土豆', '小土豆', '马铃薯'],
    '鸡蛋': ['鸡蛋', '土鸡蛋', '洋鸡蛋', '鸭蛋', '鹌鹑蛋'],
    // Most aliases removed here to rely on Smart Rules, keeping only non-obvious ones
    '西红柿': ['番茄', '西红柿', '圣女果'], // Tomato aliases
};

// 2. Smart Rules (Keyword "AI" Matching)
// Format: Target Group Name -> { keywords: [], excludes: [] }
const SMART_RULES: Record<string, { keywords: string[], excludes?: string[] }> = {
    // --- MEATS (Keep existing robust logic) ---
    '牛肉': {
        keywords: [
            '牛', '肥牛', '和牛', '牛排', '沙朗', '菲力', '眼肉', '上脑', // Common
            '吊龙', '匙柄', '脖仁', '五花趾', '三花趾', '胸口朥', '肥胼', '嫩肉' // Chaoshan
        ],
        excludes: ['蜗牛', '牛油果', '牛蒡', '牛油']
    },
    '猪肉': {
        keywords: [
            '猪', '肉',
            '五花肉', '排骨', '里脊', '肉末', '肉馅', '培根', '火腿', '腊肠', '香肠',
            '梅花肉', '蹄膀', '肘子', '猪手', '猪蹄', '大排', '小排'
        ],
        excludes: ['鸡肉', '牛肉', '羊肉', '鸭肉', '鱼肉', '蟹肉', '多肉', '龙眼肉', '果肉']
    },
    '鸡肉': { keywords: ['鸡', '翅', '凤爪'], excludes: ['鸡蛋', '鸡精', '鸡粉', '蛋', '素鸡'] },
    '羊肉': { keywords: ['羊'], excludes: [] },
    '鸭/鹅': { keywords: ['鸭', '鹅', '掌', '舌'], excludes: ['鸭蛋', '鹅蛋'] },

    // --- SEAFOOD ---
    '鱼': { keywords: ['鱼', '鳗', '鳕', '鲈', '鲭', '鱼排', '三文鱼'], excludes: ['鱼香', '木鱼', '鱿鱼', '章鱼', '墨鱼', '甲鱼', '鳄鱼'] },
    '虾': { keywords: ['虾'], excludes: ['虾皮'] },
    '蟹': { keywords: ['蟹'], excludes: ['蟹味菇'] },
    '贝类': { keywords: ['贝', '蛤', '生蚝', '牡蛎', '鲍鱼', '蛏'], excludes: [] },
    '软体海鲜': { keywords: ['鱿鱼', '章鱼', '墨鱼'], excludes: [] },

    // --- VEGETABLES (Refined) ---
    '白菜类': { keywords: ['白菜', '娃娃菜', '大白菜', '小白菜', '黄芽菜'], excludes: [] },
    '青菜类': { keywords: ['油菜', '上海青', '小油菜', '菜心', '芥兰', '快菜', '鸡毛菜'], excludes: [] },
    '生菜/菊苣': { keywords: ['生菜', '油麦菜', '苦菊'], excludes: [] },
    '菠菜': { keywords: ['菠菜'], excludes: [] },
    '蒿菜': { keywords: ['茼蒿', '蓬蒿', '蒿'], excludes: [] },
    '空心菜': { keywords: ['空心菜', '通菜'], excludes: [] },
    '苋菜': { keywords: ['苋菜'], excludes: [] },
    '西兰花/花菜': { keywords: ['花菜', '西兰花', '花椰菜'], excludes: [] },
    '萝卜': { keywords: ['萝卜'], excludes: [] },
    '瓜类': { keywords: ['瓜'], excludes: ['西瓜', '哈密瓜', '甜瓜', '木瓜', '地瓜', '子'] }, // Exclude fruits/seeds
    '茄子': { keywords: ['茄'], excludes: ['番茄'] },
    '豆类蔬菜': { keywords: ['豆角', '四季豆', '扁豆', '豇豆', '刀豆', '荷兰豆', '毛豆', '豌豆'], excludes: ['土豆', '红豆', '绿豆', '黑豆', '黄豆'] }, // Exclude staples/dry beans
    '莲藕': { keywords: ['藕'], excludes: [] },
    '笋': { keywords: ['笋'], excludes: ['芦笋'] },
    '芦笋': { keywords: ['芦笋'], excludes: [] },
    '椒': { keywords: ['椒', '辣'], excludes: ['花椒', '胡椒'] }, // Exclude spices
    '洋葱': { keywords: ['洋葱'], excludes: [] },
    '番茄': { keywords: ['番茄', '西红柿'], excludes: [] },
    '菌菇': { keywords: ['菇', '菌', '木耳', '银耳'], excludes: [] },
    '豆腐/豆制品': { keywords: ['豆腐', '豆皮', '腐竹', '千张', '豆泡', '素鸡'], excludes: [] },
    '玉米': { keywords: ['玉米'], excludes: ['玉米油', '玉米淀粉'] },

    // --- STAPLES ---
    '米面': { keywords: ['米', '面', '粉', '馒头', '饼', '意面', '粉丝'], excludes: ['虾', '鸡', '肉', '汤', '粉蒸', '玉米', '小米辣', '花椒粉', '辣椒粉', '孜然粉', '胡椒粉', '淀粉', '生粉'] },
    '薯类': { keywords: ['地瓜', '红薯', '紫薯', '芋头', '山药'], excludes: [] },

    // --- AROMATICS ---
    '葱': { keywords: ['葱'], excludes: ['洋葱'] },
    '蒜': { keywords: ['蒜'], excludes: [] },
    '姜': { keywords: ['姜'], excludes: ['沙姜', '南姜'] }, // Keep simple or group matches
    '香菜': { keywords: ['香菜'], excludes: [] },

    // --- CONDIMENTS (Refined) ---
    '食用油': { keywords: ['油'], excludes: ['蚝油', '酱油', '豉油', '奶油', '黄油', '牛油', '红油', '花椒油'] },
    '酱油/醋': { keywords: ['生抽', '老抽', '酱油', '豉油', '醋'], excludes: [] },
    '糖/盐/味精': { keywords: ['糖', '盐', '味精', '鸡精'], excludes: [] },
    '酱料': { keywords: ['酱'], excludes: ['酱油', '果酱'] },
    '烹饪酒': { keywords: ['料酒', '黄酒', '白酒', '啤酒'], excludes: [] },
    '干香料': { keywords: ['花椒', '八角', '桂皮', '香叶', '孜然', '胡椒', '辣椒粉', '五香粉'], excludes: ['青花椒'] },
    '淀粉': { keywords: ['淀粉', '生粉', '嫩肉粉'], excludes: [] },

    // --- KITCHENWARE ---
    '锅具': { keywords: ['锅', '煲', '釜', '蒸笼', '烤盘'], excludes: [] },
    '刀具/砧板': { keywords: ['刀', '砧板', '菜板', '剪刀', '磨刀石'], excludes: [] },
    '烹饪电器': { keywords: ['烤箱', '微波炉', '空气炸锅', '破壁机', '搅拌机', '打蛋器', '电饭煲', '高压锅', '绞肉机'], excludes: [] },
    '其他工具': { keywords: ['铲', '勺', '碗', '盘', '筷', '叉', '擀面杖', '模具', '锡纸', '吸油纸', '保鲜膜'], excludes: ['淀粉'] },
};

export const groupIngredients = (ingredients: any[]) => {
    const processed = new Set<string>();
    const groups: { name: string, icon: string, variants: any[], isGroup: boolean }[] = [];

    // Helper to get or create a group
    const getGroup = (name: string, defaultIcon: string) => {
        let g = groups.find(x => x.name === name);
        if (!g) {
            g = { name, icon: defaultIcon, variants: [], isGroup: true };
            groups.push(g);
        }
        return g;
    };

    // 1. Check Static Lists & Smart Rules
    ingredients.forEach(item => {
        if (processed.has(item.id)) return;

        // Static Lists
        for (const [groupName, variants] of Object.entries(INGREDIENT_GROUPS)) {
            if (variants.includes(item.name) || variants.some(v => item.name === v)) {
                const g = getGroup(groupName, item.icon);
                g.variants.push(item);
                processed.add(item.id);
                return;
            }
        }

        // Smart Rules
        for (const [groupName, rule] of Object.entries(SMART_RULES)) {
            if (rule.keywords.some(k => item.name.includes(k))) {
                if (rule.excludes && rule.excludes.some(e => item.name.includes(e))) continue;

                const g = getGroup(groupName, item.icon);
                g.variants.push(item);
                processed.add(item.id);
                return;
            }
        }
    });

    // 2. Existing Dynamic Clustering (Containment: "Egg" captures "Big Egg")
    // This requires the "Root" (Short word) to be present in the list
    let remainingItems = ingredients.filter(i => !processed.has(i.id));

    // Sort by length ascending (shortest first)
    remainingItems.sort((a, b) => a.name.length - b.name.length);

    // Re-verify containment with updated processed list
    // (We iterate multiple times to handle nested chains if needed, but simple pass is enough for now)
    for (let i = 0; i < remainingItems.length; i++) {
        const root = remainingItems[i];
        if (processed.has(root.id)) continue;

        const children = remainingItems.filter((child, index) => {
            if (index <= i) return false;
            if (processed.has(child.id)) return false;
            return child.name.includes(root.name);
        });

        if (children.length > 0) {
            const g = getGroup(root.name, root.icon);
            g.variants.push(root);
            processed.add(root.id);
            children.forEach(child => {
                g.variants.push(child);
                processed.add(child.id);
            });
        }
    }

    // 3. New: Auto-Discovery Clustering (Common Substring)
    // This handles "Big Egg" & "Small Egg" when "Egg" is MISSING from the list.
    remainingItems = ingredients.filter(i => !processed.has(i.id));

    // We look for common substrings of length >= 2
    if (remainingItems.length > 1) {
        // Map of Substring -> List of Items containing it
        const substrMap = new Map<string, any[]>();

        remainingItems.forEach(item => {
            const name = item.name;
            // Generate all substrings >= 2 chars
            for (let len = 2; len <= name.length; len++) {
                for (let start = 0; start <= name.length - len; start++) {
                    const sub = name.substring(start, start + len);
                    if (!substrMap.has(sub)) substrMap.set(sub, []);
                    substrMap.get(sub)?.push(item);
                }
            }
        });

        // Filter valid groups: size >= 2
        // We want to prioritize Longest strings first (e.g. "Little Chicken" > "Chicken")? 
        // No, actually "Chicken" is better than "cken". 
        // Strategy: 
        // 1. Sort substrings by Length DESC (Specific first? No, actually we want Generic first).
        //    Actually for grouping, "Apple Pie" and "Apple Juice" -> "Apple" is better.
        //    "Big Red Apple" and "Small Red Apple" -> "Red Apple" is better than "Apple".
        //    Let's Sort by Length DESC. This captures "Red Apple".
        // 2. Iterate and claim items.

        const candidates = Array.from(substrMap.entries())
            .filter(([_, items]) => items.length >= 2)
            .sort((a, b) => b[0].length - a[0].length); // Longest substring first

        for (const [sub, items] of candidates) {
            // Check if these items are still available (not taken by a better group)
            const availableItems = items.filter(i => !processed.has(i.id));

            if (availableItems.length >= 2) {
                // Found a new implicit group!
                // Use the first item's icon as the group icon (approximate)
                const g = getGroup(sub, availableItems[0].icon);
                availableItems.forEach(i => {
                    g.variants.push(i);
                    processed.add(i.id);
                });
            }
        }
    }

    // 4. Add remaining standalone items
    ingredients.forEach(i => {
        if (!processed.has(i.id)) {
            groups.push({
                name: i.name,
                icon: i.icon,
                variants: [i],
                isGroup: false
            });
        }
    });

    // Post-process: Sort variants inside groups
    groups.forEach(g => {
        // Sort variants: exact match first, then by length
        g.variants.sort((a, b) => {
            if (a.name === g.name) return -1;
            if (b.name === g.name) return 1;
            return a.name.length - b.name.length;
        });
    });

    return groups;
};
