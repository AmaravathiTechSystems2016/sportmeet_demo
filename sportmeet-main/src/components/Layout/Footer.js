import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { coreAPI } from '../../services/api';
import { 
  Mail, 
  HelpCircle, 
  Headphones, 
  MapPin, 
  Calendar,
  FileText,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
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
    ],
    'Policies': [
      { name: 'Terms & Conditions', href: '/terms', icon: FileText },
      { name: 'Privacy Policy', href: '/privacy', icon: FileText },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', href: settings.facebook_url || '#', icon: Facebook },
    { name: 'Twitter', href: settings.twitter_url || '#', icon: Twitter },
    { name: 'Instagram', href: settings.instagram_url || '#', icon: Instagram },
    { name: 'LinkedIn', href: settings.linkedin_url || '#', icon: Linkedin },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SM</span>
              </div>
              <span className="text-xl font-bold">{siteName}</span>
            </div>
            <p className="text-gray-400 text-sm">Discover, Book & Play.</p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
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
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">© {currentYear} {siteName}. All rights reserved.</p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="hover:text-white transition-colors">
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
