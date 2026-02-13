import pika
import os
import json

class QueueClient:
    def send_message(self, queue_name, message):
        connection = pika.BlockingConnection(pika.URLParameters(os.getenv('SERVICE_BUS_CONNECTION_STRING')))
        channel = connection.channel()
        channel.queue_declare(queue=queue_name, durable=True)
        channel.basic_publish(exchange='', routing_key=queue_name, body=json.dumps(message, default=str))
        connection.close()
