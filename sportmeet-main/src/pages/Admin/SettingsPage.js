import React, { useEffect, useState } from 'react';
import { 
  Save, 
  RefreshCw, 
  Bell, 
  Shield, 
  Globe, 
  CreditCard, 
  Mail, 
  Database,
  AlertTriangle,
  FileText
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { coreAPI } from '../../services/api';
import { useSite } from '../../contexts/SiteContext';

// Lightweight HTML editor without extra deps
const InlineHtmlEditor = ({ label, value, onChange, rows = 8 }) => {
  const ref = React.useRef(null);
  const applyCmd = (cmd, arg) => {
    document.execCommand(cmd, false, arg || null);
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  };
  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <div className="flex flex-wrap gap-2 mb-2">
        <button type="button" onClick={() => applyCmd('bold')} className="px-2 py-1 text-sm border rounded">B</button>
        <button type="button" onClick={() => applyCmd('italic')} className="px-2 py-1 text-sm border rounded italic">I</button>
        <button type="button" onClick={() => applyCmd('underline')} className="px-2 py-1 text-sm border rounded">U</button>
        <button type="button" onClick={() => applyCmd('insertUnorderedList')} className="px-2 py-1 text-sm border rounded">List</button>
        <button type="button" onClick={() => applyCmd('insertOrderedList')} className="px-2 py-1 text-sm border rounded">1. List</button>
        <button type="button" onClick={() => { const url = prompt('Enter URL'); if (url) applyCmd('createLink', url); }} className="px-2 py-1 text-sm border rounded">Link</button>
        <button type="button" onClick={() => applyCmd('removeFormat')} className="px-2 py-1 text-sm border rounded">Clear</button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[120px]"
        style={{ minHeight: rows * 20 }}
      />
      <p className="text-xs text-gray-500 mt-1">Formatted HTML is saved and rendered on the public pages.</p>
    </div>
  );
};

const SettingsPage = () => {
  const { refreshSiteData } = useSite();
  const [activeTab, setActiveTab] = useState('branding');
  const [settings, setSettings] = useState({
    branding: {
      siteName: 'SportMeet',
      siteDescription: 'Discover, Book & Play',
      logo_main: null,
      logo_admin: null,
      logo_auth: null,
      who_we_are_image: null,
      slider: [],
    },
    legal: {
      faqs: '',
      terms: '',
      privacy: '',
      cookies: '',
      support: '',
    },
    social: {
      facebook_url: '',
      twitter_url: '',
      instagram_url: '',
      linkedin_url: '',
    },
    general: {
      siteName: 'SportMeet',
      siteDescription: 'Discover, Book & Play',
      timezone: 'Australia/Sydney',
      currency: 'AUD',
      language: 'en'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      bookingReminders: true,
      paymentAlerts: true,
      systemUpdates: false
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: 'strong',
      ipWhitelist: false,
      auditLogs: true
    },
    payment: {
      stripeEnabled: true,
      stripeTestMode: true,
      paypalEnabled: false,
      bankTransferEnabled: true,
      refundPolicy: '7 days'
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@sportmeet.com.au',
      fromName: 'SportMeet'
    }
  });

  const tabs = [
    { id: 'branding', name: 'Branding', icon: Globe },
    { id: 'general', name: 'General', icon: Globe },
    { id: 'legal', name: 'Legal Pages', icon: FileText },
    { id: 'social', name: 'Social Media', icon: Globe },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'payment', name: 'Payment', icon: CreditCard },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'database', name: 'Database', icon: Database }
  ];

  const reloadFromApi = async () => {
    try {
      const [site, slides] = await Promise.all([
        coreAPI.getSiteSettings().then(r => r.data),
        coreAPI.getSliderImages().then(r => r.data),
      ]);
      setSettings(prev => ({
        ...prev,
        branding: {
          siteName: site.site_name || 'SportMeet',
          siteDescription: site.site_description || '',
          logo_main: site.logo_main || null,
          logo_admin: site.logo_admin || null,
          logo_auth: site.logo_auth || null,
          who_we_are_image: site.who_we_are_image || null,
          slider: slides || [],
        },
        general: {
          ...prev.general,
          siteName: site.site_name || 'SportMeet',
          siteDescription: site.site_description || '',
          timezone: site.timezone || prev.general.timezone,
          currency: site.currency || prev.general.currency,
        },
        legal: {
          faqs: site.faqs || '',
          terms: site.terms || '',
          privacy: site.privacy || '',
          cookies: site.cookies || '',
        },
      }));
    } catch (e) {
      console.error('Reload settings failed', e);
      alert('Failed to reload settings.');
    }
  };

  const handleSave = async () => {
    if (activeTab === 'branding') {
      await handleBrandingSave();
      return;
    }
    if (activeTab === 'legal') {
      await handleLegalSave();
      return;
    }
    alert('No editable settings on this tab yet.');
  };

  const handleReset = async () => {
    await reloadFromApi();
  };

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const [site, slides] = await Promise.all([
          coreAPI.getSiteSettings().then(r => r.data),
          coreAPI.getSliderImages().then(r => r.data),
        ]);
        setSettings(prev => ({
          ...prev,
          branding: {
            siteName: site.site_name || 'SportMeet',
            siteDescription: site.site_description || '',
            logo_main: site.logo_main || null,
            logo_admin: site.logo_admin || null,
            logo_auth: site.logo_auth || null,
            who_we_are_image: site.who_we_are_image || null,
            slider: slides || [],
          },
          legal: {
            faqs: site.faqs || '',
            terms: site.terms || '',
            privacy: site.privacy || '',
            cookies: site.cookies || '',
            support: site.support || '',
          },
          social: {
            facebook_url: site.facebook_url || '',
            twitter_url: site.twitter_url || '',
            instagram_url: site.instagram_url || '',
            linkedin_url: site.linkedin_url || '',
          },
        }));
      } catch (e) {
        console.error('Failed loading branding', e);
      }
    };
    loadBranding();
  }, []);

  const handleBrandingSave = async () => {
    try {
      const form = new FormData();
      form.append('site_name', settings.branding.siteName);
      form.append('site_description', settings.branding.siteDescription);
      // include legal fields if present to allow single-endpoint save from this tab too
      if (settings.legal.faqs !== undefined) form.append('faqs', settings.legal.faqs);
      if (settings.legal.terms !== undefined) form.append('terms', settings.legal.terms);
      if (settings.legal.privacy !== undefined) form.append('privacy', settings.legal.privacy);
      if (settings.legal.cookies !== undefined) form.append('cookies', settings.legal.cookies);
      
      // Only append files if they are actual File objects
      if (settings.branding.logo_main instanceof File) {
        form.append('logo_main', settings.branding.logo_main);
      }
      if (settings.branding.logo_admin instanceof File) {
        form.append('logo_admin', settings.branding.logo_admin);
      }
      if (settings.branding.logo_auth instanceof File) {
        form.append('logo_auth', settings.branding.logo_auth);
      }
      if (settings.branding.who_we_are_image instanceof File) {
        form.append('who_we_are_image', settings.branding.who_we_are_image);
      }
      
      const response = await coreAPI.updateBranding(form);
      console.log('Branding update response:', response.data);
      
      // Refresh the settings to get updated URLs
      const refreshed = await coreAPI.getSiteSettings().then(r => r.data);
      setSettings(prev => ({
        ...prev,
        branding: {
          ...prev.branding,
          logo_main: refreshed.logo_main,
          logo_admin: refreshed.logo_admin,
          logo_auth: refreshed.logo_auth,
          who_we_are_image: refreshed.who_we_are_image,
        },
        legal: {
          faqs: refreshed.faqs || '',
          terms: refreshed.terms || '',
          privacy: refreshed.privacy || '',
          cookies: refreshed.cookies || '',
          support: refreshed.support || '',
        },
      }));
      
      alert('Branding updated successfully!');
      refreshSiteData(); // Refresh site data across the app
    } catch (error) {
      console.error('Branding update error:', error);
      alert('Failed to update branding: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLegalSave = async () => {
    try {
      const form = new FormData();
      form.append('faqs', settings.legal.faqs || '');
      form.append('terms', settings.legal.terms || '');
      form.append('privacy', settings.legal.privacy || '');
      form.append('cookies', settings.legal.cookies || '');
      form.append('support', settings.legal.support || '');
      const response = await coreAPI.updateBranding(form);
      console.log('Legal update response:', response.data);
      const refreshed = await coreAPI.getSiteSettings().then(r => r.data);
      setSettings(prev => ({
        ...prev,
        legal: {
          faqs: refreshed.faqs || '',
          terms: refreshed.terms || '',
          privacy: refreshed.privacy || '',
          cookies: refreshed.cookies || '',
          support: refreshed.support || '',
        },
      }));
      alert('Legal pages updated successfully!');
      refreshSiteData();
    } catch (error) {
      console.error('Legal update error:', error);
      alert('Failed to update legal pages: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSocialSave = async () => {
    try {
      const form = new FormData();
      form.append('facebook_url', settings.social.facebook_url || '');
      form.append('twitter_url', settings.social.twitter_url || '');
      form.append('instagram_url', settings.social.instagram_url || '');
      form.append('linkedin_url', settings.social.linkedin_url || '');
      const response = await coreAPI.updateBranding(form);
      console.log('Social update response:', response.data);
      const refreshed = await coreAPI.getSiteSettings().then(r => r.data);
      setSettings(prev => ({
        ...prev,
        social: {
          facebook_url: refreshed.facebook_url || '',
          twitter_url: refreshed.twitter_url || '',
          instagram_url: refreshed.instagram_url || '',
          linkedin_url: refreshed.linkedin_url || '',
        },
      }));
      alert('Social media links updated successfully!');
      refreshSiteData();
    } catch (error) {
      console.error('Social update error:', error);
      alert('Failed to update social media links: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddSlide = async (file) => {
    const form = new FormData();
    form.append('image', file);
    form.append('order', settings.branding.slider.length);
    await coreAPI.createSliderImage(form);
    const slides = await coreAPI.getSliderImages().then(r => r.data);
    setSettings(prev => ({ ...prev, branding: { ...prev.branding, slider: slides } }));
  };

  const handleDeleteSlide = async (id) => {
    await coreAPI.deleteSliderImage(id);
    const slides = await coreAPI.getSliderImages().then(r => r.data);
    setSettings(prev => ({ ...prev, branding: { ...prev.branding, slider: slides } }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your platform configuration and preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Branding</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                    <input
                      type="text"
                      value={settings.branding.siteName}
                      onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, siteName: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={settings.branding.siteDescription}
                      onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, siteDescription: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Main Logo (Landing Page)</label>
                    <p className="text-xs text-gray-500 mb-2">Used as fallback when no slider images exist</p>
                    {settings.branding.logo_main && typeof settings.branding.logo_main === 'string' && (
                      <img src={settings.branding.logo_main} alt="Main Logo" className="h-12 mb-2 object-contain" />
                    )}
                    <input type="file" accept="image/*" onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, logo_main: e.target.files?.[0] || null } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Logo</label>
                    <p className="text-xs text-gray-500 mb-2">Used in admin dashboard header</p>
                    {settings.branding.logo_admin && typeof settings.branding.logo_admin === 'string' && (
                      <img src={settings.branding.logo_admin} alt="Admin Logo" className="h-12 mb-2 object-contain" />
                    )}
                    <input type="file" accept="image/*" onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, logo_admin: e.target.files?.[0] || null } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Auth Logo</label>
                    <p className="text-xs text-gray-500 mb-2">Used in login/register forms</p>
                    {settings.branding.logo_auth && typeof settings.branding.logo_auth === 'string' && (
                      <img src={settings.branding.logo_auth} alt="Auth Logo" className="h-12 mb-2 object-contain" />
                    )}
                    <input type="file" accept="image/*" onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, logo_auth: e.target.files?.[0] || null } }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Who We Are Image</label>
                    <p className="text-xs text-gray-500 mb-2">Used in the Who We Are section</p>
                    {settings.branding.who_we_are_image && (
                      <img 
                        src={typeof settings.branding.who_we_are_image === 'string' 
                          ? settings.branding.who_we_are_image 
                          : URL.createObjectURL(settings.branding.who_we_are_image)} 
                        alt="Who We Are" 
                        className="h-12 mb-2 object-contain" 
                      />
                    )}
                    <input type="file" accept="image/*" onChange={(e) => setSettings(prev => ({ ...prev, branding: { ...prev.branding, who_we_are_image: e.target.files?.[0] || null } }))} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="primary" onClick={handleBrandingSave}><Save className="h-4 w-4 mr-2" />Save Branding</Button>
                </div>

                <div className="pt-6 border-t">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Homepage Slider</h4>
                  <p className="text-sm text-gray-600 mb-4">Upload images to create a dynamic slider on the homepage. These images will be displayed instead of the main logo.</p>
                  <div className="flex items-center mb-4">
                    <input type="file" accept="image/*" onChange={(e) => e.target.files && e.target.files[0] && handleAddSlide(e.target.files[0])} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {settings.branding.slider.map((slide) => (
                      <div key={slide.id} className="border rounded-md p-3">
                        <img src={slide.image} alt={slide.title} className="h-24 w-full object-cover rounded" />
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">#{slide.order}</span>
                          <Button variant="outline" onClick={() => handleDeleteSlide(slide.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={settings.general.siteName}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, siteName: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, timezone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Australia/Sydney">Australia/Sydney</option>
                      <option value="Australia/Melbourne">Australia/Melbourne</option>
                      <option value="Australia/Brisbane">Australia/Brisbane</option>
                      <option value="Australia/Perth">Australia/Perth</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={settings.general.currency}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, currency: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, language: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.general.siteDescription}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, siteDescription: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Legal Pages</h3>
                <InlineHtmlEditor
                  label="FAQs"
                  value={settings.legal.faqs}
                  onChange={(v) => setSettings(prev => ({ ...prev, legal: { ...prev.legal, faqs: v } }))}
                  rows={8}
                />
                <InlineHtmlEditor
                  label="Terms & Conditions"
                  value={settings.legal.terms}
                  onChange={(v) => setSettings(prev => ({ ...prev, legal: { ...prev.legal, terms: v } }))}
                  rows={12}
                />
                <InlineHtmlEditor
                  label="Privacy Policy"
                  value={settings.legal.privacy}
                  onChange={(v) => setSettings(prev => ({ ...prev, legal: { ...prev.legal, privacy: v } }))}
                  rows={12}
                />
                <InlineHtmlEditor
                  label="Cookie Policy"
                  value={settings.legal.cookies}
                  onChange={(v) => setSettings(prev => ({ ...prev, legal: { ...prev.legal, cookies: v } }))}
                  rows={10}
                />
                <InlineHtmlEditor
                  label="Support"
                  value={settings.legal.support}
                  onChange={(v) => setSettings(prev => ({ ...prev, legal: { ...prev.legal, support: v } }))}
                  rows={8}
                />
                <div className="flex justify-end">
                  <Button variant="primary" onClick={handleLegalSave}><Save className="h-4 w-4 mr-2" />Save Legal Pages</Button>
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Social Media Links</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      value={settings.social.facebook_url}
                      onChange={(e) => setSettings(prev => ({ ...prev, social: { ...prev.social, facebook_url: e.target.value } }))}
                      placeholder="https://facebook.com/yourpage"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter URL
                    </label>
                    <input
                      type="url"
                      value={settings.social.twitter_url}
                      onChange={(e) => setSettings(prev => ({ ...prev, social: { ...prev.social, twitter_url: e.target.value } }))}
                      placeholder="https://twitter.com/yourhandle"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={settings.social.instagram_url}
                      onChange={(e) => setSettings(prev => ({ ...prev, social: { ...prev.social, instagram_url: e.target.value } }))}
                      placeholder="https://instagram.com/yourhandle"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={settings.social.linkedin_url}
                      onChange={(e) => setSettings(prev => ({ ...prev, social: { ...prev.social, linkedin_url: e.target.value } }))}
                      placeholder="https://linkedin.com/company/yourcompany"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="primary" onClick={handleSocialSave}><Save className="h-4 w-4 mr-2" />Save Social Media Links</Button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {key === 'emailNotifications' && 'Send email notifications to users'}
                          {key === 'smsNotifications' && 'Send SMS notifications to users'}
                          {key === 'pushNotifications' && 'Send push notifications to mobile apps'}
                          {key === 'bookingReminders' && 'Send booking reminder notifications'}
                          {key === 'paymentAlerts' && 'Send payment alert notifications'}
                          {key === 'systemUpdates' && 'Send system update notifications'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, [key]: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, twoFactorAuth: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Policy
                    </label>
                    <select
                      value={settings.security.passwordPolicy}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, passwordPolicy: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="basic">Basic (6+ characters)</option>
                      <option value="strong">Strong (8+ chars, mixed case, numbers)</option>
                      <option value="very-strong">Very Strong (12+ chars, special chars)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Payment Settings</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Stripe Integration</h4>
                      <p className="text-sm text-gray-500">Enable Stripe payment processing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.payment.stripeEnabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          payment: { ...prev.payment, stripeEnabled: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Test Mode</h4>
                      <p className="text-sm text-gray-500">Use Stripe test keys for development</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.payment.stripeTestMode}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          payment: { ...prev.payment, stripeTestMode: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Policy
                    </label>
                    <select
                      value={settings.payment.refundPolicy}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        payment: { ...prev.payment, refundPolicy: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="24 hours">24 hours</option>
                      <option value="7 days">7 days</option>
                      <option value="14 days">14 days</option>
                      <option value="30 days">30 days</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Email Settings</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={settings.email.smtpHost}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, smtpHost: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={settings.email.smtpPort}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, smtpPort: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email
                    </label>
                    <input
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, fromEmail: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={settings.email.fromName}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, fromName: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Database Management</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Database Operations
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>These operations can affect your data. Please proceed with caution.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Backup Database
                  </Button>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Optimize Database
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
