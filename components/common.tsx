
import React from 'react';

export const Spinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500"></div>
    <p className="ml-4 text-gray-600">AIが考えています...</p>
  </div>
);

interface ErrorDisplayProps {
  message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => (
  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
    <p className="font-bold">エラーが発生しました</p>
    <p>{message}</p>
  </div>
);
