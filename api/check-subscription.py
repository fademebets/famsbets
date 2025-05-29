import json
from http.server import BaseHTTPRequestHandler
import stripe

stripe.api_key = 'sk_test_51RQgUmPs0nNXEgZbM50rv3XM39VjDsgHyH7ApKXC1mfYyH9ksZCOW9YXnn98lGo6mWPsy0gx3ki7KNJxOkjKnGLL00MIdv32QJ'

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # In a real application, you would get the user's session or token from the request
            # For now, we'll simulate a check by looking for a session_id in the query string
            query_components = parse_qs(urlparse(self.path).query)
            session_id = query_components.get('session_id', [None])[0]
            
            if not session_id:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No session provided'}).encode())
                return
            
            # Retrieve the session from Stripe
            session = stripe.checkout.Session.retrieve(session_id)
            
            # Check if the session is active and the subscription is valid
            if session.payment_status == 'paid' and session.status == 'complete':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'subscribed': True}).encode())
            else:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'subscribed': False, 'error': 'Subscription not active'}).encode())
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode()) 