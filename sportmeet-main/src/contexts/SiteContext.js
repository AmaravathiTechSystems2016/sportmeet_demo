import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { coreAPI } from '../services/api';

const SiteContext = createContext();

const DEFAULT_SITE_SETTINGS = {
  site_name: 'SportMeet',
  site_description: 'Discover, Book & Play',
  logo_main: null,
  logo_admin: null,
  logo_auth: null,
  who_we_are_image: null,
};

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
};

export const SiteProvider = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [sliderImages, setSliderImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSiteData = useCallback(async () => {
    try {
      const [settings, slider] = await Promise.all([
        coreAPI.getSiteSettings().then(r => r.data).catch(() => DEFAULT_SITE_SETTINGS),
        coreAPI.getPublicSliderImages().then(r => r.data).catch(() => []),
      ]);
      setSiteSettings(settings);
      setSliderImages(slider);
    } catch (error) {
      console.error('Failed to load site data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSiteData();
  }, [loadSiteData]);

  const refreshSiteData = () => {
    loadSiteData();
  };

  const value = {
    siteSettings,
    sliderImages,
    loading,
    refreshSiteData,
  };

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
};
