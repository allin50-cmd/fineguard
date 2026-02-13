from pymongo import MongoClient
import os
import logging

class MongoDBClient:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.client = MongoClient(os.getenv('COSMOS_CONNECTION_STRING'))
            cls._instance.db = cls._instance.client['fineguard']
        return cls._instance
    def get_collection(self, name):
        return self.db[name]
