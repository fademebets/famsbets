from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import stripe
import os
from urllib.parse import urlparse, parse_qs

# Configure Stripe
stripe.api_key = 'sk_test_51RQgUmPs0nNXEgZbM50rv3XM39VjDsgHyH7ApKXC1mfYyH9ksZCOW9YXnn98lGo6mWPsy0gx3ki7KNJxOkjKnGLL00MIdv32QJ'
STRIPE_WEBHOOK_SECRET = 'whsec_rbC5KWHZ2yL2naITQmLHhjHGREzVDMMx'

class CustomHandler(BaseHTTPRequestHandler):
    def send_json_response(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def send_error_response(self, message, status_code=500):
        self.send_json_response({'error': message}, status_code)
    
    def do_GET(self):
        # Handle API endpoints
        if self.path.startswith('/api/'):
            self.handle_api_get()
        else:
            # Serve static files
            self.serve_static_file()

    def do_POST(self):
        # Handle API endpoints
        if self.path.startswith('/api/'):
            self.handle_api_post()
        else:
            self.send_error(404, "Not Found")

    def handle_api_get(self):
        if self.path == '/api/get-notification-settings':
            try:
                with open('notification_settings.json', 'r') as f:
                    settings = json.load(f)
                self.send_json_response(settings)
            except Exception as e:
                self.send_error_response(str(e))
        elif self.path == '/api/check-subscription':
            try:
                # Get session_id from query string
                query = urlparse(self.path).query
                params = dict(param.split('=') for param in query.split('&'))
                session_id = params.get('session_id')
                
                if not session_id:
                    self.send_error_response('No session ID provided', 400)
                    return
                
                # Verify session with Stripe
                session = stripe.checkout.Session.retrieve(session_id)
                
                if session.payment_status == 'paid' and session.status == 'complete':
                    self.send_json_response({'subscribed': True})
                else:
                    self.send_json_response({'subscribed': False}, 401)
            except Exception as e:
                self.send_error_response(str(e))
        else:
            self.send_error_response('API endpoint not found', 404)

    def handle_api_post(self):
        if self.path == '/api/create-checkout-session':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            try:
                # Create Stripe checkout session
                checkout_session = stripe.checkout.Session.create(
                    payment_method_types=['card'],
                    line_items=[{
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {
                                'name': 'Monthly Subscription' if data['plan'] == 'monthly' else 'Annual Subscription',
                            },
                            'unit_amount': 2999 if data['plan'] == 'monthly' else 29999,  # $29.99 or $299.99
                            'recurring': {
                                'interval': 'month' if data['plan'] == 'monthly' else 'year',
                            },
                        },
                        'quantity': 1,
                    }],
                    mode='subscription',
                    success_url='http://localhost:8000/success?session_id={CHECKOUT_SESSION_ID}',
                    cancel_url='http://localhost:8000/subscribe.html',
                )
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'id': checkout_session.id}).encode())
            except Exception as e:
                self.send_error(500, str(e))

        elif self.path == '/api/save-notification-settings':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            try:
                settings_file = 'notification_settings.json'
                if os.path.exists(settings_file):
                    with open(settings_file, 'r') as f:
                        settings = json.load(f)
                else:
                    settings = {}
                
                settings.update(data)
                
                with open(settings_file, 'w') as f:
                    json.dump(settings, f, indent=2)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())
            except Exception as e:
                self.send_error(500, str(e))

    def serve_static_file(self):
        try:
            # Handle root path and /subscribe
            if self.path == '/' or self.path == '/subscribe':
                self.path = '/index.html'
            
            # Get the file extension
            file_extension = os.path.splitext(self.path)[1]
            
            # Set content type based on file extension
            content_types = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.ico': 'image/x-icon'
            }
            
            content_type = content_types.get(file_extension, 'text/plain')
            
            # Open and read the file
            with open(self.path[1:], 'rb') as file:
                self.send_response(200)
                self.send_header('Content-type', content_type)
                self.end_headers()
                self.wfile.write(file.read())
        except FileNotFoundError:
            self.send_error(404, "File not found")
        except Exception as e:
            self.send_error(500, str(e))

def run(server_class=HTTPServer, handler_class=CustomHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting server on port {port}...")
    httpd.serve_forever()

if __name__ == '__main__':
    run() 