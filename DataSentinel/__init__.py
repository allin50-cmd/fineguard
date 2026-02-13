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
        logging.info(f'Found {len(watched)} watched companies')
        
        queue = QueueClient()
        
        for company in watched:
            event = {
                'companyNumber': company['companyNumber'],
                'eventType': 'accounts-filed',
                'timestamp': datetime.utcnow().isoformat()
            }
            queue.send_message('events-normalised', event)
            logging.info(f"✓ Event sent: {company['companyNumber']}")
        
        return func.HttpResponse(f"Processed {len(watched)} companies", status_code=200)
        
    except Exception as e:
        logging.error(f'Failed: {str(e)}')
        return func.HttpResponse(f"Error: {str(e)}", status_code=500)
