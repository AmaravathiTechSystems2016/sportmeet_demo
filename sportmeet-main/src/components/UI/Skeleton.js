import React from 'react';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
);

export const SkeletonCardGrid = ({ count = 4 }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <Skeleton className="h-44 w-full rounded-none" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
