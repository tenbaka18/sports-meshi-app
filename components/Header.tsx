import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-amber-600">
          <i className="fa-solid fa-utensils mr-3"></i>
          スポめしコーチ
        </h1>
        <p className="text-gray-600 mt-2">
          音声と写真でラクラク食材入力！成長期アスリートキッズのための栄養満点レシピを提案します。
        </p>
      </div>
    </header>
  );
};

export default Header;