import React, { useState, useCallback, useEffect } from 'react';
import { Profile, Ingredient, Recipe, RecipeHistoryItem } from './types';
import { analyzeIngredients, generateRecipe } from './services/geminiService';
import Header from './components/Header';
import ProfileForm from './components/ProfileForm';
import IngredientInput from './components/IngredientInput';
import IngredientConfirmation from './components/IngredientConfirmation';
import RecipeCard from './components/RecipeCard';
import { Spinner, ErrorDisplay } from './components/common';

const PROFILES_STORAGE_KEY = 'supomeshi_profiles';
const RECIPE_HISTORY_STORAGE_KEY = 'supomeshi_recipe_history';

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [confirmedIngredients, setConfirmedIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeHistory, setRecipeHistory] = useState<RecipeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'confirmation' | 'result'>('input');

  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (savedProfiles) {
        setProfiles(JSON.parse(savedProfiles));
      }
      const savedHistory = localStorage.getItem(RECIPE_HISTORY_STORAGE_KEY);
      if (savedHistory) {
        // Filter out history older than 30 days upon loading
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        setRecipeHistory(JSON.parse(savedHistory).filter((item: RecipeHistoryItem) => item.generatedAt > oneMonthAgo));
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error("Failed to save profiles to localStorage", e);
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem(RECIPE_HISTORY_STORAGE_KEY, JSON.stringify(recipeHistory));
    } catch (e) {
      console.error("Failed to save recipe history to localStorage", e);
    }
  }, [recipeHistory]);
  
  const updateRecipeHistory = (newRecipe: Recipe) => {
    const newHistoryItem: RecipeHistoryItem = {
        mealName: newRecipe.mealName,
        generatedAt: Date.now(),
    };
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const updatedHistory = [...recipeHistory, newHistoryItem].filter(
        item => item.generatedAt > oneMonthAgo
    );
    setRecipeHistory(updatedHistory);
  };

  const handleAddNewProfile = () => {
    setEditingProfile(null);
    setIsProfileFormOpen(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setIsProfileFormOpen(true);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (window.confirm("このプロフィールを削除してもよろしいですか？")) {
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      setSelectedProfileIds(prev => prev.filter(id => id !== profileId));
    }
  };

  const handleSaveProfile = (profileToSave: Omit<Profile, 'id'>) => {
    if (editingProfile) {
      setProfiles(prev => prev.map(p => p.id === editingProfile.id ? { ...p, ...profileToSave } : p));
    } else {
      const newProfile: Profile = { ...profileToSave, id: Date.now().toString() };
      setProfiles(prev => [...prev, newProfile]);
    }
    setIsProfileFormOpen(false);
    setEditingProfile(null);
  };

  const handleToggleProfileSelection = (profileId: string) => {
    setSelectedProfileIds(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleAnalyzeIngredients = async (imageFiles: File[], manualIngredients: string) => {
    if (imageFiles.length === 0 && manualIngredients.trim() === '') {
      setError('画像またはテキストで食材を入力してください。');
      return;
    }
     if (selectedProfileIds.length === 0) {
      setError('レシピを提案するお子様を1人以上選択してください。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecipe(null);

    try {
      let imageAnalysisResult: Ingredient[] = [];
      if (imageFiles.length > 0) {
        imageAnalysisResult = await analyzeIngredients(imageFiles);
      }
      
      const manualIngredientList = manualIngredients
        .split(/\s+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(name => ({ name, confidence: 1.0 }));

      const combinedIngredients = [...manualIngredientList, ...imageAnalysisResult];

      const ingredientMap = new Map<string, Ingredient>();
      combinedIngredients.forEach(ing => {
          if (!ingredientMap.has(ing.name) || ingredientMap.get(ing.name)!.confidence < ing.confidence) {
              ingredientMap.set(ing.name, ing);
          }
      });
      const uniqueIngredients = Array.from(ingredientMap.values()).sort((a, b) => b.confidence - a.confidence);
      
      setIngredients(uniqueIngredients);
      
      const highConfidenceIngredients = uniqueIngredients
        .filter(ing => ing.confidence >= 0.6)
        .map(ing => ing.name);
      setConfirmedIngredients(highConfidenceIngredients);

      setStep('confirmation');
    } catch (err) {
      console.error(err);
      setError('食材の解析中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateRecipe = async () => {
    const selectedProfiles = profiles.filter(p => selectedProfileIds.includes(p.id));
    if (selectedProfiles.length === 0) {
      setError('レシピを生成するためのお子様が選択されていません。');
      return;
    }
    if (confirmedIngredients.length === 0) {
      setError('レシピを生成するための食材がありません。');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setRecipe(null);

    try {
        const disliked = [...new Set(selectedProfiles.flatMap(p => p.dislikedIngredients.split(/\s+/).map(s => s.trim()).filter(Boolean)))];
        const allergies = [...new Set(selectedProfiles.flatMap(p => p.allergies.split(/\s+/).map(s => s.trim()).filter(Boolean)))];
        const exclusions = [...new Set([...disliked, ...allergies])];

        const finalIngredients = confirmedIngredients.filter(ing => !exclusions.includes(ing));

        if (finalIngredients.length === 0) {
            setError('苦手・アレルギー食材を除いた結果、使用できる食材がなくなりました。');
            setIsLoading(false);
            return;
        }
        
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentRecipes = recipeHistory
            .filter(item => item.generatedAt > oneMonthAgo)
            .map(item => item.mealName);

        const generatedRecipe = await generateRecipe(selectedProfiles, finalIngredients, recentRecipes);
        setRecipe(generatedRecipe);
        updateRecipeHistory(generatedRecipe);
        setStep('result');
    } catch (err) {
        console.error(err);
        setError('レシピの生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateOmakaseRecipe = async () => {
    setIsLoading(true);
    setError(null);
    setRecipe(null);

    try {
        const selectedProfiles = profiles.filter(p => selectedProfileIds.includes(p.id));
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentRecipes = recipeHistory
            .filter(item => item.generatedAt > oneMonthAgo)
            .map(item => item.mealName);
        
        const generatedRecipe = await generateRecipe(selectedProfiles, [], recentRecipes);
        setRecipe(generatedRecipe);
        updateRecipeHistory(generatedRecipe);
        setStep('result');
    } catch (err) {
        console.error(err);
        setError('おまかせレシピの生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setIngredients([]);
    setConfirmedIngredients([]);
    setRecipe(null);
    setError(null);
    setSelectedProfileIds([]);
    setStep('input');
  };

  const renderProfileManagement = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-200 space-y-6">
       <div className="flex justify-between items-center border-b-2 border-amber-200 pb-2">
         <h2 className="text-xl font-bold text-amber-700">
           <i className="fa-solid fa-users mr-2"></i>
           お子様のプロフィール
         </h2>
         <button onClick={handleAddNewProfile} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-full text-sm transition-colors">
            <i className="fa-solid fa-plus mr-2"></i>新規追加
         </button>
       </div>

      {profiles.length > 0 ? (
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 mb-2">今日の献立の対象者を選択してください <span className="text-sm text-gray-500">(任意)</span></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profiles.map(profile => (
              <div key={profile.id} className={`p-4 rounded-lg border-2 transition-all ${selectedProfileIds.includes(profile.id) ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProfileIds.includes(profile.id)}
                    onChange={() => handleToggleProfileSelection(profile.id)}
                    className="mt-1 h-5 w-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{profile.name}</p>
                    <p className="text-sm text-gray-500">{profile.age}歳 / 運動: {profile.exerciseIntensity}</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button onClick={(e) => { e.preventDefault(); handleEditProfile(profile); }} className="text-gray-400 hover:text-blue-500"><i className="fa-solid fa-pencil"></i></button>
                    <button onClick={(e) => { e.preventDefault(); handleDeleteProfile(profile.id); }} className="text-gray-400 hover:text-red-500"><i className="fa-solid fa-trash"></i></button>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">まだプロフィールが登録されていません。</p>
          <p className="text-gray-500">「新規追加」ボタンからお子様の情報を登録してください。</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-amber-50 font-sans text-gray-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="space-y-8">
          {isProfileFormOpen && (
             <ProfileForm 
                isOpen={isProfileFormOpen}
                onClose={() => setIsProfileFormOpen(false)}
                onSave={handleSaveProfile}
                initialProfile={editingProfile}
             />
          )}

          {(step === 'input' || step === 'confirmation') && renderProfileManagement()}
          
          {step === 'input' && (
            <IngredientInput onAnalyze={handleAnalyzeIngredients} onGenerateOmakase={handleGenerateOmakaseRecipe} isLoading={isLoading} />
          )}

          {step === 'confirmation' && (
             <IngredientConfirmation 
                ingredients={ingredients}
                confirmedIngredients={confirmedIngredients}
                setConfirmedIngredients={setConfirmedIngredients}
                onGenerate={handleGenerateRecipe}
                isLoading={isLoading}
             />
          )}

          {isLoading && <Spinner />}

          {error && <ErrorDisplay message={error} />}

          {step === 'result' && recipe && (
            <div>
                <RecipeCard recipe={recipe} />
                <div className="text-center mt-8">
                    <button
                        onClick={handleRestart}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        <i className="fa-solid fa-rotate-right mr-2"></i>
                        もう一度試す
                    </button>
                </div>
            </div>
          )}
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>&copy; 2024 スポめしコーチ. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;