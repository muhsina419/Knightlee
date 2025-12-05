// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider, useAuth } from "./context/AuthContext";
// import "mapbox-gl/dist/mapbox-gl.css";
// import KnightleeLanding from "./components/KnightleeMap"; 

// // Pages / Components
// import HomeLanding from "./pages/Landing"; 
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import Home from "./pages/Home";
// import KnightleeMap from "./components/KnightleeMap";

// // 🔒 Protected Route Wrapper
// const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { isAuthenticated, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         Loading...
//       </div>
//     );
//   }

//   return isAuthenticated ? children : <Navigate to="/login" replace />;
// };

// const AppRoutes = () => {
//   const { isAuthenticated, logout } = useAuth();

//   return (
//     <Routes>
//       {/* ⭐ Default page (Landing) */}
//       <Route
//         path="/"
//         element={<HomeLanding />}
//       />

//       {/* Auth pages */}
//       <Route
//         path="/login"
//         // element={!isAuthenticated ? <Login /> : <Navigate to="/home" replace />}
//         element={<Login/>}
//       />
//       <Route
//         path="/signup"
//         element={<Signup/>}
//         // element={!isAuthenticated ? <Signup /> : <Navigate to="/home" replace />}
//       />

//       {/* Home + KnightleeMap after login */}
//       {/* <Route
//         path="/home"
//         element={
//           <ProtectedRoute>
//             <Home />
//             <KnightleeMap onLogout={logout} />
//           </ProtectedRoute>
//         }
//       /> */}
//       <Route
//   path="/home"
//   element={
//     <ProtectedRoute>
//       <Home />
//     </ProtectedRoute>
//   }
// />

// <Route
//   path="/map"
//   element={
//     <ProtectedRoute>
//       <KnightleeMap onLogout={logout} />
//     </ProtectedRoute>
//   }
// />


//       {/* 404 fallback */}
//       <Route
//         path="*"
//         element={
//           <h1 className="text-center pt-10 text-xl">
//             404 — Page Not Found
//           </h1>
//         }
//       />
//     </Routes>
//   );
// };

// // 🌍 Main App Wrapper
// export default function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <AppRoutes />
//       </Router>
//     </AuthProvider>
//   );
// }
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "mapbox-gl/dist/mapbox-gl.css";

// Components / Pages
import HomeLanding from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import KnightleeMap from "./components/KnightleeMap";
import CrimeHeatmap from "./components/crimeHeatmap"; // ⬅️ your heatmap component

// 🔒 Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <Routes>
      {/* ⭐ Default page (Landing) */}
      <Route path="/" element={<HomeLanding />} />

      {/* Auth pages */}
      <Route
        path="/login"
        // element={!isAuthenticated ? <Login /> : <Navigate to="/home" replace />}
        element={<Login />}
      />
      <Route
        path="/signup"
        element={<Signup />}
        // element={!isAuthenticated ? <Signup /> : <Navigate to="/home" replace />}
      />

      {/* Home after login */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      {/* Knightlee map page */}
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <KnightleeMap onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* 🔥 New Crime Heatmap route */}
      <Route
        path="/heatmap"
        element={
          <ProtectedRoute>
            <div className="w-full h-full">
              <h1 className="text-xl font-bold px-4 pt-4">Crime Heatmap</h1>
              <CrimeHeatmap />
            </div>
          </ProtectedRoute>
        }
      />

      {/* 404 fallback */}
      <Route
        path="*"
        element={
          <h1 className="text-center pt-10 text-xl">
            404 — Page Not Found
          </h1>
        }
      />
    </Routes>
  );
};

// 🌍 Main App Wrapper
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
