#!/bin/bash
set -e
docker-compose up -d
sleep 20
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 << 'PY'
import pika
connection = pika.BlockingConnection(pika.URLParameters('amqp://fineguard:dev_password_123@localhost:5672'))
channel = connection.channel()
for q in ['events-normalised', 'alerts-to-deliver']:
    channel.queue_declare(queue=q, durable=True)
    print(f'Created: {q}')
connection.close()
PY
python3 << 'PY'
from pymongo import MongoClient
client = MongoClient('mongodb://fineguard:dev_password_123@localhost:27017/fineguard?authSource=admin')
db = client['fineguard']
db.companies.insert_one({'companyNumber': '12345678', 'name': 'Test Co', 'isWatched': True})
print('Database initialized')
client.close()
PY
echo ""
echo "Setup complete!"
echo "Run: source .venv/bin/activate && func start"
