import React from 'react';
import { useQuery } from 'react-query';
import { coreAPI } from '../../services/api';
import PageMeta from '../../components/SEO/PageMeta';

const contentKeyMap = {
  faq: 'faqs',
  terms: 'terms',
  privacy: 'privacy',
  cookies: 'cookies',
  support: 'support',
  cancellation: 'cancellation_policy',
  refund: 'refund_policy',
  'venue-owner-guide': 'venue_owner_guide',
};

const fallbackContent = {
  faq: '<p>Find answers about venue booking, payments, cancellations, event registration, and venue owner onboarding.</p>',
  terms: '<p>Use SportMeet responsibly. Bookings, payments, cancellations, and event registrations are subject to venue and platform policies.</p>',
  privacy: '<p>SportMeet collects account, booking, venue, and payment reference information needed to operate the marketplace. Payment card data is handled by payment providers and is not stored directly by SportMeet.</p>',
  cookies: '<p>SportMeet may use cookies and local storage for authentication, preferences, analytics, and security.</p>',
  support: '<p>For support, contact the SportMeet team with your booking ID, venue name, event name, and account email.</p>',
  cancellation: '<p>Cancellations depend on venue policy and booking timing. Bookings close to the start time may not be eligible for a full refund.</p>',
  refund: '<p>Refunds are processed against the original payment where supported. Stripe test/live keys and webhook handling must be configured for production refunds.</p>',
  'venue-owner-guide': '<p>Venue owners should add venue details, courts, pricing, availability, photos, policies, and submit venues for approval before accepting bookings.</p>',
};

const StaticPage = ({ slug, title }) => {
  const { data, isLoading } = useQuery(['site-settings'], coreAPI.getSiteSettings);
  const settings = data?.data || {};
  const key = contentKeyMap[slug];
  const html = settings[key] || fallbackContent[slug] || '<p>Content will be added soon.</p>';

  return (
    <div className="min-h-full bg-gray-50">
      <PageMeta title={title} description={`${title} for SportMeet users, venue owners, and administrators.`} />
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
