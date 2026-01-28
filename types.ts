
export interface Recipe {
  id: string;
  name: string;
  image: string;
  link?: string;
  missingIngredients?: string[];
  likes?: number;
  isCollected?: boolean;
  cookedCount?: number; // Local state
  ingredients: {
    main: { name: string; amount: string; status?: 'missing' | 'stocked' }[];
    condiments: { name: string; amount: string; status?: 'missing' | 'stocked' }[];
  };
  steps: {
    title: string;
    description: string;
    image: string;
    videoUrl?: string;
  }[];
  insight: string;
}

export type AppTab = 'what-is-available' | 'what-to-eat' | 'me';
export type ViewMode = 'video' | 'graphic';
