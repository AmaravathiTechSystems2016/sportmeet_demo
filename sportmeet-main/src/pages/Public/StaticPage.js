import React from 'react';
import { useQuery } from 'react-query';
import { coreAPI } from '../../services/api';

const contentKeyMap = {
  faq: 'faqs',
  terms: 'terms',
  privacy: 'privacy',
  cookies: 'cookies',
  support: 'support',
};

const StaticPage = ({ slug, title }) => {
  const { data, isLoading } = useQuery(['site-settings'], coreAPI.getSiteSettings);
  const settings = data?.data || {};
  const key = contentKeyMap[slug];
  const html = settings[key] || '';

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </div>
  );
};

export default StaticPage;
