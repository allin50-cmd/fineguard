import pytest
from unittest.mock import patch, MagicMock
import os


@pytest.mark.unit
class TestMongoDBClient:
    """Test suite for MongoDBClient singleton."""

    @patch('shared.clients.mongo_client.MongoClient')
    def test_mongo_client_singleton_creation(self, mock_mongo_client, test_env_vars, monkeypatch):
        """Test that MongoDBClient creates a singleton instance."""
        monkeypatch.setenv("COSMOS_CONNECTION_STRING", "mongodb://test:27017")

        from shared.clients.mongo_client import MongoDBClient

        mock_client_instance = MagicMock()
        mock_mongo_client.return_value = mock_client_instance

        client1 = MongoDBClient()
        client2 = MongoDBClient()

        assert client1 is client2, "MongoDBClient should return the same instance"
        mock_mongo_client.assert_called_once()

    @patch('shared.clients.mongo_client.MongoClient')
    def test_mongo_client_uses_connection_string(self, mock_mongo_client, test_env_vars, monkeypatch):
        """Test that MongoDBClient uses the correct connection string."""
        connection_string = "mongodb://testhost:27017"
        monkeypatch.setenv("COSMOS_CONNECTION_STRING", connection_string)

        from shared.clients.mongo_client import MongoDBClient

        mock_client_instance = MagicMock()
        mock_mongo_client.return_value = mock_client_instance

        client = MongoDBClient()

        mock_mongo_client.assert_called_once_with(connection_string)

    @patch('shared.clients.mongo_client.MongoClient')
    def test_mongo_client_connects_to_fineguard_database(self, mock_mongo_client, test_env_vars, monkeypatch):
        """Test that MongoDBClient connects to the 'fineguard' database."""
        monkeypatch.setenv("COSMOS_CONNECTION_STRING", "mongodb://test:27017")

        from shared.clients.mongo_client import MongoDBClient

        mock_client_instance = MagicMock()
        mock_mongo_client.return_value = mock_client_instance

        client = MongoDBClient()

        assert client.db == mock_client_instance['fineguard']

    @patch('shared.clients.mongo_client.MongoClient')
    def test_get_collection_returns_correct_collection(self, mock_mongo_client, test_env_vars, monkeypatch):
        """Test that get_collection returns the specified collection."""
        monkeypatch.setenv("COSMOS_CONNECTION_STRING", "mongodb://test:27017")

        from shared.clients.mongo_client import MongoDBClient

        mock_client_instance = MagicMock()
        mock_db = MagicMock()
        mock_collection = MagicMock()

        mock_client_instance.__getitem__.return_value = mock_db
        mock_db.__getitem__.return_value = mock_collection
        mock_mongo_client.return_value = mock_client_instance

        client = MongoDBClient()
        collection = client.get_collection('test_collection')

        mock_db.__getitem__.assert_called_with('test_collection')

    @patch('shared.clients.mongo_client.MongoClient')
    def test_mongo_client_missing_connection_string(self, mock_mongo_client, monkeypatch):
        """Test that MongoDBClient handles missing connection string."""
        monkeypatch.delenv("COSMOS_CONNECTION_STRING", raising=False)

        from shared.clients.mongo_client import MongoDBClient

        mock_client_instance = MagicMock()
        mock_mongo_client.return_value = mock_client_instance

        client = MongoDBClient()

        mock_mongo_client.assert_called_once_with(None)

    @patch('shared.clients.mongo_client.MongoClient')
    def test_mongo_client_connection_error_handling(self, mock_mongo_client, test_env_vars, monkeypatch):
        """Test that MongoDBClient handles connection errors."""
        monkeypatch.setenv("COSMOS_CONNECTION_STRING", "mongodb://invalid:27017")

        from shared.clients.mongo_client import MongoDBClient
        from pymongo.errors import ConnectionFailure

        mock_mongo_client.side_effect = ConnectionFailure("Connection failed")

        with pytest.raises(ConnectionFailure):
            client = MongoDBClient()
