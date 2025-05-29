import json
import stripe
from http.server import BaseHTTPRequestHandler

stripe.api_key = 'sk_test_51RQgUmPs0nNXEgZbM50rv3XM39VjDsgHyH7ApKXC1mfYyH9ksZCOW9YXnn98lGo6mWPsy0gx3ki7KNJxOkjKnGLL00MIdv32QJ'

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))

        try:
            if data['plan'] == 'monthly':
                price_id = 'price_monthly'  # Replace with your actual Stripe price ID
            else:
                price_id = 'price_annual'   # Replace with your actual Stripe price ID

            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url='https://fademebets.com/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url='https://fademebets.com/subscribe',
            )

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'id': checkout_session.id}).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
