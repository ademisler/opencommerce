import React from 'react';

const Loader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex items-center justify-center ${className ?? ''}`}>
    <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default Loader;
