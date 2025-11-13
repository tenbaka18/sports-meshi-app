
import React from 'react';
import { Ingredient } from '../types';

interface IngredientConfirmationProps {
  ingredients: Ingredient[];
  confirmedIngredients: string[];
  setConfirmedIngredients: React.Dispatch<React.SetStateAction<string[]>>;
  onGenerate: () => void;
  isLoading: boolean;
}

const IngredientConfirmation: React.FC<IngredientConfirmationProps> = ({ ingredients, confirmedIngredients, setConfirmedIngredients, onGenerate, isLoading }) => {
  const lowConfidenceIngredients = ingredients.filter(ing => ing.confidence < 0.6);

  const handleToggleIngredient = (name: string) => {
    setConfirmedIngredients(prev => 
      prev.includes(name) ? prev.filter(ing => ing !== name) : [...prev, name]
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-200 space-y-6">
      <h2 className="text-xl font-bold text-amber-700 border-b-2 border-amber-200 pb-2">
        <i className="fa-solid fa-list-check mr-2"></i>
        食材の確認
      </h2>
      
      <div>
        <h3 className="font-semibold text-gray-800 mb-2">✅ 確定した食材リスト</h3>
        <p className="text-sm text-gray-500 mb-3">これらの食材を使ってレシピを考えます。不要なものはクリックして除外できます。</p>
        <div className="flex flex-wrap gap-2">
          {confirmedIngredients.length > 0 ? confirmedIngredients.map(name => (
            <button
              key={name}
              onClick={() => handleToggleIngredient(name)}
              className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              {name} <span className="ml-1 font-light">x</span>
            </button>
          )) : <p className="text-gray-500">確定した食材はありません。</p>}
        </div>
      </div>

      {lowConfidenceIngredients.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">🤔 もしかして、これもありませんか？</h3>
          <p className="text-sm text-gray-500 mb-3">AIが自信のない食材です。持っている場合はクリックしてリストに追加してください。</p>
          <div className="flex flex-wrap gap-2">
            {lowConfidenceIngredients.map(ing => (
                !confirmedIngredients.includes(ing.name) && (
                    <button
                        key={ing.name}
                        onClick={() => handleToggleIngredient(ing.name)}
                        className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium"
                    >
                        {ing.name} <span className="ml-1 font-light">+</span>
                    </button>
                )
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-4">
        <button
          onClick={onGenerate}
          disabled={isLoading || confirmedIngredients.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
          レシピを生成する
        </button>
      </div>
    </div>
  );
};

export default IngredientConfirmation;
