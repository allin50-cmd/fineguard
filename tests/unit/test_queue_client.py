import pytest
from unittest.mock import patch, MagicMock, call
import json


@pytest.mark.unit
class TestQueueClient:
    """Test suite for QueueClient."""

    @patch('shared.clients.queue_client.pika.BlockingConnection')
    def test_send_message_creates_connection(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test that send_message creates a connection with correct parameters."""
        connection_string = "amqp://test:test@localhost:5672"
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", connection_string)

        from shared.clients.queue_client import QueueClient

        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        client = QueueClient()
        client.send_message("test_queue", {"key": "value"})

        mock_connection_class.assert_called_once()
        # Verify connection was created
        assert mock_connection_class.called

    @patch('shared.clients.queue_client.pika.BlockingConnection')
    def test_send_message_declares_queue(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test that send_message declares the queue as durable."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from shared.clients.queue_client import QueueClient

        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        client = QueueClient()
        client.send_message("my_queue", {"data": "test"})

        mock_channel.queue_declare.assert_called_once_with(queue="my_queue", durable=True)

    @patch('shared.clients.queue_client.pika.BlockingConnection')
    def test_send_message_publishes_json(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test that send_message publishes message as JSON."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from shared.clients.queue_client import QueueClient

        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        client = QueueClient()
        message = {"key": "value", "number": 42}
        client.send_message("test_queue", message)

        expected_body = json.dumps(message, default=str)
        mock_channel.basic_publish.assert_called_once_with(
            exchange='',
            routing_key="test_queue",
            body=expected_body
        )

    @patch('shared.clients.queue_client.pika.BlockingConnection')
    def test_send_message_closes_connection(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test that send_message closes the connection after publishing."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from shared.clients.queue_client import QueueClient

        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        client = QueueClient()
        client.send_message("test_queue", {"data": "test"})

        mock_connection.close.assert_called_once()

    @patch('shared.clients.queue_client.pika.BlockingConnection')
    def test_send_message_with_complex_data_types(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test that send_message handles complex data types with default=str."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from shared.clients.queue_client import QueueClient
        from datetime import datetime

        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        client = QueueClient()
        message = {"timestamp": datetime(2024, 1, 1, 12, 0, 0), "data": "test"}
        client.send_message("test_queue", message)

        mock_channel.basic_publish.assert_called_once()
        call_args = mock_channel.basic_publish.call_args
        body = call_args[1]['body']

        # Verify JSON can be parsed and datetime was converted to string
        parsed = json.loads(body)
        assert isinstance(parsed['timestamp'], str)

    @patch('shared.clients.queue_client.pika.BlockingConnection')
    def test_send_message_missing_connection_string(self, mock_connection_class, monkeypatch):
        """Test that send_message handles missing connection string."""
        monkeypatch.delenv("SERVICE_BUS_CONNECTION_STRING", raising=False)

        from shared.clients.queue_client import QueueClient
        import pika.exceptions

        # When connection string is None, pika raises an error
        mock_connection_class.side_effect = TypeError("expected string or bytes-like object")

        client = QueueClient()

        with pytest.raises(TypeError):
            client.send_message("test_queue", {"data": "test"})

    @patch('shared.clients.queue_client.pika.BlockingConnection')
    def test_send_message_connection_failure(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test that send_message handles connection failures."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://invalid:5672")

        from shared.clients.queue_client import QueueClient
        import pika.exceptions

        mock_connection_class.side_effect = pika.exceptions.AMQPConnectionError("Connection failed")

        client = QueueClient()

        with pytest.raises(pika.exceptions.AMQPConnectionError):
            client.send_message("test_queue", {"data": "test"})

    @patch('shared.clients.queue_client.pika.BlockingConnection')
    def test_send_message_channel_error(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test that send_message handles channel errors."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from shared.clients.queue_client import QueueClient
        import pika.exceptions

        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_channel.basic_publish.side_effect = pika.exceptions.ChannelClosedByBroker(404, "Queue not found")
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        client = QueueClient()

        with pytest.raises(pika.exceptions.ChannelClosedByBroker):
            client.send_message("test_queue", {"data": "test"})

        # Note: Current implementation doesn't close connection on error
        # This is a potential improvement area for error handling
