import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Sprout, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-navbar">
      <Link to="/" className="brand-container" id="nav-brand-link">
        <div className="brand-icon">
          <Sprout size={24} />
        </div>
        <div>
          <span className="brand-title">{t('brandName')}</span>
        </div>
      </Link>

      <div className="nav-actions">
        {/* Language selector: visible immediately on all screens */}
        <div className="language-selector" id="language-switcher">
          <button
            type="button"
            className={`lang-btn ${language === 'ta' ? 'active' : ''}`}
            onClick={() => setLanguage('ta')}
            id="lang-btn-tamil"
          >
            தமிழ்
          </button>
          <button
            type="button"
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
            id="lang-btn-english"
          >
            English
          </button>
        </div>

        {/* Authenticated user status */}
        {isAuthenticated && user && (
          <>
            <div className="user-badge" id="user-badge-info">
              <User size={16} />
              <span>{user.name}</span>
              <span className={`user-badge-role ${role?.toLowerCase()}`}>
                {role === 'FARMER' ? t('roleFarmer') : t('roleBuyer')}
              </span>
            </div>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
              id="logout-button"
            >
              <LogOut size={16} />
              <span>{t('logout')}</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
