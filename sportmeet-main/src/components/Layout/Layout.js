import React from 'react';
import { useQuery } from 'react-query';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { coreAPI } from '../../services/api';

const Layout = () => {
  const { data } = useQuery(['site-settings'], coreAPI.getSiteSettings);
  const settings = data?.data || {};
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer siteName={settings.site_name} />
    </div>
  );
};

export default Layout;
