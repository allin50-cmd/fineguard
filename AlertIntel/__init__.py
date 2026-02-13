import azure.functions as func
import logging
import json
import pika
import os

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('=== AlertIntel Started ===')
    
    try:
        connection = pika.BlockingConnection(
            pika.URLParameters(os.getenv('SERVICE_BUS_CONNECTION_STRING'))
        )
        channel = connection.channel()
        
        method_frame, header_frame, body = channel.basic_get('events-normalised')
        
        if method_frame:
            event = json.loads(body)
            logging.info(f"✓ Processing: {event['eventType']} for {event['companyNumber']}")
            channel.basic_ack(method_frame.delivery_tag)
            connection.close()
            return func.HttpResponse(f"Processed event for {event['companyNumber']}", status_code=200)
        else:
            connection.close()
            return func.HttpResponse("No messages in queue", status_code=200)
        
    except Exception as e:
        logging.error(f'Failed: {str(e)}')
        return func.HttpResponse(f"Error: {str(e)}", status_code=500)
