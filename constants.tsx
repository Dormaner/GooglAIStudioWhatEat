
import { Recipe } from './types';

const DEFAULT_STEPS = [
  {
    title: '准备食材',
    description: '将所有主料洗净切好，调料按比例准备妥当。建议在切配前先清点一遍，确保没有遗漏关键调料。',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: '开火热锅',
    description: '锅中倒入适量底油，大火加热至微微冒烟。此时下入姜片和葱段煸炒出香味，这是菜品底味的关键。',
    image: 'https://images.unsplash.com/photo-1556910116-e220f712735d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: '翻炒收汁',
    description: '加入食材快速翻炒均匀。最后根据口味加入适量食盐和糖，焖煮至汤汁浓稠，完美裹在食材表面。',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800'
  }
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    name: '家常红烧肉',
    image: 'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?auto=format&fit=crop&q=80&w=400',
    missingIngredients: ['五花肉'],
    insight: '上次尝试加了两颗山楂，肉烂得更快而且解腻效果很好。下次可以试着减少5g冰糖。',
    ingredients: {
      main: [
        { name: '精品五花肉', amount: '500g', status: 'missing' },
        { name: '大葱 / 生姜', amount: '适量', status: 'stocked' }
      ],
      condiments: [
        { name: '冰糖', amount: '30g' },
        { name: '生抽', amount: '2勺' }
      ]
    },
    steps: [
      {
        title: '食材准备',
        description: '五花肉切成2.5cm见方的块，生姜切片。肉块大小要均匀，这样受热才一致。',
        image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&q=80&w=800'
      },
      {
        title: '焯水：冷水下锅',
        description: '放入姜片、料酒，开大火煮沸，撇去表面浮沫后捞出洗净。一定要冷水下锅，才能把血水煮出来。',
        image: 'https://images.unsplash.com/photo-1590671886400-8f8088b97cb0?auto=format&fit=crop&q=80&w=800'
      },
      {
        title: '炒糖色',
        description: '锅内放少量油，下冰糖小火炒至枣红色，下肉块翻炒均匀上色。注意火候，糖色过头会发苦。',
        image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=800'
      },
      {
        title: '小火焖煮',
        description: '加入热水没过肉块，大火烧开转小火焖煮40-60分钟。期间不要频繁开盖，保持锅内蒸汽。',
        image: 'https://images.unsplash.com/photo-1590671886400-8f8088b97cb0?auto=format&fit=crop&q=80&w=800'
      }
    ]
  },
  { id: '2', name: '缤纷果仁沙拉', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400', missingIngredients: ['坚果', '牛油果'], insight: '', ingredients: { main: [], condiments: [] }, steps: DEFAULT_STEPS },
  { id: '3', name: '低脂鸡肉暖碗', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400', missingIngredients: ['鸡胸肉'], insight: '', ingredients: { main: [], condiments: [] }, steps: DEFAULT_STEPS },
  { id: '4', name: '薄脆意式披萨', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400', missingIngredients: ['奶酪', '罗勒'], insight: '', ingredients: { main: [], condiments: [] }, steps: DEFAULT_STEPS },
  { id: '5', name: '灵魂土豆丸子', image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=400', missingIngredients: ['培根'], insight: '土豆泥一定要压得细腻，加入适量淀粉可以增加Q弹口感。', ingredients: { 
    main: [
      { name: '大土豆', amount: '2个', status: 'stocked' },
      { name: '培根', amount: '3片', status: 'missing' }
    ], 
    condiments: [] 
  }, steps: DEFAULT_STEPS },
  { id: '6', name: '香烤辣子鸡丁', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400', missingIngredients: ['干辣椒'], insight: '', ingredients: { main: [], condiments: [] }, steps: DEFAULT_STEPS },
  { id: '7', name: '包菜厚蛋烧', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=400', missingIngredients: ['卷心菜'], insight: '', ingredients: { main: [], condiments: [] }, steps: DEFAULT_STEPS },
  { id: '8', name: '黄金法式吐司', image: 'https://images.unsplash.com/photo-1484723088339-fe2a7a8f1d82?auto=format&fit=crop&q=80&w=400', missingIngredients: ['黄油'], insight: '', ingredients: { main: [], condiments: [] }, steps: DEFAULT_STEPS },
  { id: '9', name: '凉拌洋葱丝', image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&q=80&w=400', missingIngredients: [], insight: '', ingredients: { main: [], condiments: [] }, steps: DEFAULT_STEPS },
];

export const INGREDIENTS = {
  vegetables: [
    { name: '土豆', icon: '🥔' }, { name: '胡萝卜', icon: '🥕' }, { name: '花菜', icon: '🥦' }, { name: '白萝卜', icon: '🥣' },
    { name: '西葫芦', icon: '🥒' }, { name: '番茄', icon: '🍅' }, { name: '芹菜', icon: '🌿' }, { name: '黄瓜', icon: '🥒' },
    { name: '洋葱', icon: '🧅' }, { name: '莴笋', icon: '🎋' }, { name: '菌菇', icon: '🍄' }, { name: '茄子', icon: '🍆' },
    { name: '豆腐', icon: '🍲' }, { name: '包菜', icon: '🥦' }, { name: '白菜', icon: '🥬' }
  ],
  meats: [
    { name: '午餐肉', icon: '🥓' }, { name: '香肠', icon: '🌭' }, { name: '腊肠', icon: '🌭' }, { name: '鸡肉', icon: '🐥' },
    { name: '猪肉', icon: '🐷' }, { name: '鸡蛋', icon: '🥚' }, { name: '虾', icon: '🦐' }, { name: '牛肉', icon: '🐂' },
    { name: '骨头', icon: '🦴' }, { name: '鱼 (Todo)', icon: '🐟' }
  ],
  staples: [
    { name: '面食', icon: '🍜' }, { name: '面包', icon: '🍞' }, { name: '米', icon: '🍚' }
  ]
};
