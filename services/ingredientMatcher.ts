
// Synonym Mapping for Semantic Matching (Frontend Version)
export const SYNONYM_MAP: Record<string, string> = {
    '番茄': '西红柿', '西红柿': '番茄',
    '马铃薯': '土豆', '土豆': '马铃薯',
    '生抽': '酱油', '老抽': '酱油',
    '鸡精': '味精', '味精': '鸡精',
    '青椒': '尖椒', '尖椒': '青椒',
    '花菜': '菜花', '菜花': '花菜'
};

export const normalize = (name: string): string => {
    return SYNONYM_MAP[name] || name;
};

/**
 * Checks if a recipe ingredient is present in the user's inventory
 * using Exact, Synonym, and Fuzzy (Substring) matching.
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
        // Avoid matching specific short strings incorrectly if needed, but for now:
        return uLower.includes(targetLower) || targetLower.includes(uLower);
    });
};
