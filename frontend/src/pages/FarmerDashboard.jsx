import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  cropService,
  marketPriceService,
  requirementService,
  orderService,
  getErrorMessage,
} from '../services/api';
import { COMMON_CROPS } from '../i18n/translations';
import {
  PlusCircle,
  Package,
  Search,
  TrendingUp,
  FileText,
  User,
  Upload,
  AlertCircle,
  XCircle,
  Edit2,
  RefreshCw,
  Users,
  Sparkles,
  MapPin,
} from 'lucide-react';

// Static demo buyers for preview when browsing buyers
const DEMO_BUYERS = [
  {
    id: 'demo-1',
    name: 'Chennai Fresh Mart',
    username: 'chennaifresh',
    city: 'Chennai',
    phone: '9876543210',
    address: 'Koyambedu Wholesale Market, Chennai',
    active_requirement: {
      crop_name: 'Tomato',
      quantity_kg: 500,
      required_date: '2026-10-02',
      preferred_price_per_kg: 34.0,
      quality_requirement: 'Grade A Export',
    },
  },
  {
    id: 'demo-2',
    name: 'Kovai Agro Traders',
    username: 'kovai_agro',
    city: 'Coimbatore',
    phone: '9842109876',
    address: 'RS Puram, Coimbatore',
    active_requirement: {
      crop_name: 'Onion',
      quantity_kg: 1000,
      required_date: '2026-10-05',
      preferred_price_per_kg: 28.0,
      quality_requirement: 'Medium Grade',
    },
  },
  {
    id: 'demo-3',
    name: 'Madurai Green Hub',
    username: 'madurai_greens',
    city: 'Madurai',
    phone: '9789012345',
    address: 'Mattuthavani Central Market, Madurai',
    active_requirement: {
      crop_name: 'Potato',
      quantity_kg: 800,
      required_date: '2026-10-04',
      preferred_price_per_kg: 25.0,
      quality_requirement: 'Clean Sorted',
    },
  },
  {
    id: 'demo-4',
    name: 'Salem Organics & Retail',
    username: 'salem_organics',
    city: 'Salem',
    phone: '9443216789',
    address: 'Shevapet Wholesale Market, Salem',
    active_requirement: {
      crop_name: 'Chilli',
      quantity_kg: 250,
      required_date: '2026-10-03',
      preferred_price_per_kg: 75.0,
      quality_requirement: 'Grade 1 Premium',
    },
  },
  {
    id: 'demo-5',
    name: 'Trichy Wholesale Mandi',
    username: 'trichy_mandi',
    city: 'Trichy',
    phone: '9361098765',
    address: 'Gandhi Market, Trichy',
    active_requirement: {
      crop_name: 'Banana',
      quantity_kg: 1200,
      required_date: '2026-10-06',
      preferred_price_per_kg: 18.0,
      quality_requirement: 'Standard Wholesale',
    },
  },
];

// Helper card component to render registered & demo buyer profiles
const BuyerCard = ({ buyer, isDemo, isNear }) => {
  const { t, getCropName } = useLanguage();
  return (
    <div className={`buyer-profile-card ${isDemo ? 'demo-card' : 'real-card'}`}>
      <div className="buyer-card-header">
        <div className="buyer-card-title-wrap">
          <div className="buyer-card-name">{buyer.name}</div>
          <div className="buyer-card-username">@{buyer.username}</div>
        </div>
        <div className="buyer-card-badges">
          {isDemo ? (
            <span className="buyer-badge demo-badge">{t('demoBuyer')}</span>
          ) : (
            <span className="buyer-badge registered-badge">{t('registeredBuyer')}</span>
          )}
          {isNear && (
            <span className="buyer-badge near-badge">Near You</span>
          )}
        </div>
      </div>

      <div className="buyer-card-contact">
        <div className="buyer-contact-row">
          <span>📍</span>
          <span><strong>{buyer.city}</strong></span>
        </div>
        <div className="buyer-contact-row">
          <span>📍</span>
          <span>Pickup: {buyer.address}</span>
        </div>
        {buyer.phone && (
          <div className="buyer-contact-row">
            <span>📞</span>
            <span><strong>{buyer.phone}</strong></span>
          </div>
        )}
      </div>

      <div className="buyer-requirement-box">
        {buyer.active_requirement ? (
          <div>
            <div className="req-title">{t('lookingFor')}:</div>
            <div className="req-crop-line">
              <strong>{getCropName(buyer.active_requirement.crop_name)}</strong> — {buyer.active_requirement.quantity_kg} kg
            </div>
            <div className="req-details-grid">
              {buyer.active_requirement.required_date && (
                <div>
                  <span className="sub-label">{t('requiredDate')}: </span>
                  <span>{buyer.active_requirement.required_date}</span>
                </div>
              )}
              {buyer.active_requirement.preferred_price_per_kg && (
                <div>
                  <span className="sub-label">{t('preferredPrice')}: </span>
                  <span style={{ color: 'var(--accent-buyer)', fontWeight: 700 }}>
                    ₹{buyer.active_requirement.preferred_price_per_kg} / kg
                  </span>
                </div>
              )}
              {buyer.active_requirement.quality_requirement && (
                <div>
                  <span className="sub-label">{t('qualityReq')}: </span>
                  <span>{buyer.active_requirement.quality_requirement}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-req-text">{t('noActiveRequirement')}</div>
        )}
      </div>
    </div>
  );
};

const FarmerDashboard = () => {
  const { user } = useAuth();
  const { t, getCropName } = useLanguage();

  // Active top-level tab
  const [activeTab, setActiveTab] = useState('sell'); // 'sell' | 'my-crops' | 'buyers' | 'prices' | 'orders' | 'profile'

  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // 1. Sell Crop Form state
  const [cropName, setCropName] = useState('Tomato');
  const [quantityKg, setQuantityKg] = useState('');
  const [availableDate, setAvailableDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [askingPrice, setAskingPrice] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [refPriceData, setRefPriceData] = useState(null);
  const [refPriceLoading, setRefPriceLoading] = useState(false);

  // 2. Data Lists
  const [myCrops, setMyCrops] = useState([]);
  const [openRequirements, setOpenRequirements] = useState([]);
  const [registeredBuyers, setRegisteredBuyers] = useState([]);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [marketPrices, setMarketPrices] = useState([]);
  const [myOrders, setMyOrders] = useState([]);

  // Edit Listing Modal state
  const [editingCrop, setEditingCrop] = useState(null);
  const [editPriceVal, setEditPriceVal] = useState('');

  // Fetch benchmark reference price whenever crop selection changes in Sell form
  useEffect(() => {
    let isMounted = true;
    if (cropName) {
      setRefPriceLoading(true);
      marketPriceService
        .getTodayCropPrice(cropName)
        .then((data) => {
          if (isMounted) setRefPriceData(data);
        })
        .catch(() => {
          if (isMounted) setRefPriceData(null);
        })
        .finally(() => {
          if (isMounted) setRefPriceLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [cropName]);

  // Load section data when switching tabs
  useEffect(() => {
    if (activeTab === 'my-crops') loadMyCrops();
    if (activeTab === 'buyers') loadOpenRequirements();
    if (activeTab === 'prices') loadMarketPrices();
    if (activeTab === 'orders') loadMyOrders();
  }, [activeTab]);

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const loadMyCrops = async () => {
    setLoading(true);
    try {
      const data = await cropService.getMyListings();
      setMyCrops(data);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadOpenRequirements = async () => {
    setLoading(true);
    setBuyersLoading(true);
    try {
      const [reqs, buyers] = await Promise.all([
        requirementService.getOpenRequirements(),
        requirementService.getRegisteredBuyers().catch(() => []),
      ]);
      setOpenRequirements(reqs || []);
      setRegisteredBuyers(buyers || []);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
      setBuyersLoading(false);
    }
  };

  const loadMarketPrices = async () => {
    setLoading(true);
    try {
      const data = await marketPriceService.getTodayPrices();
      setMarketPrices(data);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMyOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getFarmerOrders();
      setMyOrders(data);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Submit Sell Crop
  const handleSellCropSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      showNotification(t('cropPhotoRequired'), 'error');
      return;
    }
    if (!quantityKg || Number(quantityKg) <= 0) {
      showNotification(t('errorRequired'), 'error');
      return;
    }
    if (!askingPrice || Number(askingPrice) <= 0) {
      showNotification(t('errorRequired'), 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('crop_name', cropName);
      formData.append('quantity_kg', quantityKg);
      formData.append('available_date', availableDate);
      formData.append('asking_price_per_kg', askingPrice);
      formData.append('photo', photoFile);
      if (pickupLocation.trim()) {
        formData.append('pickup_location', pickupLocation.trim());
      }

      await cropService.createListing(formData);
      showNotification(t('listingSuccess'), 'success');

      // Reset form
      setQuantityKg('');
      setAskingPrice('');
      setPickupLocation('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setActiveTab('my-crops');
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cancel Listing
  const handleCancelListing = async (listingId) => {
    if (!window.confirm(t('confirmCancel'))) return;
    try {
      await cropService.cancelListing(listingId);
      showNotification(t('cropCancelledSuccess'), 'success');
      loadMyCrops();
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    }
  };

  // Update Price
  const handleUpdatePriceSubmit = async (e) => {
    e.preventDefault();
    if (!editPriceVal || Number(editPriceVal) <= 0) return;

    try {
      const formData = new FormData();
      formData.append('asking_price_per_kg', editPriceVal);
      await cropService.updateListing(editingCrop.id, formData);
      showNotification(t('priceUpdatedSuccess'), 'success');
      setEditingCrop(null);
      loadMyCrops();
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    }
  };

  // Update Order Status (Farmer actions: ACCEPTED, COMPLETED)
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      showNotification(`Order status updated to ${newStatus}`, 'success');
      loadMyOrders();
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Welcome Title */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title" id="farmer-dashboard-heading">{t('farmerDashboardTitle')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {t('welcomeSubtitle')}
          </p>
        </div>
      </div>

      {/* Global Toast Notification */}
      {message.text && (
        <div className={message.type === 'error' ? 'error-banner' : 'success-banner'}>
          {message.text}
        </div>
      )}

      {/* 5 Main Action Navigation Cards */}
      <div className="dashboard-nav-grid" role="navigation" aria-label="Farmer actions">
        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
          id="tab-btn-sell-crop"
        >
          <PlusCircle size={32} />
          <span>{t('tabSellCrop')}</span>
        </button>

        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'my-crops' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-crops')}
          id="tab-btn-my-crops"
        >
          <Package size={32} />
          <span>{t('tabMyCrops')}</span>
        </button>

        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'buyers' ? 'active' : ''}`}
          onClick={() => setActiveTab('buyers')}
          id="tab-btn-find-buyers"
        >
          <Search size={32} />
          <span>{t('tabFindBuyers')}</span>
        </button>

        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'prices' ? 'active' : ''}`}
          onClick={() => setActiveTab('prices')}
          id="tab-btn-today-price"
        >
          <TrendingUp size={32} />
          <span>{t('tabTodayPrice')}</span>
        </button>

        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          id="tab-btn-my-orders"
        >
          <FileText size={32} />
          <span>{t('tabMyOrders')}</span>
        </button>

        <button
          type="button"
          className={`dash-nav-card ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          id="tab-btn-my-profile"
        >
          <User size={32} />
          <span>{t('tabMyProfile')}</span>
        </button>
      </div>

      {/* Main Tab Content View */}
      <div className="dashboard-view-card">
        {/* ========================================================
            TAB 1: SELL MY CROP
           ======================================================== */}
        {activeTab === 'sell' && (
          <div>
            <div className="view-header">
              <h2 className="view-title">{t('sellCropHeading')}</h2>
              <p className="view-subtitle">{t('separatePriceNotice')}</p>
            </div>

            <form onSubmit={handleSellCropSubmit} id="sell-crop-form" style={{ maxWidth: '680px' }}>
              {/* Crop Type Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="crop-select">
                  {t('selectCrop')}
                </label>
                <select
                  id="crop-select"
                  className="form-select"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                >
                  {COMMON_CROPS.map((crop) => (
                    <option key={crop} value={crop}>
                      {getCropName(crop)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label className="form-label" htmlFor="quantity-input">
                  {t('quantityKg')}
                </label>
                <input
                  id="quantity-input"
                  type="number"
                  step="any"
                  min="1"
                  className="form-input"
                  placeholder={t('quantityPlaceholder')}
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  required
                />
              </div>

              {/* Available Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="date-input">
                  {t('availableDate')}
                </label>
                <input
                  id="date-input"
                  type="date"
                  className="form-input"
                  value={availableDate}
                  onChange={(e) => setAvailableDate(e.target.value)}
                  required
                />
              </div>

              {/* Pickup / Destination Location */}
              <div className="form-group">
                <label className="form-label" htmlFor="pickup-location-input">
                  {t('pickupDestinationLocation')}
                </label>
                <input
                  id="pickup-location-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Koyambedu Market, Chennai"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                />
                <span className="form-help">{t('pickupLocationHelp')}</span>
              </div>

              {/* Crop Photo Upload */}
              <div className="form-group">
                <label className="form-label" htmlFor="photo-file-input">
                  {t('cropPhoto')}
                </label>
                <div
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: '#fcfdfc',
                  }}
                >
                  <input
                    id="photo-file-input"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handlePhotoSelect}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="photo-file-input"
                    style={{ cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Upload size={32} color="var(--primary)" />
                    <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                      {photoFile ? photoFile.name : t('uploadPhotoPrompt')}
                    </span>
                    <span className="form-help">{t('photoHelp')}</span>
                  </label>

                  {photoPreview && (
                    <div style={{ marginTop: '1rem' }}>
                      <img
                        src={photoPreview}
                        alt="Crop Preview"
                        id="uploaded-photo-preview"
                        style={{ maxHeight: '160px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* =======================================================
                  CRITICAL: DUAL PRICE DISPLAY
                  Reference Market Price vs Your Asking Price
                 ======================================================= */}
              <div className="dual-price-container">
                {/* 1. Reference Market Price */}
                <div className="price-card ref-price" id="ref-market-price-card">
                  <div className="price-card-label">{t('refMarketPriceLabel')}</div>
                  <div className="price-card-sub">{t('refMarketPriceSub')}</div>
                  <div className="price-card-value">
                    {refPriceLoading ? (
                      <span style={{ fontSize: '1.1rem', color: '#6b7280' }}>{t('loading')}</span>
                    ) : refPriceData ? (
                      `₹${refPriceData.price_per_kg} / kg`
                    ) : (
                      <span style={{ fontSize: '0.95rem', color: '#6b7280' }}>
                        {t('refPriceNotFound')}
                      </span>
                    )}
                  </div>
                  {refPriceData && (
                    <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '0.4rem' }}>
                      {refPriceData.market_name} • {refPriceData.source}
                    </div>
                  )}
                </div>

                {/* 2. Farmer's Asking Price */}
                <div className="price-card asking-price" id="farmer-asking-price-card">
                  <div className="price-card-label">{t('askingPriceLabel')}</div>
                  <div className="price-card-sub">{t('askingPriceSub')}</div>
                  <div className="price-card-value">
                    {askingPrice ? `₹${askingPrice} / kg` : '₹ -- / kg'}
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <input
                      id="asking-price-input"
                      type="number"
                      step="any"
                      min="0.5"
                      className="form-input"
                      placeholder={t('pricePlaceholder')}
                      value={askingPrice}
                      onChange={(e) => setAskingPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                id="submit-crop-btn"
                disabled={loading}
              >
                {loading ? t('loading') : t('submitListingBtn')}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 2: MY LISTED CROPS
           ======================================================== */}
        {activeTab === 'my-crops' && (
          <div>
            <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="view-title">{t('myCropsHeading')}</h2>
              </div>
              <button
                type="button"
                className="logout-btn"
                onClick={loadMyCrops}
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                <RefreshCw size={14} />
                <span>{t('refresh')}</span>
              </button>
            </div>

            {loading ? (
              <p>{t('loading')}</p>
            ) : myCrops.length === 0 ? (
              <div className="empty-state">
                <Package size={48} className="empty-state-icon" />
                <p className="empty-state-text">{t('noCropsListed')}</p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: 'auto', display: 'inline-flex' }}
                  onClick={() => setActiveTab('sell')}
                >
                  <PlusCircle size={18} />
                  <span>{t('tabSellCrop')}</span>
                </button>
              </div>
            ) : (
              <div className="crops-grid" id="my-crops-list">
                {myCrops.map((crop) => (
                  <div key={crop.id} className="crop-card" id={`crop-card-${crop.id}`}>
                    <div className="crop-card-img-wrapper">
                      <img
                        src={crop.photo_url || '/placeholder-crop.jpg'}
                        alt={crop.crop_name}
                        className="crop-card-img"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop';
                        }}
                      />
                      <span className={`crop-card-badge status-pill ${crop.status.toLowerCase()}`}>
                        {crop.status}
                      </span>
                    </div>

                    <div className="crop-card-body">
                      <h3 className="crop-card-title">{getCropName(crop.crop_name)}</h3>

                      <div className="crop-card-row">
                        <span className="label">{t('quantityKg')}</span>
                        <span className="val">{crop.quantity_kg} kg</span>
                      </div>

                      <div className="crop-card-row">
                        <span className="label">{t('availableDate')}</span>
                        <span className="val">{crop.available_date}</span>
                      </div>

                      <div className="crop-card-row">
                        <span className="label">📍 {t('pickupLocation')}:</span>
                        <span className="val" style={{ fontWeight: 600, textAlign: 'right' }}>
                          {crop.pickup_location || t('pickupNotSpecified')}
                        </span>
                      </div>

                      <div className="crop-price-tag">
                        ₹{crop.asking_price_per_kg} / kg
                      </div>

                      {crop.status === 'ACTIVE' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                            onClick={() => {
                              setEditingCrop(crop);
                              setEditPriceVal(crop.asking_price_per_kg);
                            }}
                          >
                            <Edit2 size={14} />
                            <span>{t('editPrice')}</span>
                          </button>

                          <button
                            type="button"
                            className="logout-btn"
                            style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                            onClick={() => handleCancelListing(crop.id)}
                          >
                            <XCircle size={14} />
                            <span>{t('cancelListing')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: FIND BUYERS (REGISTERED & DEMO BUYERS)
           ======================================================== */}
        {activeTab === 'buyers' && (() => {
          const farmerCity = (user?.city || '').trim().toLowerCase();
          const matchesFarmerCity = (itemCity) => {
            if (!farmerCity || !itemCity) return false;
            const c = itemCity.toLowerCase();
            return c.includes(farmerCity) || farmerCity.includes(c);
          };

          const prioritizedRegisteredBuyers = [...registeredBuyers].sort((a, b) => {
            const aMatch = matchesFarmerCity(a.city);
            const bMatch = matchesFarmerCity(b.city);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });

          const prioritizedDemoBuyers = [...DEMO_BUYERS].sort((a, b) => {
            const aMatch = matchesFarmerCity(a.city);
            const bMatch = matchesFarmerCity(b.city);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });

          return (
            <div>
              <div className="view-header">
                <h2 className="view-title">{t('findBuyersHeading')}</h2>
                <p className="view-subtitle">{t('findBuyersSub')}</p>
              </div>

              {/* 1. REGISTERED BUYERS SECTION */}
              <div className="buyers-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} color="var(--primary)" />
                    <span>{t('registeredBuyers')}</span>
                  </h3>
                  {user?.city && (
                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--primary-dark)', background: 'var(--primary-subtle)', padding: '3px 10px', borderRadius: '9999px' }}>
                      📍 Prioritizing: {user.city}
                    </span>
                  )}
                </div>

                {buyersLoading ? (
                  <p>{t('loading')}</p>
                ) : prioritizedRegisteredBuyers.length === 0 ? (
                  <div className="notice-banner" style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: '#475569', marginBottom: '1.5rem' }}>
                    <AlertCircle size={18} />
                    <span>{t('noRegisteredBuyersFound')}</span>
                  </div>
                ) : (
                  <div className="buyers-card-grid">
                    {prioritizedRegisteredBuyers.map((b) => (
                      <BuyerCard key={b.id} buyer={b} isDemo={false} isNear={matchesFarmerCity(b.city)} />
                    ))}
                  </div>
                )}
              </div>

              {/* 2. DEMO BUYERS SECTION */}
              <div className="buyers-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-buyer)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={20} color="var(--accent-buyer)" />
                    <span>{t('demoBuyers')}</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Preview wholesale businesses looking for produce
                  </span>
                </div>

                <div className="buyers-card-grid">
                  {prioritizedDemoBuyers.map((b) => (
                    <BuyerCard key={b.id} buyer={b} isDemo={true} isNear={matchesFarmerCity(b.city)} />
                  ))}
                </div>
              </div>

              {/* 3. OPEN DEMAND REQUIREMENTS TABLE (EXISTING FEATURE PRESERVED) */}
              <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px dashed var(--border-color)' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  {t('findBuyersHeading')} (Requirements Board)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  {t('findBuyersSub')}
                </p>

                {openRequirements.length === 0 ? (
                  <div className="empty-state">
                    <Search size={48} className="empty-state-icon" />
                    <p className="empty-state-text">{t('noRequirementsFound')}</p>
                  </div>
                ) : (
                  <div className="data-table-wrapper">
                    <table className="data-table" id="open-requirements-table">
                      <thead>
                        <tr>
                          <th>{t('colCrop')}</th>
                          <th>{t('reqQuantity')}</th>
                          <th>{t('preferredPrice')}</th>
                          <th>{t('requiredDate')}</th>
                          <th>{t('deliveryCity')}</th>
                          <th>{t('qualityReq')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {openRequirements.map((req) => (
                          <tr key={req.id}>
                            <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                              {getCropName(req.crop_name)}
                            </td>
                            <td>{req.quantity_kg} kg</td>
                            <td style={{ fontWeight: 600, color: 'var(--accent-buyer)' }}>
                              ₹{req.preferred_price_per_kg} / kg
                            </td>
                            <td>{req.required_date}</td>
                            <td>{req.delivery_city}</td>
                            <td>{req.quality_requirement || 'Standard Grade'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ========================================================
            TAB 4: TODAY'S MARKET PRICE (CITY-BASED PRIORITIZATION)
           ======================================================== */}
        {activeTab === 'prices' && (() => {
          const farmerCity = (user?.city || '').trim().toLowerCase();
          const matchesFarmerCity = (itemMarket) => {
            if (!farmerCity || !itemMarket) return false;
            const m = itemMarket.toLowerCase();
            return m.includes(farmerCity) || farmerCity.includes(m);
          };

          const marketsNearYou = marketPrices.filter((p) => matchesFarmerCity(p.market_name));
          const otherMarkets = marketPrices.filter((p) => !matchesFarmerCity(p.market_name));

          return (
            <div>
              <div className="view-header">
                <h2 className="view-title">{t('todayPriceHeading')}</h2>
                <p className="view-subtitle">{t('todayPriceSub')}</p>
              </div>

              <div className="notice-banner" style={{ background: 'var(--blue-ref-bg)', borderColor: 'var(--blue-ref-border)', color: '#1e40af' }}>
                <AlertCircle size={18} />
                <span>{t('priceDisclaimer')}</span>
              </div>

              {loading ? (
                <p>{t('loading')}</p>
              ) : marketPrices.length === 0 ? (
                <p>{t('loading')}</p>
              ) : (
                <div>
                  {/* 1. Markets Near You */}
                  {marketsNearYou.length > 0 && (
                    <div style={{ marginBottom: '2.5rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={20} color="var(--primary)" />
                        <span>{t('marketsNearYou')} ({user?.city})</span>
                      </h3>
                      <div className="data-table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>{t('colCrop')}</th>
                              <th>{t('colPrice')}</th>
                              <th>{t('colMarket')}</th>
                              <th>{t('colSource')}</th>
                              <th>{t('colDate')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {marketsNearYou.map((p) => (
                              <tr key={p.id} style={{ background: '#f0fdf4' }}>
                                <td style={{ fontWeight: 700 }}>{getCropName(p.crop_name)}</td>
                                <td style={{ fontWeight: 800, color: 'var(--blue-ref)', fontSize: '1.1rem' }}>
                                  ₹{p.price_per_kg} / kg
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{p.market_name}</td>
                                <td>{p.source}</td>
                                <td>{p.rate_date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 2. Other Markets */}
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                      <span>{marketsNearYou.length > 0 ? t('otherMarkets') : t('todayPriceHeading')}</span>
                    </h3>
                    <div className="data-table-wrapper">
                      <table className="data-table" id="market-prices-table">
                        <thead>
                          <tr>
                            <th>{t('colCrop')}</th>
                            <th>{t('colPrice')}</th>
                            <th>{t('colMarket')}</th>
                            <th>{t('colSource')}</th>
                            <th>{t('colDate')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(marketsNearYou.length > 0 ? otherMarkets : marketPrices).map((p) => (
                            <tr key={p.id}>
                              <td style={{ fontWeight: 700 }}>{getCropName(p.crop_name)}</td>
                              <td style={{ fontWeight: 800, color: 'var(--blue-ref)', fontSize: '1.1rem' }}>
                                ₹{p.price_per_kg} / kg
                              </td>
                              <td>{p.market_name}</td>
                              <td>{p.source}</td>
                              <td>{p.rate_date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ========================================================
            TAB 5: MY ORDERS
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
                <FileText size={48} className="empty-state-icon" />
                <p className="empty-state-text">{t('noOrders')}</p>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table" id="farmer-orders-table">
                  <thead>
                    <tr>
                      <th>{t('orderId')}</th>
                      <th>{t('orderQuantity')}</th>
                      <th>{t('orderUnitRate')}</th>
                      <th>{t('orderTotal')}</th>
                      <th>{t('orderStatus')}</th>
                      <th>Actions</th>
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
                        <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                          ₹{ord.total_amount}
                        </td>
                        <td>
                          <span className={`status-pill ${ord.status.toLowerCase()}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td>
                          {ord.status === 'PENDING' && (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem' }}
                              onClick={() => handleOrderStatusUpdate(ord.id, 'ACCEPTED')}
                            >
                              Accept
                            </button>
                          )}
                          {ord.status === 'ACCEPTED' && (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem', background: '#16a34a' }}
                              onClick={() => handleOrderStatusUpdate(ord.id, 'COMPLETED')}
                            >
                              Complete
                            </button>
                          )}
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
            TAB 6: MY PROFILE
           ======================================================== */}
        {activeTab === 'profile' && user && (
          <div>
            <div className="view-header">
              <h2 className="view-title">{t('profileHeading')}</h2>
              <p className="view-subtitle">{t('verifiedStatus')}</p>
            </div>

            {/* Profile Hero Card */}
            <div className="profile-hero-card">
              <div className="profile-avatar farmer-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'F'}
              </div>
              <div className="profile-hero-info">
                <div className="profile-hero-name">{user.name}</div>
                <div className="profile-hero-username">@{user.username || '—'}</div>
                <div className="profile-hero-role farmer-role">
                  {t('roleFarmer')}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="profile-stats-grid">
              <div className="profile-stat-card">
                <div className="profile-stat-value">{myCrops.length}</div>
                <div className="profile-stat-label">{t('cropListingsCount')}</div>
              </div>
              <div className="profile-stat-card">
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
                <div className="profile-field-label">{t('name')}</div>
                <div className="profile-field-value">{user.name}</div>
              </div>

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
                <div className="profile-field-value" style={{ color: 'var(--primary)' }}>
                  {t('roleFarmer')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Asking Price Modal */}
      {editingCrop && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem' }}>{t('editPrice')}: {getCropName(editingCrop.crop_name)}</h3>
            <form onSubmit={handleUpdatePriceSubmit}>
              <div className="form-group">
                <label className="form-label">{t('askingPriceLabel')} (₹/kg)</label>
                <input
                  type="number"
                  step="any"
                  min="0.5"
                  className="form-input"
                  value={editPriceVal}
                  onChange={(e) => setEditPriceVal(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary">
                  {t('save')}
                </button>
                <button
                  type="button"
                  className="logout-btn"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setEditingCrop(null)}
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

export default FarmerDashboard;
