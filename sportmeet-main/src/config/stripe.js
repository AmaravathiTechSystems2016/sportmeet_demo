import { loadStripe } from '@stripe/stripe-js';

// For localhost development, use test keys
// Get your test key from https://dashboard.stripe.com/test/apikeys
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RYgunQ3xH3tQUhEpX0ni4VKQLqrD2yE0Ti28lwmcH7zgKl46m9G4bopw3KtSnM8PZvUcaEXNXLHjh7N79wlNC1N00RSqVk83t';

let stripePromise;

function injectStripeScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Stripe) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://js.stripe.com/v3/"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Stripe.js failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Stripe.js failed to load'));
    document.head.appendChild(s);
  });
}

const getStripe = () => {
  if (stripePromise) return stripePromise;

  if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === 'pk_test_51234567890abcdef') {
    console.error('Stripe publishable key is missing or invalid. Please check your .env file.');
    return null;
  }

  // Try normal loader first; if it throws, fall back to manual script injection
  try {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  } catch (e) {
    stripePromise = injectStripeScript().then(() => window.Stripe(STRIPE_PUBLISHABLE_KEY));
  }
  return stripePromise;
};

export default getStripe;
