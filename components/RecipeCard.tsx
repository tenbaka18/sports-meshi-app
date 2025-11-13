
import React from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-amber-300 animate-fade-in">
      <div className="p-6 bg-amber-500 text-white">
        <h2 className="text-3xl font-extrabold text-center">{recipe.mealName}</h2>
        <div className="flex justify-center items-center gap-4 mt-2 text-amber-100">
            <span><i className="fa-solid fa-clock mr-1"></i> {recipe.cookTime}</span>
            <span><i className="fa-solid fa-fire-burner mr-1"></i> {recipe.nutrition.energy}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Nutritionist Comment */}
        <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
          <h3 className="text-lg font-bold text-amber-800 mb-2">
            <i className="fa-solid fa-user-doctor mr-2"></i>
            管理栄養士のコメント
          </h3>
          <p className="text-gray-700 leading-relaxed">{recipe.nutritionistComment}</p>
        </div>

        {/* Menu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-rose-100 p-3 rounded-lg">
                <p className="font-bold text-rose-800">主菜</p>
                <p className="text-lg">{recipe.mainDish}</p>
            </div>
            <div className="bg-teal-100 p-3 rounded-lg">
                <p className="font-bold text-teal-800">副菜</p>
                <p className="text-lg">{recipe.sideDish}</p>
            </div>
            <div className="bg-sky-100 p-3 rounded-lg">
                <p className="font-bold text-sky-800">汁物</p>
                <p className="text-lg">{recipe.soup}</p>
            </div>
        </div>
         <div className="bg-yellow-100 p-3 rounded-lg text-center">
                <p className="font-bold text-yellow-800">主食の量</p>
                <p className="text-lg"><i className="fa-solid fa-hand-paper mr-2"></i>{recipe.stapleAmount}</p>
         </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-4">
              {/* Shopping List */}
              <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-bold mb-2"><i className="fa-solid fa-cart-shopping mr-2 text-gray-500"></i>買い足し食材</h4>
                  {recipe.shoppingList.length > 0 ? (
                      <ul className="list-disc list-inside text-gray-600">
                          {recipe.shoppingList.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                  ) : <p className="text-gray-600">買い足すものはありません！</p>}
              </div>
              {/* Alternatives */}
              <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-bold mb-2"><i className="fa-solid fa-right-left mr-2 text-gray-500"></i>代替できる食材</h4>
                  <ul className="list-disc list-inside text-gray-600">
                      {recipe.alternativeIngredients.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
              </div>
          </div>
          <div className="space-y-4">
            {/* Tips for kids */}
            <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold mb-2"><i className="fa-solid fa-child-reaching mr-2 text-gray-500"></i>食べやすくする工夫</h4>
                <p className="text-gray-600">{recipe.tipsForKids}</p>
            </div>
            {/* Nutrition Details */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-bold mb-2"><i className="fa-solid fa-chart-pie mr-2 text-gray-500"></i>PFCバランス</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                  <li>たんぱく質: {recipe.nutrition.protein}</li>
                  <li>脂質: {recipe.nutrition.fat}</li>
                  <li>炭水化物: {recipe.nutrition.carbs}</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 pt-4">* 栄養価は概算です。お子様の活動量や体調に合わせて調整してください。</p>
      </div>
    </div>
  );
};

export default RecipeCard;
