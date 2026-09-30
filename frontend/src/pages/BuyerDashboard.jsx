import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  cropService,
  requirementService,
  matchingService,
  orderService,
  getErrorMessage,
} from '../services/api';
import { COMMON_CROPS } from '../i18n/translations';
import {
  Search,
  PlusCircle,
  ListFilter,
  Sparkles,
  ShoppingBag,
  User,
  Users,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const { t, getCropName } = useLanguage();

  // Active tab
  const [activeTab, setActiveTab] = useState('find-crops'); // 'find-crops' | 'post-req' | 'my-reqs' | 'matches' | 'orders' | 'profile'

  // Loading & Notifications
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // 1. Browse Active Crops
  const [activeCrops, setActiveCrops] = useState([]);
  const [selectedCropFilter, setSelectedCropFilter] = useState('');

  // 2. Post Requirement Form
  const [reqCrop, setReqCrop] = useState('Tomato');
  const [reqQty, setReqQty] = useState('');
  const [reqDate, setReqDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [reqPrice, setReqPrice] = useState('');
  const [reqQuality, setReqQuality] = useState('');
  const [reqCity, setReqCity] = useState(user?.city || 'Salem');

  // 3. My Requirements & Matches
  const [myRequirements, setMyRequirements] = useState([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // 4. Orders
  const [myOrders, setMyOrders] = useState([]);

  // Direct Order Modal state
  const [orderingCrop, setOrderingCrop] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  useEffect(() => {
    if (activeTab === 'find-crops') loadActiveCrops();
    if (activeTab === 'my-reqs' || activeTab === 'matches') loadMyRequirements();
    if (activeTab === 'orders') loadMyOrders();
    if (activeTab === 'profile') {
      loadMyRequirements();
      loadMyOrders();
    }
  }, [activeTab]);

  const loadActiveCrops = async () => {
    setLoading(true);
    try {
      const data = await cropService.getActiveCrops();
      setActiveCrops(data);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMyRequirements = async () => {
    setLoading(true);
    try {
      const data = await requirementService.getMyRequirements();
      setMyRequirements(data);
      if (data.length > 0 && !selectedRequirementId) {
        setSelectedRequirementId(data[0].id);
        fetchMatchesForRequirement(data[0].id);
      }
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMyOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getBuyerOrders();
      setMyOrders(data);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchesForRequirement = async (reqId) => {
    setSelectedRequirementId(reqId);
    setMatchingLoading(true);
    try {
      const result = await matchingService.getMatches(reqId);
      setMatchResult(result);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setMatchingLoading(false);
    }
  };

  // Submit Post Requirement
  const handlePostRequirementSubmit = async (e) => {
    e.preventDefault();
    if (!reqQty || Number(reqQty) <= 0 || !reqPrice || Number(reqPrice) <= 0) {
      showNotification(t('errorRequired'), 'error');
      return;
    }

    setLoading(true);
    try {
      const newReq = await requirementService.createRequirement({
        crop_name: reqCrop,
        quantity_kg: parseFloat(reqQty),
        required_date: reqDate,
        preferred_price_per_kg: parseFloat(reqPrice),
        quality_requirement: reqQuality.trim() || undefined,
        delivery_city: reqCity.trim(),
      });

      showNotification(t('requirementSuccess'), 'success');
      // Reset form
      setReqQty('');
      setReqPrice('');
      setReqQuality('');

      // Switch to matches tab
      setSelectedRequirementId(newReq.id);
      setActiveTab('matches');
      fetchMatchesForRequirement(newReq.id);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create Order from listing or match
  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    if (!orderingCrop || !orderQuantity || Number(orderQuantity) <= 0) return;

    setOrderSubmitting(true);
    try {
      await orderService.createOrder({
        crop_listing_id: orderingCrop.crop_listing_id || orderingCrop.id,
        quantity_kg: parseFloat(orderQuantity),
        agreed_price_per_kg: orderingCrop.asking_price || orderingCrop.asking_price_per_kg,
        buyer_requirement_id: selectedRequirementId || undefined,
      });

      showNotification(t('orderCreatedSuccess'), 'success');
      setOrderingCrop(null);
      setOrderQuantity('');
      loadActiveCrops();
      setActiveTab('orders');
      loadMyOrders();
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const filteredCrops = (selectedCropFilter
    ? activeCrops.filter((c) => c.crop_name.toLowerCase() === selectedCropFilter.toLowerCase())
    : activeCrops).filter((c) => Number(c.quantity_kg) > 0 && (!c.status || c.status === 'ACTIVE'));

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title" id="buyer-dashboard-heading">{t('buyerDashboardTitle')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {t('buyerAuthSubtitle')}
          </p>
        </div>
      </div>

      {/* Global Toast */}
      {message.text && (
        <div className={message.type === 'error' ? 'error-banner' : 'success-banner'}>
          {message.text}
        </div>
      )}

      {/* 6 Large Action Cards */}
      <div className="dashboard-nav-grid" role="navigation" aria-label="Buyer actions">
        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'find-crops' ? 'active-buyer' : ''}`}
          onClick={() => setActiveTab('find-crops')}
          id="tab-btn-find-crops"
        >
          <Search size={32} />
          <span>{t('tabFindCrops')}</span>
        </button>

        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'post-req' ? 'active-buyer' : ''}`}
          onClick={() => setActiveTab('post-req')}
          id="tab-btn-post-req"
        >
          <PlusCircle size={32} />
          <span>{t('tabPostRequirement')}</span>
        </button>

        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'my-reqs' ? 'active-buyer' : ''}`}
          onClick={() => setActiveTab('my-reqs')}
          id="tab-btn-my-reqs"
        >
          <ListFilter size={32} />
          <span>{t('tabMyRequirements')}</span>
        </button>

        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'matches' ? 'active-buyer' : ''}`}
          onClick={() => setActiveTab('matches')}
          id="tab-btn-smart-matches"
        >
          <Sparkles size={32} />
          <span>{t('tabMatches')}</span>
        </button>

        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'orders' ? 'active-buyer' : ''}`}
          onClick={() => setActiveTab('orders')}
          id="tab-btn-buyer-orders"
        >
          <ShoppingBag size={32} />
          <span>{t('tabBuyerOrders')}</span>
        </button>

        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'profile' ? 'active-buyer' : ''}`}
          onClick={() => setActiveTab('profile')}
          id="tab-btn-buyer-profile"
        >
          <User size={32} />
          <span>{t('tabBuyerProfile')}</span>
        </button>
      </div>

      {/* Main Tab Content View */}
      <div className="dashboard-view-card">
        {/* ========================================================
            TAB 1: FIND CROPS
           ======================================================== */}
        {activeTab === 'find-crops' && (
          <div>
            <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="view-title">{t('findCropsHeading')}</h2>
                <p className="view-subtitle">{t('findCropsSub')}</p>
              </div>

              {/* Crop Filter Dropdown */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '160px' }}
                  value={selectedCropFilter}
                  onChange={(e) => setSelectedCropFilter(e.target.value)}
                  id="crop-filter-select"
                >
                  <option value="">{t('allCrops')}</option>
                  {COMMON_CROPS.map((crop) => (
                    <option key={crop} value={crop}>
                      {getCropName(crop)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="logout-btn"
                  onClick={loadActiveCrops}
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                  <RefreshCw size={14} />
                  <span>{t('refresh')}</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1rem', fontWeight: 500 }}>{t('loadingAvailableCrops')}</p>
              </div>
            ) : filteredCrops.length === 0 ? (
              <div className="empty-state">
                <Search size={48} className="empty-state-icon" />
                <p className="empty-state-text">{t('noCropsCurrentlyAvailable')}</p>
              </div>
            ) : (
              <div className="crops-grid" id="buyer-crops-grid">
                {filteredCrops.map((crop) => (
                  <div key={crop.id} className="crop-card" id={`buyer-crop-${crop.id}`}>
                    <div className="crop-card-img-wrapper">
                      <img
                        src={crop.photo_url || '/placeholder-crop.jpg'}
                        alt={crop.crop_name}
                        className="crop-card-img"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop';
                        }}
                      />
                    </div>

                    <div className="crop-card-body">
                      <h3 className="crop-card-title">{getCropName(crop.crop_name)}</h3>

                      {/* Safe Farmer Information */}
                      <div className="crop-card-row" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <span className="label">{t('sellerFarmer')}:</span>
                        <span className="val" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {crop.farmer_name || t('sellerFarmer')}{crop.farmer_city ? ` (${crop.farmer_city})` : ''}
                        </span>
                      </div>

                      {/* Available Quantity */}
                      <div className="crop-card-row">
                        <span className="label">{t('availableQuantityLabel')}:</span>
                        <span className="val">{crop.quantity_kg} kg</span>
                      </div>

                      {/* Date available for pickup */}
                      <div className="crop-card-row">
                        <span className="label">{t('availableFromLabel')}:</span>
                        <span className="val">{crop.available_date}</span>
                      </div>

                      {/* Asking price per kg */}
                      <div className="crop-card-row">
                        <span className="label">{t('priceLabel')}:</span>
                        <span className="val" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          ₹{crop.asking_price_per_kg}/kg
                        </span>
                      </div>

                      {/* Pickup / destination location */}
                      <div className="crop-card-row">
                        <span className="label">📍 {t('pickupLocation')}:</span>
                        <span className="val" style={{ fontWeight: 600, textAlign: 'right' }}>
                          {crop.pickup_location || t('pickupNotSpecified')}
                        </span>
                      </div>

                      {/* Current availability status */}
                      <div
                        style={{
                          marginTop: '0.5rem',
                          marginBottom: '0.75rem',
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(34, 197, 94, 0.08)',
                          border: '1px solid rgba(34, 197, 94, 0.25)',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.2rem',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {t('availabilityLabel')}:
                        </span>
                        <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.95rem' }}>
                          {crop.quantity_kg} kg {t('availableBadge')}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn-primary btn-buyer"
                        style={{ marginTop: 'auto' }}
                        onClick={() => {
                          setOrderingCrop(crop);
                          setOrderQuantity(Math.min(crop.quantity_kg, 100).toString());
                        }}
                      >
                        {t('buyNowBtn')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: POST REQUIREMENT
           ======================================================== */}
        {activeTab === 'post-req' && (
          <div>
            <div className="view-header">
              <h2 className="view-title">{t('postRequirementHeading')}</h2>
              <p className="view-subtitle">{t('postRequirementSub')}</p>
            </div>

            <form onSubmit={handlePostRequirementSubmit} id="post-requirement-form" style={{ maxWidth: '640px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="req-crop-select">{t('selectCrop')}</label>
                <select
                  id="req-crop-select"
                  className="form-select"
                  value={reqCrop}
                  onChange={(e) => setReqCrop(e.target.value)}
                >
                  {COMMON_CROPS.map((crop) => (
                    <option key={crop} value={crop}>
                      {getCropName(crop)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="req-qty-input">{t('reqQuantity')}</label>
                <input
                  id="req-qty-input"
                  type="number"
                  step="any"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 1000"
                  value={reqQty}
                  onChange={(e) => setReqQty(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="req-date-input">{t('reqDate')}</label>
                <input
                  id="req-date-input"
                  type="date"
                  className="form-input"
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="req-price-input">{t('reqPrice')}</label>
                <input
                  id="req-price-input"
                  type="number"
                  step="any"
                  min="0.5"
                  className="form-input"
                  placeholder="e.g. 30.00"
                  value={reqPrice}
                  onChange={(e) => setReqPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="req-quality-input">{t('reqQuality')}</label>
                <input
                  id="req-quality-input"
                  type="text"
                  className="form-input"
                  placeholder={t('qualityPlaceholder')}
                  value={reqQuality}
                  onChange={(e) => setReqQuality(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="req-city-input">{t('deliveryCity')}</label>
                <input
                  id="req-city-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Salem, Coimbatore, Madurai"
                  value={reqCity}
                  onChange={(e) => setReqCity(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary btn-buyer"
                id="submit-requirement-btn"
                disabled={loading}
              >
                {loading ? t('loading') : t('submitRequirementBtn')}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 3: MY REQUIREMENTS
           ======================================================== */}
        {activeTab === 'my-reqs' && (
          <div>
            <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="view-title">{t('myRequirementsHeading')}</h2>
              <button
                type="button"
                className="logout-btn"
                onClick={loadMyRequirements}
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                <RefreshCw size={14} />
                <span>{t('refresh')}</span>
              </button>
            </div>

            {loading ? (
              <p>{t('loading')}</p>
            ) : myRequirements.length === 0 ? (
              <div className="empty-state">
                <ListFilter size={48} className="empty-state-icon" />
                <p className="empty-state-text">{t('noMyRequirements')}</p>
                <button
                  type="button"
                  className="btn-primary btn-buyer"
                  style={{ width: 'auto', display: 'inline-flex' }}
                  onClick={() => setActiveTab('post-req')}
                >
                  <PlusCircle size={18} />
                  <span>{t('tabPostRequirement')}</span>
                </button>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table" id="my-requirements-table">
                  <thead>
                    <tr>
                      <th>{t('colCrop')}</th>
                      <th>{t('reqQuantity')}</th>
                      <th>{t('reqPrice')}</th>
                      <th>{t('reqDate')}</th>
                      <th>{t('deliveryCity')}</th>
                      <th>{t('orderStatus')}</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequirements.map((req) => (
                      <tr key={req.id}>
                        <td style={{ fontWeight: 700 }}>{getCropName(req.crop_name)}</td>
                        <td>{req.quantity_kg} kg</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-buyer)' }}>
                          ₹{req.preferred_price_per_kg} / kg
                        </td>
                        <td>{req.required_date}</td>
                        <td>{req.delivery_city}</td>
                        <td>
                          <span className={`status-pill ${req.status.toLowerCase()}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-primary btn-buyer"
                            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                            onClick={() => {
                              setSelectedRequirementId(req.id);
                              setActiveTab('matches');
                              fetchMatchesForRequirement(req.id);
                            }}
                          >
                            <Sparkles size={14} />
                            <span>{t('viewMatchesBtn')}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: SMART MATCHES & MULTI-FARMER AGGREGATION
           ======================================================== */}
        {activeTab === 'matches' && (
          <div>
            <div className="view-header">
              <h2 className="view-title">{t('matchingTitle')}</h2>
              {myRequirements.length > 1 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Switch Requirement:</label>
                  <select
                    className="form-select"
                    style={{ maxWidth: '360px' }}
                    value={selectedRequirementId || ''}
                    onChange={(e) => fetchMatchesForRequirement(e.target.value)}
                  >
                    {myRequirements.map((r) => (
                      <option key={r.id} value={r.id}>
                        {getCropName(r.crop_name)} - {r.quantity_kg} kg ({r.delivery_city})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {matchingLoading ? (
              <p>{t('loading')}</p>
            ) : !matchResult ? (
              <div className="empty-state">
                <Sparkles size={48} className="empty-state-icon" />
                <p className="empty-state-text">{t('noMatchesYet')}</p>
              </div>
            ) : (
              <div>
                {/* ====================================================
                    MULTI-FARMER VOLUME AGGREGATION SUMMARY
                   ==================================================== */}
                {matchResult.aggregation && (
                  <div className="aggregation-banner" id="bulk-aggregation-card">
                    <div className="agg-header">
                      <Users size={22} />
                      <span>{t('multiFarmerHeading')}</span>
                    </div>

                    <div className="agg-desc">
                      {matchResult.aggregation.matched_listings_count > 1 ? (
                        <strong>{t('multiFarmerMessage')}</strong>
                      ) : (
                        <span>Matching listings for your required {matchResult.crop_name}.</span>
                      )}
                    </div>

                    <div className="agg-stats">
                      <div className="agg-stat-item">
                        <span className="stat-label">{t('targetQuantity')}</span>
                        <span className="stat-val">{matchResult.aggregation.required_quantity} kg</span>
                      </div>

                      <div className="agg-stat-item">
                        <span className="stat-label">{t('totalAvailableQty')}</span>
                        <span className="stat-val" style={{ color: matchResult.aggregation.is_fully_aggregatable ? '#15803d' : '#d97706' }}>
                          {matchResult.aggregation.total_available_quantity} kg
                        </span>
                      </div>

                      <div className="agg-stat-item">
                        <span className="stat-label">{t('contributingFarmers')}</span>
                        <span className="stat-val">{matchResult.aggregation.matched_listings_count}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Individual Matched Farmers */}
                {matchResult.matches.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-state-text">{t('noMatchesYet')}</p>
                  </div>
                ) : (
                  <div className="crops-grid" id="matched-farmers-grid">
                    {matchResult.matches.map((item) => (
                      <div key={item.crop_listing_id} className="crop-card" id={`match-item-${item.crop_listing_id}`}>
                        <div className="crop-card-img-wrapper">
                          <img
                            src={item.photo_url || '/placeholder-crop.jpg'}
                            alt={item.crop_name}
                            className="crop-card-img"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop';
                            }}
                          />
                          <span
                            className="crop-card-badge"
                            style={{
                              background: item.match_score >= 80 ? '#dcfce7' : '#fef3c7',
                              color: item.match_score >= 80 ? '#15803d' : '#b45309',
                              fontWeight: 800,
                            }}
                          >
                            Score: {item.match_score}%
                          </span>
                        </div>

                        <div className="crop-card-body">
                          <h3 className="crop-card-title">{getCropName(item.crop_name)}</h3>

                          <div className="crop-card-row">
                            <span className="label">{t('quantityKg')}</span>
                            <span className="val">{item.available_quantity} kg</span>
                          </div>

                          <div className="crop-card-row">
                            <span className="label">{t('deliveryCity')}</span>
                            <span className="val">{item.farmer_city}</span>
                          </div>

                          <div className="crop-card-row">
                            <span className="label">{t('availableDate')}</span>
                            <span className="val">{item.available_date}</span>
                          </div>

                          <div className="crop-price-tag">
                            ₹{item.asking_price} / kg
                          </div>

                          {/* Transparent Match Reasons */}
                          <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                              {t('matchingReasons')}:
                            </div>
                            <ul style={{ listStyle: 'none', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                              {item.matching_reasons.map((r, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} color="#16a34a" />
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <button
                            type="button"
                            className="btn-primary btn-buyer"
                            style={{ marginTop: 'auto' }}
                            onClick={() => {
                              setOrderingCrop(item);
                              setOrderQuantity(Math.min(item.available_quantity, matchResult.required_quantity).toString());
                            }}
                          >
                            {t('createOrderFromMatch')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 5: BUYER ORDERS
           ======================================================== */}
        {activeTab === 'orders' && (
          <div>
            <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="view-title">{t('ordersHeading')}</h2>
              <button
                type="button"
                className="logout-btn"
                onClick={loadMyOrders}
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                <RefreshCw size={14} />
                <span>{t('refresh')}</span>
              </button>
            </div>

            {loading ? (
              <p>{t('loading')}</p>
            ) : myOrders.length === 0 ? (
              <div className="empty-state">
                <ShoppingBag size={48} className="empty-state-icon" />
                <p className="empty-state-text">{t('noOrders')}</p>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table" id="buyer-orders-table">
                  <thead>
                    <tr>
                      <th>{t('orderId')}</th>
                      <th>{t('orderQuantity')}</th>
                      <th>{t('orderUnitRate')}</th>
                      <th>{t('orderTotal')}</th>
                      <th>{t('orderStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          #{ord.id.slice(0, 8)}
                        </td>
                        <td>{ord.quantity_kg} kg</td>
                        <td>₹{ord.agreed_price_per_kg} / kg</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-buyer)' }}>
                          ₹{ord.total_amount}
                        </td>
                        <td>
                          <span className={`status-pill ${ord.status.toLowerCase()}`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && user && (
          <div>
            <div className="view-header">
              <h2 className="view-title">{t('profileHeading')}</h2>
              <p className="view-subtitle">{t('verifiedStatus')}</p>
            </div>

            {/* Profile Hero Card */}
            <div className="profile-hero-card">
              <div className="profile-avatar buyer-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'B'}
              </div>
              <div className="profile-hero-info">
                <div className="profile-hero-name">{user.name}</div>
                <div className="profile-hero-username">@{user.username || '—'}</div>
                <div className="profile-hero-role buyer-role">
                  {t('roleBuyer')}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="profile-stats-grid">
              <div className="profile-stat-card buyer-stat">
                <div className="profile-stat-value">{myRequirements.length}</div>
                <div className="profile-stat-label">{t('requirementsCount')}</div>
              </div>
              <div className="profile-stat-card buyer-stat">
                <div className="profile-stat-value">{myOrders.length}</div>
                <div className="profile-stat-label">{t('ordersCount')}</div>
              </div>
            </div>

            {/* Details */}
            <div className="profile-info-grid">
              <div className="profile-field-box">
                <div className="profile-field-label">{t('usernameLabel')}</div>
                <div className="profile-field-value">@{user.username || '—'}</div>
              </div>

              <div className="profile-field-box">
                <div className="profile-field-label">{t('buyerName')}</div>
                <div className="profile-field-value">{user.name}</div>
              </div>

              {user.phone && (
                <div className="profile-field-box">
                  <div className="profile-field-label">{t('phoneLabel')}</div>
                  <div className="profile-field-value">{user.phone}</div>
                </div>
              )}

              <div className="profile-field-box">
                <div className="profile-field-label">{t('cityLabel')}</div>
                <div className="profile-field-value">{user.city}</div>
              </div>

              <div className="profile-field-box">
                <div className="profile-field-label">{t('addressLabel')}</div>
                <div className="profile-field-value">{user.address}</div>
              </div>

              <div className="profile-field-box">
                <div className="profile-field-label">{t('roleLabel')}</div>
                <div className="profile-field-value" style={{ color: 'var(--accent-buyer)' }}>
                  {t('roleBuyer')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Place Order Modal */}
      {orderingCrop && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '0.5rem' }}>{t('buyNowBtn')}: {getCropName(orderingCrop.crop_name)}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Farmer rate: <strong>₹{orderingCrop.asking_price || orderingCrop.asking_price_per_kg} / kg</strong>
            </p>

            <form onSubmit={handlePlaceOrderSubmit}>
              <div className="form-group">
                <label className="form-label">{t('orderQuantity')} (kg)</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={orderingCrop.available_quantity || orderingCrop.quantity_kg}
                  className="form-input"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  required
                />
                <span className="form-help">
                  Available from farmer: {orderingCrop.available_quantity || orderingCrop.quantity_kg} kg
                </span>
              </div>

              {orderQuantity && Number(orderQuantity) > 0 && (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>{t('orderTotal')}:</span>
                    <span style={{ color: 'var(--accent-buyer)' }}>
                      ₹{(Number(orderQuantity) * (orderingCrop.asking_price || orderingCrop.asking_price_per_kg)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  className="btn-primary btn-buyer"
                  disabled={orderSubmitting}
                >
                  {orderSubmitting ? t('loading') : t('buyNowBtn')}
                </button>
                <button
                  type="button"
                  className="logout-btn"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setOrderingCrop(null)}
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
