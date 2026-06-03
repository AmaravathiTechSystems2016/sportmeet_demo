import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_DESCRIPTION = 'SportMeet helps players discover sports venues, book courts, and join local events.';
const DEFAULT_IMAGE = '/media/demo/generated-venue.png';

const PageMeta = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = 'website',
  canonical,
}) => {
  const pageTitle = title ? `${title} | SportMeet` : 'SportMeet - Discover, Book & Play';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : '');
  const absoluteImage = image?.startsWith('http') ? image : `${origin}${image}`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      {url && <link rel="canonical" href={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
    </Helmet>
  );
};

export default PageMeta;
