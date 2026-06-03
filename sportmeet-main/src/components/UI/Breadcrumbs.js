import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumbs = ({ items = [] }) => (
  <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-gray-500">
    <Link to="/" className="hover:text-primary-700">Home</Link>
    {items.map((item) => (
      <React.Fragment key={item.label}>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        {item.href ? (
          <Link to={item.href} className="hover:text-primary-700">{item.label}</Link>
        ) : (
          <span className="font-medium text-gray-800">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export default Breadcrumbs;
