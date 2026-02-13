import pytest
from unittest.mock import MagicMock
import azure.functions as func
import json
import time


@pytest.mark.integration
@pytest.mark.slow
class TestDataSentinelIntegration:
    """Integration tests for DataSentinel with real services."""

    def test_datasentinel_with_real_mongodb(self, mock_mongo_client, test_env_vars):
        """Test DataSentinel with a real MongoDB instance."""
        # This would require a running MongoDB instance
        # For now, we use mongomock as a lightweight alternative
        from DataSentinel import main
        from unittest.mock import patch

        # Insert test data
        db = mock_mongo_client['fineguard']
        companies_collection = db['companies']
        companies_collection.insert_many([
            {'companyNumber': 'INT001', 'isWatched': True, 'name': 'Integration Test Co 1'},
            {'companyNumber': 'INT002', 'isWatched': True, 'name': 'Integration Test Co 2'},
            {'companyNumber': 'INT003', 'isWatched': False, 'name': 'Not Watched Co'}
        ])

        with patch('DataSentinel.MongoDBClient') as mock_mongo_class:
            mock_mongo = MagicMock()
            mock_mongo.get_collection.return_value = companies_collection
            mock_mongo_class.return_value = mock_mongo

            with patch('DataSentinel.QueueClient') as mock_queue_class:
                mock_queue = MagicMock()
                mock_queue_class.return_value = mock_queue

                req = MagicMock(spec=func.HttpRequest)
                response = main(req)

                # Verify only watched companies processed
                assert response.status_code == 200
                assert "Processed 2 companies" in response.get_body().decode()
                assert mock_queue.send_message.call_count == 2

    def test_datasentinel_queue_integration(self, mock_pika_connection, test_env_vars):
        """Test DataSentinel queue message format integration."""
        from DataSentinel import main
        from unittest.mock import patch

        mock_connection, mock_channel = mock_pika_connection

        with patch('DataSentinel.MongoDBClient') as mock_mongo_class:
            mock_mongo = MagicMock()
            mock_collection = MagicMock()
            mock_collection.find.return_value = iter([
                {'companyNumber': 'QUEUE001', 'isWatched': True}
            ])
            mock_mongo.get_collection.return_value = mock_collection
            mock_mongo_class.return_value = mock_mongo

            with patch('DataSentinel.QueueClient') as mock_queue_class:
                mock_queue = MagicMock()
                mock_queue_class.return_value = mock_queue

                req = MagicMock(spec=func.HttpRequest)
                response = main(req)

                # Verify queue message format
                assert response.status_code == 200
                call_args = mock_queue.send_message.call_args
                queue_name, event = call_args[0]

                assert queue_name == 'events-normalised'
                assert 'companyNumber' in event
                assert 'eventType' in event
                assert 'timestamp' in event
                assert event['companyNumber'] == 'QUEUE001'
