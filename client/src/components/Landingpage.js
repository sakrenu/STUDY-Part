import React from "react";

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-shift">
      {/* Header Section */}
      <div className="flex flex-col items-center justify-center py-16">
        <div className="card-neon">
          <h1 className="text-5xl font-extrabold text-neon-pink mb-4">Study-Part</h1>
          <p className="text-lg text-neon-cyan mb-8">
            Transforming how you learn and teach with advanced image segmentation.
          </p>
          <div className="flex space-x-4">
            <button className="bg-neon-pink text-white px-6 py-2 rounded-md shadow-lg hover:bg-neon-cyan">
              Login
            </button>
            <button className="bg-neon-cyan text-white px-6 py-2 rounded-md shadow-lg hover:bg-neon-pink">
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="px-8 py-16">
        <h2 className="text-4xl font-bold text-center text-neon-pink mb-8">About Study-Part</h2>
        <p className="text-center text-lg text-neon-cyan max-w-3xl mx-auto mb-16">
          Study-Part is your ultimate tool to bridge the gap between students and teachers.
          Upload images and experience seamless segmentation to enhance learning and teaching experiences.
        </p>

        {/* Students Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-neon-pink mb-4">For Students</h3>
          <p className="text-neon-cyan mb-4">
            Students can use Study-Part to annotate, organize, and learn from segmented parts of their study material.
          </p>
          <button className="bg-neon-cyan text-white px-6 py-2 rounded-md shadow-lg hover:bg-neon-pink">
            Sign Up as Student
          </button>
        </div>

        {/* Teachers Section */}
        <div>
          <h3 className="text-3xl font-bold text-neon-pink mb-4">For Teachers</h3>
          <p className="text-neon-cyan mb-4">
            Teachers can leverage Study-Part to create interactive study materials and collaborate with students effectively.
          </p>
          <button className="bg-neon-cyan text-white px-6 py-2 rounded-md shadow-lg hover:bg-neon-pink">
            Sign Up as Teacher
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
