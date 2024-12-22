import React from "react";

const TailwindTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
      <div className="bg-white text-center p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Tailwind is Working!</h1>
        <p className="text-gray-600">
          This is a test component to check if Tailwind CSS has been set up correctly.
        </p>
      </div>
    </div>
  );
};

export default TailwindTest;
