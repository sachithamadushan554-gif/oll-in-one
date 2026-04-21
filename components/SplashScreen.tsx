import React from 'react';

const Logo = () => (
    <div className="flex-shrink-0 bg-indigo-600 p-3 rounded-2xl shadow-2xl shadow-indigo-500/40">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
            <path d="M16 3.535C14.012 2.553 11.636 2 9 2C5.134 2 2 5.134 2 9C2 12.153 3.963 14.881 6.75 15.688M8 20.465C9.988 21.447 12.364 22 15 22C18.866 22 22 18.866 22 15C22 11.847 20.037 9.119 17.25 8.312" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </div>
);


const SplashScreen: React.FC = () => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning!";
    } else if (hour < 18) {
      return "Good afternoon!";
    } else {
      return "Good evening!";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-100 dark:bg-stone-950 z-[100] subtle-bg animate-fade-in">
      <div className="text-center space-y-4">
        <div className="flex justify-center animate-logo-pop-in" style={{ animationDelay: '0.1s' }}>
            <Logo />
        </div>
        <h1 
          className="text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-wider animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          MW all in one billing system
        </h1>
        <p 
          className="text-stone-500 dark:text-stone-400 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          {getGreeting()}
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;