import pytest
from unittest.mock import patch, MagicMock, call
import azure.functions as func
from datetime import datetime
import json


@pytest.mark.unit
class TestDataSentinel:
    """Test suite for DataSentinel Azure Function."""

    @patch('DataSentinel.QueueClient')
    @patch('DataSentinel.MongoDBClient')
    def test_datasentinel_successful_processing(self, mock_mongo_class, mock_queue_class):
        """Test DataSentinel successfully processes watched companies."""
        from DataSentinel import main

        # Setup mock MongoDB
        mock_mongo = MagicMock()
        mock_collection = MagicMock()
        watched_companies = [
            {'companyNumber': 'ABC123', 'isWatched': True},
            {'companyNumber': 'XYZ789', 'isWatched': True}
        ]
        mock_collection.find.return_value = iter(watched_companies)
        mock_mongo.get_collection.return_value = mock_collection
        mock_mongo_class.return_value = mock_mongo

        # Setup mock Queue
        mock_queue = MagicMock()
        mock_queue_class.return_value = mock_queue

        # Create mock request
        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Assertions
        assert response.status_code == 200
        assert "Processed 2 companies" in response.get_body().decode()
        mock_mongo.get_collection.assert_called_once_with('companies')
        mock_collection.find.assert_called_once_with({'isWatched': True})
        assert mock_queue.send_message.call_count == 2

    @patch('DataSentinel.QueueClient')
    @patch('DataSentinel.MongoDBClient')
    def test_datasentinel_sends_correct_events(self, mock_mongo_class, mock_queue_class):
        """Test DataSentinel sends correctly formatted events to queue."""
        from DataSentinel import main

        # Setup mocks
        mock_mongo = MagicMock()
        mock_collection = MagicMock()
        watched_companies = [
            {'companyNumber': 'TEST001', 'isWatched': True}
        ]
        mock_collection.find.return_value = iter(watched_companies)
        mock_mongo.get_collection.return_value = mock_collection
        mock_mongo_class.return_value = mock_mongo

        mock_queue = MagicMock()
        mock_queue_class.return_value = mock_queue

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Verify event structure
        mock_queue.send_message.assert_called_once()
        call_args = mock_queue.send_message.call_args
        queue_name = call_args[0][0]
        event = call_args[0][1]

        assert queue_name == 'events-normalised'
        assert event['companyNumber'] == 'TEST001'
        assert event['eventType'] == 'accounts-filed'
        assert 'timestamp' in event

    @patch('DataSentinel.QueueClient')
    @patch('DataSentinel.MongoDBClient')
    def test_datasentinel_no_watched_companies(self, mock_mongo_class, mock_queue_class):
        """Test DataSentinel handles no watched companies gracefully."""
        from DataSentinel import main

        # Setup mocks with empty list
        mock_mongo = MagicMock()
        mock_collection = MagicMock()
        mock_collection.find.return_value = iter([])
        mock_mongo.get_collection.return_value = mock_collection
        mock_mongo_class.return_value = mock_mongo

        mock_queue = MagicMock()
        mock_queue_class.return_value = mock_queue

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Assertions
        assert response.status_code == 200
        assert "Processed 0 companies" in response.get_body().decode()
        mock_queue.send_message.assert_not_called()

    @patch('DataSentinel.QueueClient')
    @patch('DataSentinel.MongoDBClient')
    def test_datasentinel_mongodb_connection_error(self, mock_mongo_class, mock_queue_class):
        """Test DataSentinel handles MongoDB connection errors."""
        from DataSentinel import main
        from pymongo.errors import ConnectionFailure

        # Setup mock to raise exception
        mock_mongo_class.side_effect = ConnectionFailure("Unable to connect to MongoDB")

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Assertions
        assert response.status_code == 500
        assert "Error:" in response.get_body().decode()

    @patch('DataSentinel.QueueClient')
    @patch('DataSentinel.MongoDBClient')
    def test_datasentinel_queue_send_error(self, mock_mongo_class, mock_queue_class):
        """Test DataSentinel handles queue send errors."""
        from DataSentinel import main
        import pika.exceptions

        # Setup MongoDB mock
        mock_mongo = MagicMock()
        mock_collection = MagicMock()
        watched_companies = [
            {'companyNumber': 'TEST001', 'isWatched': True}
        ]
        mock_collection.find.return_value = iter(watched_companies)
        mock_mongo.get_collection.return_value = mock_collection
        mock_mongo_class.return_value = mock_mongo

        # Setup Queue mock to fail
        mock_queue = MagicMock()
        mock_queue.send_message.side_effect = pika.exceptions.AMQPConnectionError("Queue connection failed")
        mock_queue_class.return_value = mock_queue

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Assertions
        assert response.status_code == 500
        assert "Error:" in response.get_body().decode()

    @patch('DataSentinel.QueueClient')
    @patch('DataSentinel.MongoDBClient')
    def test_datasentinel_mongodb_query_error(self, mock_mongo_class, mock_queue_class):
        """Test DataSentinel handles MongoDB query errors."""
        from DataSentinel import main
        from pymongo.errors import OperationFailure

        # Setup mock to raise exception on query
        mock_mongo = MagicMock()
        mock_collection = MagicMock()
        mock_collection.find.side_effect = OperationFailure("Query failed")
        mock_mongo.get_collection.return_value = mock_collection
        mock_mongo_class.return_value = mock_mongo

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Assertions
        assert response.status_code == 500
        assert "Error:" in response.get_body().decode()

    @patch('DataSentinel.datetime')
    @patch('DataSentinel.QueueClient')
    @patch('DataSentinel.MongoDBClient')
    def test_datasentinel_timestamp_format(self, mock_mongo_class, mock_queue_class, mock_datetime):
        """Test DataSentinel generates correct ISO format timestamps."""
        from DataSentinel import main

        # Mock datetime
        fixed_datetime = datetime(2024, 1, 15, 10, 30, 0)
        mock_datetime.utcnow.return_value = fixed_datetime

        # Setup mocks
        mock_mongo = MagicMock()
        mock_collection = MagicMock()
        watched_companies = [
            {'companyNumber': 'TEST001', 'isWatched': True}
        ]
        mock_collection.find.return_value = iter(watched_companies)
        mock_mongo.get_collection.return_value = mock_collection
        mock_mongo_class.return_value = mock_mongo

        mock_queue = MagicMock()
        mock_queue_class.return_value = mock_queue

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Verify timestamp
        event = mock_queue.send_message.call_args[0][1]
        assert event['timestamp'] == '2024-01-15T10:30:00'

    @patch('DataSentinel.QueueClient')
    @patch('DataSentinel.MongoDBClient')
    def test_datasentinel_processes_multiple_companies(self, mock_mongo_class, mock_queue_class):
        """Test DataSentinel processes multiple companies in correct order."""
        from DataSentinel import main

        # Setup mocks with multiple companies
        mock_mongo = MagicMock()
        mock_collection = MagicMock()
        watched_companies = [
            {'companyNumber': 'COMP001', 'isWatched': True},
            {'companyNumber': 'COMP002', 'isWatched': True},
            {'companyNumber': 'COMP003', 'isWatched': True}
        ]
        mock_collection.find.return_value = iter(watched_companies)
        mock_mongo.get_collection.return_value = mock_collection
        mock_mongo_class.return_value = mock_mongo

        mock_queue = MagicMock()
        mock_queue_class.return_value = mock_queue

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Verify all companies processed
        assert mock_queue.send_message.call_count == 3
        sent_company_numbers = [
            call_args[0][1]['companyNumber']
            for call_args in mock_queue.send_message.call_args_list
        ]
        assert sent_company_numbers == ['COMP001', 'COMP002', 'COMP003']
