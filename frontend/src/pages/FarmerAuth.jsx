import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authService, getErrorMessage } from '../services/api';
import {
  Tractor,
  ArrowLeft,
  ShieldCheck,
  Lock,
  User,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Sprout,
  Leaf,
  TrendingUp,
} from 'lucide-react';

const FarmerAuth = () => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Username check
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [usernameMessage, setUsernameMessage] = useState('');
  const debounceRef = useRef(null);

  const { login, registerFarmer } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  // Debounced username check
  const checkUsername = useCallback(
    (value) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const cleaned = value.trim().toLowerCase();
      if (!cleaned) {
        setUsernameStatus(null);
        setUsernameMessage('');
        return;
      }
      if (cleaned.length < 3) {
        setUsernameStatus('invalid');
        setUsernameMessage(t('usernameMinLength'));
        return;
      }
      if (!/^[a-z0-9_]+$/.test(cleaned)) {
        setUsernameStatus('invalid');
        setUsernameMessage(t('usernameInvalidChars'));
        return;
      }

      setUsernameStatus('checking');
      setUsernameMessage('');

      debounceRef.current = setTimeout(async () => {
        try {
          const result = await authService.checkUsername(cleaned);
          if (result.available) {
            setUsernameStatus('available');
            setUsernameMessage(t('usernameAvailable'));
          } else {
            setUsernameStatus('taken');
            setUsernameMessage(t('usernameTaken'));
          }
        } catch {
          setUsernameStatus(null);
          setUsernameMessage('');
        }
      }, 500);
    },
    [t]
  );

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(val);
    if (!isLoginTab) {
      checkUsername(val);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError(t('errorRequired'));
      return;
    }
    if (!password) {
      setError(t('errorRequired'));
      return;
    }

    setLoading(true);
    try {
      await login(username.trim().toLowerCase(), password, 'FARMER');
      navigate('/farmer/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, t('errorLoginFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !name.trim() || !address.trim() || !city.trim() || !password) {
      setError(t('errorRequired'));
      return;
    }
    if (username.trim().length < 3) {
      setError(t('usernameMinLength'));
      return;
    }
    if (password.length < 6) {
      setError(t('errorPasswordLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('errorPasswordMatch'));
      return;
    }
    if (usernameStatus === 'taken') {
      setError(t('usernameTaken'));
      return;
    }

    setLoading(true);
    try {
      await registerFarmer({
        username: username.trim().toLowerCase(),
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        password,
        confirm_password: confirmPassword,
      });

      // Auto login after successful registration
      await login(username.trim().toLowerCase(), password, 'FARMER');
      navigate('/farmer/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, t('errorGeneric')));
    } finally {
      setLoading(false);
    }
  };

  // Password match status
  const getPasswordMatchStatus = () => {
    if (!confirmPassword) return null;
    return password === confirmPassword ? 'match' : 'mismatch';
  };
  const pwMatchStatus = getPasswordMatchStatus();

  return (
    <div className="auth-landscape-wrapper">
      <button
        type="button"
        className="auth-back-btn"
        onClick={() => navigate('/')}
        id="back-home-btn"
      >
        <ArrowLeft size={16} />
        <span>{t('backToHome')}</span>
      </button>

      <div className="auth-landscape-card">
        {/* LEFT: Brand Panel */}
        <div className="auth-brand-panel farmer-brand">
          <div className="auth-brand-content">
            <div className="auth-brand-icon-wrap">
              <Sprout size={36} />
            </div>
            <h2 className="auth-brand-heading">{t('authBrandHeading')}</h2>
            <p className="auth-brand-tagline">{t('authBrandTagline')}</p>

            <div className="auth-brand-features">
              <div className="auth-brand-feature">
                <Leaf size={18} />
                <span>{t('authBrandFeature1')}</span>
              </div>
              <div className="auth-brand-feature">
                <TrendingUp size={18} />
                <span>{t('authBrandFeature2')}</span>
              </div>
              <div className="auth-brand-feature">
                <ShieldCheck size={18} />
                <span>{t('authBrandFeature3')}</span>
              </div>
            </div>

            <div className="auth-brand-role-badge farmer-badge-lg">
              <Tractor size={18} />
              <span>{t('roleFarmer')}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-form-topbar">
            <div className="auth-role-tag farmer">
              <Tractor size={14} style={{ display: 'inline', marginRight: 4 }} />
              {t('roleFarmer')}
            </div>
            <div className="language-selector">
              <button
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                className={`lang-btn ${language === 'ta' ? 'active' : ''}`}
                onClick={() => setLanguage('ta')}
              >
                தமிழ்
              </button>
            </div>
          </div>

          <h1 className="auth-title">{t('farmerAuthTitle')}</h1>
          <p className="auth-subtitle">{t('farmerAuthSubtitle')}</p>

          {/* Tab switcher */}
          <div className="tabs-switch" role="tablist">
            <button
              type="button"
              className={`tab-btn ${isLoginTab ? 'active' : ''}`}
              onClick={() => { setIsLoginTab(true); setError(''); }}
              id="tab-farmer-login"
            >
              {t('loginTab')}
            </button>
            <button
              type="button"
              className={`tab-btn ${!isLoginTab ? 'active' : ''}`}
              onClick={() => { setIsLoginTab(false); setError(''); }}
              id="tab-farmer-register"
            >
              {t('registerTab')}
            </button>
          </div>

          {error && <div className="error-banner" id="auth-error-msg">{error}</div>}

          {isLoginTab ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} id="farmer-login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="farmer-login-username">
                  {t('username')}
                </label>
                <div className="input-icon-wrap">
                  <User size={16} className="input-icon-left" />
                  <input
                    id="farmer-login-username"
                    type="text"
                    className="form-input input-with-icon"
                    placeholder={t('usernamePlaceholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="farmer-login-password">
                  {t('password')}
                </label>
                <div className="input-icon-wrap">
                  <Lock size={16} className="input-icon-left" />
                  <input
                    id="farmer-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    className="form-input input-with-icon input-with-eye"
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="eye-toggle-btn"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                id="farmer-login-submit"
                disabled={loading}
              >
                {loading ? t('loading') : t('loginBtn')}
              </button>

              <p className="auth-switch-link" onClick={() => { setIsLoginTab(false); setError(''); }}>
                {t('dontHaveAccount')}
              </p>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} id="farmer-register-form">
              <div className="notice-banner">
                <ShieldCheck size={18} />
                <span>{t('noEmailNoAadhaarNotice')}</span>
              </div>

              <div className="auth-form-grid">
                {/* Username - full width */}
                <div className="form-group auth-form-full">
                  <label className="form-label" htmlFor="farmer-reg-username">
                    {t('username')}
                  </label>
                  <div className="input-icon-wrap">
                    <User size={16} className="input-icon-left" />
                    <input
                      id="farmer-reg-username"
                      type="text"
                      className={`form-input input-with-icon input-with-eye ${
                        usernameStatus === 'available' ? 'input-success' :
                        usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'input-error' : ''
                      }`}
                      placeholder={t('usernamePlaceholder')}
                      value={username}
                      onChange={handleUsernameChange}
                      autoComplete="username"
                      required
                    />
                    {usernameStatus === 'available' && (
                      <CheckCircle size={18} className="input-status-icon input-status-success" />
                    )}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                      <XCircle size={18} className="input-status-icon input-status-error" />
                    )}
                  </div>
                  {usernameMessage && (
                    <div className={`field-feedback ${usernameStatus === 'available' ? 'feedback-success' : 'feedback-error'}`}>
                      {usernameMessage}
                    </div>
                  )}
                </div>

                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="farmer-reg-name">
                    {t('name')}
                  </label>
                  <input
                    id="farmer-reg-name"
                    type="text"
                    className="form-input"
                    placeholder={t('namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* City */}
                <div className="form-group">
                  <label className="form-label" htmlFor="farmer-reg-city">
                    {t('city')}
                  </label>
                  <input
                    id="farmer-reg-city"
                    type="text"
                    className="form-input"
                    placeholder={t('cityPlaceholder')}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                {/* Address - full width */}
                <div className="form-group auth-form-full">
                  <label className="form-label" htmlFor="farmer-reg-address">
                    {t('address')}
                  </label>
                  <input
                    id="farmer-reg-address"
                    type="text"
                    className="form-input"
                    placeholder={t('addressPlaceholder')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="farmer-reg-password">
                    {t('password')}
                  </label>
                  <div className="input-icon-wrap">
                    <Lock size={16} className="input-icon-left" />
                    <input
                      id="farmer-reg-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input input-with-icon input-with-eye"
                      placeholder={t('passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="eye-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="form-help">{t('passwordRequirement')}</div>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="farmer-reg-confirm-password">
                    {t('confirmPassword')}
                  </label>
                  <div className="input-icon-wrap">
                    <Lock size={16} className="input-icon-left" />
                    <input
                      id="farmer-reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`form-input input-with-icon input-with-eye ${
                        pwMatchStatus === 'match' ? 'input-success' :
                        pwMatchStatus === 'mismatch' ? 'input-error' : ''
                      }`}
                      placeholder={t('confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="eye-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {pwMatchStatus === 'match' && (
                    <div className="field-feedback feedback-success">
                      <CheckCircle size={14} /> {t('passwordsMatch')}
                    </div>
                  )}
                  {pwMatchStatus === 'mismatch' && (
                    <div className="field-feedback feedback-error">
                      <XCircle size={14} /> {t('passwordsDoNotMatch')}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                id="farmer-reg-submit"
                disabled={loading || usernameStatus === 'taken'}
                style={{ marginTop: '0.5rem' }}
              >
                {loading ? t('loading') : t('registerBtn')}
              </button>

              <p className="auth-switch-link" onClick={() => { setIsLoginTab(true); setError(''); }}>
                {t('alreadyHaveAccount')}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerAuth;
