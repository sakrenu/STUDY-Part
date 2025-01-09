// client/src/styles/theme.js
module.exports = {
    theme: {
      extend: {
        colors: {
          background: {
            dark: '#1E1E2C', // Primary dark navy background
            darker: '#2C2C54', // Secondary background
          },
          gradient: {
            start: '#4A90E2', // Cool blue
            end: '#D774E4', // Purple/pink hues
          },
          text: {
            light: '#FFFFFF', // White for main text
            gray: '#D3D3D3', // Light-gray for secondary text
          },
          accent: {
            yellow: '#FFD700', // Warm yellow for highlights
            orange: '#FFA500', // Warm orange for accents
          },
        },
        backgroundImage: {
          gradient: 'linear-gradient(90deg, #4A90E2, #D774E4)', // Gradient for backgrounds or buttons
        },
        boxShadow: {
          neonBlue: '0 0 10px #4A90E2, 0 0 20px #4A90E2, 0 0 30px #4A90E2', // Neon glow for blue
          neonPurple: '0 0 10px #D774E4, 0 0 20px #D774E4, 0 0 30px #D774E4', // Neon glow for purple
        },
        textShadow: {
          neon: '0 0 5px #FFFFFF, 0 0 10px #4A90E2, 0 0 20px #D774E4', // Neon text shadow effect
        },
      },
    },
    plugins: [
      require('tailwindcss-textshadow'), // Add text-shadow plugin for neon text effects
    ],
  };
  

  