#!/bin/bash

cat > DataSentinel/function.json << 'EOF'
{
  "scriptFile": "__init__.py",
  "bindings": [{
    "authLevel": "anonymous",
    "type": "httpTrigger",
    "direction": "in",
    "name": "req",
    "methods": ["get", "post"]
  },
  {
    "type": "http",
    "direction": "out",
    "name": "$return"
  }]
}
EOF

cat > DataSentinel/__init__.py << 'EOF'
import azure.functions as func
import logging
import sys
import os
from datetime import datetime
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from shared.clients.mongo_client import MongoDBClient
from shared.clients.queue_client import QueueClient

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('=== DataSentinel Started ===')
    try:
        mongo = MongoDBClient()
        watched = list(mongo.get_collection('companies').find({'isWatched': True}))
        queue = QueueClient()
        for company in watched:
            event = {'companyNumber': company['companyNumber'], 'eventType': 'test-event', 'timestamp': datetime.utcnow().isoformat()}
            queue.send_message('events-normalised', event)
            logging.info(f"Event sent: {company['companyNumber']}")
        logging.info(f'Complete: {len(watched)} events')
        return func.HttpResponse(f"Processed {len(watched)} events", status_code=200)
    except Exception as e:
        logging.error(f'Failed: {str(e)}')
        return func.HttpResponse(f"Error: {str(e)}", status_code=500)
EOF

echo "Files updated. Now run: func start"
