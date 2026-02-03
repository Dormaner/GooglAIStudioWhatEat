
// Synonym Mapping for Semantic Matching (Frontend Version)
export const SYNONYM_MAP: Record<string, string> = {
    '番茄': '西红柿', '西红柿': '番茄',
    '马铃薯': '土豆', '土豆': '马铃薯',
    '生抽': '酱油', '老抽': '酱油',
    '鸡精': '味精', '味精': '鸡精',
    '青椒': '尖椒', '尖椒': '青椒',
    '花菜': '菜花', '菜花': '花菜',
    '烤香肠': '烤肠', '烤肠': '烤香肠',
    '火腿肠': '热狗', '热狗': '火腿肠'
};

export const normalize = (name: string): string => {
    return SYNONYM_MAP[name] || name;
};

// Check if all characters of s1 appear in s2 in order (e.g. "烤肠" in "烤香肠")
const isSubsequence = (s1: string, s2: string): boolean => {
    if (s1.length < 2) return false; // Too risky for single chars
    let i = 0, j = 0;
    while (i < s1.length && j < s2.length) {
        if (s1[i] === s2[j]) i++;
        j++;
    }
    return i === s1.length;
};

/**
 * Checks if a recipe ingredient is present in the user's inventory
 * using Exact, Synonym, and Fuzzy (Substring/Subsequence) matching.
 */
export const isIngredientAvailable = (userInventory: string[], recipeIngredient: string): boolean => {
    if (!recipeIngredient) return false;

    // 0. Pre-process
    const target = (recipeIngredient || '').trim();
    if (!target) return false;

    const targetLower = target.toLowerCase();

    // 1. Exact Match (Case Insensitive)
    if (userInventory.some(u => u.toLowerCase() === targetLower)) return true;

    // 2. Synonym Match
    const normTarget = normalize(target);
    if (userInventory.some((u: string) => normalize(u) === normTarget)) return true;

    // 3. Substring / Fuzzy Match
    return userInventory.some((u: string) => {
        const uLower = u.toLowerCase();

        // A. Direct containment (Existing logic)
        if (uLower.includes(targetLower) || targetLower.includes(uLower)) return true;

        // B. Subsequence Match (New logic for "烤肠" matches "烤香肠")
        if (isSubsequence(uLower, targetLower) || isSubsequence(targetLower, uLower)) return true;

        return false;
    });
};
