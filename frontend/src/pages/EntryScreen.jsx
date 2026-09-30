import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Tractor, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';

const EntryScreen = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <main className="entry-container">
      {/* Center Welcome Header */}
      <section className="entry-header">
        <h1 className="entry-title" id="welcome-title">{t('welcomeTitle')}</h1>
        <p className="entry-subtitle">{t('welcomeSubtitle')}</p>
      </section>

      {/* Two Large Attractive Cards: FARMER and BUYER */}
      <section className="entry-cards-grid" aria-label="Choose your role">
        {/* FARMER CARD */}
        <article className="entry-card farmer-card" id="farmer-module-card">
          <div className="entry-card-icon-wrapper">
            <Tractor size={40} />
          </div>

          <h2 className="entry-card-title">{t('farmerCardTitle')}</h2>

          <ul className="entry-card-features">
            <li>
              <CheckCircle2 size={18} color="var(--primary)" />
              <span>{t('farmerCardDesc1')}</span>
            </li>
            <li>
              <CheckCircle2 size={18} color="var(--primary)" />
              <span>{t('farmerCardDesc2')}</span>
            </li>
            <li>
              <CheckCircle2 size={18} color="var(--primary)" />
              <span>{t('farmerCardDesc3')}</span>
            </li>
          </ul>

          <button
            type="button"
            className="entry-card-btn"
            id="continue-farmer-btn"
            onClick={() => navigate('/farmer/auth')}
          >
            <span>{t('continueAsFarmer')}</span>
            <ArrowRight size={20} />
          </button>
        </article>

        {/* BUYER CARD */}
        <article className="entry-card buyer-card" id="buyer-module-card">
          <div className="entry-card-icon-wrapper">
            <ShoppingBag size={40} />
          </div>

          <h2 className="entry-card-title">{t('buyerCardTitle')}</h2>

          <ul className="entry-card-features">
            <li>
              <CheckCircle2 size={18} color="var(--accent-buyer)" />
              <span>{t('buyerCardDesc1')}</span>
            </li>
            <li>
              <CheckCircle2 size={18} color="var(--accent-buyer)" />
              <span>{t('buyerCardDesc2')}</span>
            </li>
            <li>
              <CheckCircle2 size={18} color="var(--accent-buyer)" />
              <span>{t('buyerCardDesc3')}</span>
            </li>
          </ul>

          <button
            type="button"
            className="entry-card-btn"
            id="continue-buyer-btn"
            onClick={() => navigate('/buyer/auth')}
          >
            <span>{t('continueAsBuyer')}</span>
            <ArrowRight size={20} />
          </button>
        </article>
      </section>
    </main>
  );
};

export default EntryScreen;
