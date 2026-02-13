import pytest
import os
from unittest.mock import MagicMock, patch
import mongomock


@pytest.fixture
def mock_mongo_client():
    """Provide a mock MongoDB client for testing."""
    client = mongomock.MongoClient()
    return client


@pytest.fixture
def mock_pika_connection():
    """Provide a mock RabbitMQ connection for testing."""
    mock_connection = MagicMock()
    mock_channel = MagicMock()
    mock_connection.channel.return_value = mock_channel
    return mock_connection, mock_channel


@pytest.fixture
def mock_azure_function_request():
    """Provide a mock Azure Functions HTTP request."""
    mock_req = MagicMock()
    mock_req.method = "POST"
    mock_req.url = "http://localhost:7071/api/test"
    mock_req.params = {}
    mock_req.headers = {}
    return mock_req


@pytest.fixture
def test_env_vars(monkeypatch):
    """Set up test environment variables."""
    monkeypatch.setenv("MONGODB_URI", "mongodb://localhost:27017")
    monkeypatch.setenv("MONGODB_DATABASE", "test_db")
    monkeypatch.setenv("RABBITMQ_HOST", "localhost")
    monkeypatch.setenv("RABBITMQ_PORT", "5672")
    monkeypatch.setenv("RABBITMQ_USER", "test_user")
    monkeypatch.setenv("RABBITMQ_PASS", "test_pass")
    monkeypatch.setenv("RABBITMQ_QUEUE", "test_queue")


@pytest.fixture(autouse=True)
def reset_singletons():
    """Reset singleton instances between tests."""
    import sys

    # Store modules to reload
    modules_to_reload = [key for key in list(sys.modules.keys()) if 'shared.clients' in key]

    # Reset instances before test
    for module_name in modules_to_reload:
        if module_name in sys.modules:
            module = sys.modules[module_name]
            if hasattr(module, 'MongoDBClient'):
                module.MongoDBClient._instance = None

    yield

    # Reset instances after test
    for module_name in modules_to_reload:
        if module_name in sys.modules:
            module = sys.modules[module_name]
            if hasattr(module, 'MongoDBClient'):
                module.MongoDBClient._instance = None
