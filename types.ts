export interface Profile {
  id: string;
  name: string;
  age: number;
  exerciseIntensity: 'None' | 'Light' | 'Medium' | 'High';
  difficulty: 'Easy' | 'Normal' | 'Advanced';
  dislikedIngredients: string;
  allergies: string;
}

export interface Ingredient {
  name: string;
  confidence: number;
}

export interface Recipe {
  mealName: string;
  mainDish: string;
  sideDish: string;
  soup: string;
  stapleAmount: string;
  cookTime: string;
  nutrition: {
    energy: string;
    protein: string;
    fat: string;
    carbs: string;
  };
  nutritionistComment: string;
  shoppingList: string[];
  alternativeIngredients: string[];
  tipsForKids: string;
}

export interface RecipeHistoryItem {
  mealName: string;
  generatedAt: number;
}
