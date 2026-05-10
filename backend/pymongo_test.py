import os
import ssl
from dotenv import load_dotenv
import certifi

load_dotenv()
uri = os.getenv('MONGO_URL')
print('MONGO_URL:', bool(uri))
print('Python SSL:', ssl.OPENSSL_VERSION)
print('certifi CA file:', certifi.where())

from pymongo import MongoClient

opts = dict(serverSelectionTimeoutMS=10000, connectTimeoutMS=10000)

print('\n-- Attempt with tls=True + certifi CA file --')
try:
    client = MongoClient(uri, tls=True, tlsCAFile=certifi.where(), **opts)
    print('client created, pinging...')
    print('ping result:', client.admin.command('ping'))
    client.close()
    print('SUCCESS')
except Exception as e:
    print('FAILED:', type(e).__name__, e)

print('\n-- Attempt with tlsAllowInvalidCertificates=True (insecure) --')
try:
    client = MongoClient(uri, tls=True, tlsAllowInvalidCertificates=True, **opts)
    print('ping result:', client.admin.command('ping'))
    client.close()
    print('SUCCESS')
except Exception as e:
    print('FAILED:', type(e).__name__, e)

print('\n-- Done --')
