import React from 'react';

const Loader = ({ size = 'md', text = 'Loading...' }) => {
  const sizeMap = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-3">
      <div className={`animate-spin rounded-full border-blue-600 border-t-transparent ${sizeMap[size]}`} />
      {text && (
        <span className="text-sm font-medium text-gray-500 dark:text-slate-400 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};

export const ScreenLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/70 dark:bg-slate-900/70 backdrop-blur-xs">
    <Loader size="lg" text="Initialising Genessence Portal..." />
  </div>
);

export default Loader;
