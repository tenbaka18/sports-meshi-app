import React, { useState, useEffect } from 'react';
import { Profile } from '../types';

interface ProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Omit<Profile, 'id'>) => void;
  initialProfile: Profile | null;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ isOpen, onClose, onSave, initialProfile }) => {
  const [profile, setProfile] = useState({
    name: '',
    age: 10,
    exerciseIntensity: 'Medium',
    difficulty: 'Normal',
    dislikedIngredients: '',
    allergies: '',
  });

  useEffect(() => {
    if (initialProfile) {
      setProfile({
        name: initialProfile.name,
        age: initialProfile.age,
        exerciseIntensity: initialProfile.exerciseIntensity,
        difficulty: initialProfile.difficulty,
        dislikedIngredients: initialProfile.dislikedIngredients,
        allergies: initialProfile.allergies,
      });
    } else {
      setProfile({
        name: '',
        age: 10,
        exerciseIntensity: 'Medium',
        difficulty: 'Normal',
        dislikedIngredients: '',
        allergies: '',
      });
    }
  }, [initialProfile, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: name === 'age' ? parseInt(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
        alert("お子様の名前を入力してください。");
        return;
    }
    onSave(profile);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-200 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-amber-700 mb-4 border-b-2 border-amber-200 pb-2">
                <i className="fa-solid fa-user-check mr-2"></i>
                {initialProfile ? 'プロフィールの編集' : '新しいプロフィール'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">名前 <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                        placeholder="例: はなこ"
                        required
                    />
                </div>
                <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">年齢</label>
                <input
                    type="number"
                    id="age"
                    name="age"
                    value={profile.age}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    min="6"
                    max="12"
                />
                </div>
                <div>
                <label htmlFor="exerciseIntensity" className="block text-sm font-medium text-gray-700 mb-1">運動強度</label>
                <select
                    id="exerciseIntensity"
                    name="exerciseIntensity"
                    value={profile.exerciseIntensity}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                >
                    <option value="None">なし</option>
                    <option value="Light">軽め (30分程度の運動)</option>
                    <option value="Medium">中程度 (1時間程度の練習)</option>
                    <option value="High">強め (2時間以上の試合など)</option>
                </select>
                </div>
                <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">レシピの難易度</label>
                <select
                    id="difficulty"
                    name="difficulty"
                    value={profile.difficulty}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                >
                    <option value="Easy">簡単</option>
                    <option value="Normal">普通</option>
                    <option value="Advanced">上級</option>
                </select>
                </div>
                <div>
                <label htmlFor="dislikedIngredients" className="block text-sm font-medium text-gray-700 mb-1">苦手な食材</label>
                <input
                    type="text"
                    id="dislikedIngredients"
                    name="dislikedIngredients"
                    value={profile.dislikedIngredients}
                    onChange={handleChange}
                    placeholder="例: トマト ピーマン"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
                </div>
                <div className="md:col-span-2">
                <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">アレルギー (任意)</label>
                <input
                    type="text"
                    id="allergies"
                    name="allergies"
                    value={profile.allergies}
                    onChange={handleChange}
                    placeholder="例: えび そば"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">
                    キャンセル
                </button>
                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg">
                    保存する
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;