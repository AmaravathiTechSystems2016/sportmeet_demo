import React from 'react';
import Card from './Card';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => (
  <Card className={`p-10 text-center ${className}`}>
    {Icon && (
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <Icon className="h-6 w-6" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-gray-950">{title}</h3>
    {description && <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{description}</p>}
    {action && <div className="mt-6 flex justify-center">{action}</div>}
  </Card>
);

export default EmptyState;
