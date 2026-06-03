import stripe
from django.conf import settings
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:
    """Service class for handling Stripe payments."""
    
    @staticmethod
    def create_payment_intent(amount, currency='AUD', metadata=None):
        """Create a Stripe PaymentIntent."""
        try:
            # Convert to cents for Stripe
            amount_cents = int(amount * 100)
            
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                metadata=metadata or {},
                automatic_payment_methods={
                    'enabled': True,
                },
            )
            
            return {
                'success': True,
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'amount': amount,
                'currency': currency
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def retrieve_payment_intent(payment_intent_id):
        """Retrieve a Stripe PaymentIntent."""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                'success': True,
                'intent': intent
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error retrieving payment intent: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def create_refund(payment_intent_id, amount=None, reason='requested_by_customer'):
        """Create a Stripe refund."""
        try:
            refund_data = {
                'payment_intent': payment_intent_id,
                'reason': reason
            }
            
            if amount:
                # Convert to cents for Stripe
                refund_data['amount'] = int(amount * 100)
            
            refund = stripe.Refund.create(**refund_data)
            
            return {
                'success': True,
                'refund_id': refund.id,
                'amount': refund.amount / 100,  # Convert back from cents
                'status': refund.status
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating refund: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def create_customer(email, name=None, phone=None):
        """Create a Stripe customer."""
        try:
            customer_data = {
                'email': email,
            }
            
            if name:
                customer_data['name'] = name
            if phone:
                customer_data['phone'] = phone
            
            customer = stripe.Customer.create(**customer_data)
            
            return {
                'success': True,
                'customer_id': customer.id
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating customer: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def verify_webhook_signature(payload, signature):
        """Verify Stripe webhook signature."""
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, settings.STRIPE_WEBHOOK_SECRET
            )
            return {
                'success': True,
                'event': event
            }
        except ValueError as e:
            logger.error(f"Invalid payload: {str(e)}")
            return {
                'success': False,
                'error': 'Invalid payload'
            }
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {str(e)}")
            return {
                'success': False,
                'error': 'Invalid signature'
            }
    
    @staticmethod
    def get_payment_methods(customer_id):
        """Get customer's payment methods."""
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type='card'
            )
            return {
                'success': True,
                'payment_methods': payment_methods.data
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error getting payment methods: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def create_setup_intent(customer_id):
        """Create a SetupIntent for saving payment methods."""
        try:
            setup_intent = stripe.SetupIntent.create(
                customer=customer_id,
                payment_method_types=['card'],
            )
            
            return {
                'success': True,
                'client_secret': setup_intent.client_secret,
                'setup_intent_id': setup_intent.id
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating setup intent: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
