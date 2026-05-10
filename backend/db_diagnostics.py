import os
import sys
import ssl
import asyncio
import socket
from dotenv import load_dotenv
import certifi

load_dotenv()

print("=== Environment Diagnostics ===")
print("Python:", sys.version.replace('\n', ' '))
print("ssl.OPENSSL_VERSION:", ssl.OPENSSL_VERSION)
try:
    print("ssl.get_default_verify_paths():", ssl.get_default_verify_paths())
except Exception as e:
    print("ssl.get_default_verify_paths() failed:", e)
print("certifi.where():", certifi.where())

# Check DNS SRV resolution (if dnspython available)
try:
    import dns.resolver
    print("dnspython available. Attempting SRV lookup for mongodb+srv URL...")
    url = os.getenv('MONGO_URL')
    if url and url.startswith('mongodb+srv://'):
        # extract host after mongodb+srv:// and before /
        host = url.split('mongodb+srv://',1)[1].split('/')[0].split('?')[0]
        try:
            answers = dns.resolver.resolve('_mongodb._tcp.' + host, 'SRV')
            print('SRV records:')
            srv_hosts = []
            for r in answers:
                print(' ', r.to_text())
                # r.to_text() like '0 0 27017 ac-aw9tiv8-shard-00-01.ohbltem.mongodb.net.'
                parts = r.to_text().split()
                if len(parts) >= 4:
                    hostname = parts[3].rstrip('.')
                    srv_hosts.append(hostname)
            # Test raw TCP connectivity to each resolved host:27017
            print('\n=== Raw TCP connectivity check ===')
            import socket
            for h in srv_hosts:
                try:
                    print(f'Connecting to {h}:27017 ...', end=' ')
                    s = socket.create_connection((h, 27017), timeout=5)
                    s.close()
                    print('OK (TCP connect succeeded)')
                    # Try TLS handshake using certifi CA and SNI
                    try:
                        ctx = ssl.create_default_context(cafile=certifi.where())
                        s2 = socket.create_connection((h, 27017), timeout=5)
                        ssock = ctx.wrap_socket(s2, server_hostname=h)
                        try:
                            ssock.do_handshake()
                            print('  TLS handshake: OK')
                            cert = ssock.getpeercert()
                            print('  Peer cert subject:', cert.get('subject'))
                        finally:
                            ssock.close()
                    except Exception as e:
                        print('  TLS handshake: FAILED:', type(e).__name__, e)
                except Exception as e:
                    print('FAILED:', type(e).__name__, e)
        except Exception as e:
            print('SRV lookup failed:', type(e).__name__, e)
    else:
        print('No mongodb+srv URL found in MONGO_URL or not using +srv')
except Exception as e:
    print('dnspython not available or import failed:', type(e).__name__, e)


# Try connecting using motor (async)
from motor.motor_asyncio import AsyncIOMotorClient

async def try_connect(description, **kwargs):
    url = os.getenv('MONGO_URL') or 'mongodb://localhost:27017'
    print('\n---', description, '---')
    print('Using URL:', url)
    try:
        client = AsyncIOMotorClient(url, **kwargs)
        await client.admin.command('ping')
        print('SUCCESS: ping succeeded with options:', kwargs)
        client.close()
    except Exception as e:
        print('FAILED:', type(e).__name__, e)

async def main():
    # Basic with certifi
    await try_connect('With certifi CA file', tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000, connectTimeoutMS=10000)
    # Without tlsCAFile
    await try_connect('Without tlsCAFile (default)', serverSelectionTimeoutMS=10000, connectTimeoutMS=10000)
    # tlsAllowInvalidCertificates
    await try_connect('tlsAllowInvalidCertificates=True', tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=10000, connectTimeoutMS=10000)
    # tls=False
    await try_connect('tls=False', tls=False, serverSelectionTimeoutMS=10000, connectTimeoutMS=10000)

if __name__ == '__main__':
    asyncio.run(main())
