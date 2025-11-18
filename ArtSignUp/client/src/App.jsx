import React, { useState } from "react";
import ArtScapeSignUp from "./pages/SignUpPage";
import ArtistLogin from "./pages/LogInPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState('login'); // 'login' or 'signup'

  return (
    <div>
      {currentPage === 'login' ? (
        <ArtistLogin onNavigateToSignup={() => setCurrentPage('signup')} />
      ) : (
        <ArtScapeSignUp onNavigateToLogin={() => setCurrentPage('login')} />
      )}
    </div>
  );
}