// // import logo from './logo.svg';
// // import './App.css';

// // function App() {
// //   return (
// //     <div className="App">
// //       <header className="App-header">
// //         <img src={logo} className="App-logo" alt="logo" />
// //         <p>
// //           Edit <code>src/App.js</code> and save to reload.
// //         </p>
// //         <a
// //           className="App-link"
// //           href="https://reactjs.org"
// //           target="_blank"
// //           rel="noopener noreferrer"
// //         >
// //           Learn React
// //         </a>
// //       </header>
// //     </div>
// //   );
// // }

// // export default App;

// // import React, { useEffect, useState } from 'react';
// // import axios from 'axios';

// // function App() {
// //     const [message, setMessage] = useState('');

// //     useEffect(() => {
// //         axios.get('http://127.0.0.1:5000/')
// //             .then(response => setMessage(response.data.message))
// //             .catch(error => console.error(error));
// //     }, []);

// //     return (
// //         <div>
// //             <h1>Study-Part</h1>
// //             <p>{message}</p>
// //         </div>
// //     );
// // }

// // export default App;
// import React, { useEffect, useState } from "react";
// import axios from "axios";

// function App() {
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     axios
//       .get("http://127.0.0.1:5000/")
//       .then((response) => setMessage(response.data.message))
//       .catch((error) => console.error(error));
//   }, []);

//   return (
//     <div className="min-h-screen bg-gradient-shift flex items-center justify-center">
//       <div className="card-neon">
//         <h1 className="text-5xl font-extrabold text-neon-pink mb-4">
//           Study-Part
//         </h1>
//         <p className="text-lg text-neon-cyan">
//           {message || "Loading message from backend..."}
//         </p>
//       </div>
//     </div>
//   );
// }

// export default App;
import React, { useEffect, useState } from "react";
import axios from "axios";
import LandingPage from "./components/Landingpage";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/")
      .then((response) => setMessage(response.data.message))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-shift">
      {/* Render the Landing Page */}
      <LandingPage />
    </div>
  );
}

export default App;
