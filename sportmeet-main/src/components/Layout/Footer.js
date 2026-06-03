import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { coreAPI } from '../../services/api';
import {
  Building2,
  Calendar,
  Dumbbell,
  Facebook,
  FileText,
  HelpCircle,
  Headphones,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  ShieldCheck,
  Twitter,
} from 'lucide-react';

const Footer = ({ siteName = 'SportMeet' }) => {
  const currentYear = new Date().getFullYear();
  const { data } = useQuery(['site-settings'], coreAPI.getSiteSettings);
  const settings = data?.data || {};

  const footerLinks = {
    'Contact Us': [
      { name: 'Email Us', href: 'mailto:contact@sportmeet.com.au', icon: Mail },
      { name: 'FAQ', href: '/faq', icon: HelpCircle },
      { name: 'Support', href: '/support', icon: Headphones },
    ],
    'Quick Links': [
      { name: 'Venues', href: '/venues', icon: MapPin },
      { name: 'Events', href: '/events', icon: Calendar },
      { name: 'Sports', href: '/sports', icon: Dumbbell },
      { name: 'List Your Venue', href: '/register-venue-owner', icon: Building2 },
    ],
    Policies: [
      { name: 'Terms & Conditions', href: '/terms', icon: FileText },
      { name: 'Privacy Policy', href: '/privacy', icon: FileText },
      { name: 'Cancellation Policy', href: '/cancellation-policy', icon: ShieldCheck },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', href: settings.facebook_url || '#', icon: Facebook },
    { name: 'Twitter', href: settings.twitter_url || '#', icon: Twitter },
    { name: 'Instagram', href: settings.instagram_url || '#', icon: Instagram },
    { name: 'LinkedIn', href: settings.linkedin_url || '#', icon: Linkedin },
  ];

  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
                <span className="text-sm font-bold text-white">SM</span>
              </div>
              <span className="text-xl font-bold">{siteName}</span>
            </div>
            <p className="max-w-xs text-sm leading-6 text-slate-400">
              Discover verified venues, book courts, join events, and keep your sports community moving.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="text-slate-400 transition-colors hover:text-white"
                    aria-label={social.name}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="flex items-center space-x-2 text-sm text-slate-400 transition-colors hover:text-white"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-sm text-slate-400">&copy; {currentYear} {siteName}. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              <Link to="/terms" className="transition-colors hover:text-white">
                Terms of Service
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="transition-colors hover:text-white">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
