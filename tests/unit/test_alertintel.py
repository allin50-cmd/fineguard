import pytest
from unittest.mock import patch, MagicMock
import azure.functions as func
import json


@pytest.mark.unit
class TestAlertIntel:
    """Test suite for AlertIntel Azure Function."""

    @patch('AlertIntel.pika.BlockingConnection')
    def test_alertintel_processes_message_successfully(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test AlertIntel successfully processes a message from the queue."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from AlertIntel import main

        # Setup mocks
        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        # Mock message data
        event_data = {
            'companyNumber': 'ABC123',
            'eventType': 'accounts-filed',
            'timestamp': '2024-01-15T10:30:00'
        }
        mock_method_frame = MagicMock()
        mock_method_frame.delivery_tag = 'delivery-tag-123'
        mock_header_frame = MagicMock()
        mock_body = json.dumps(event_data).encode()

        mock_channel.basic_get.return_value = (mock_method_frame, mock_header_frame, mock_body)

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Assertions
        assert response.status_code == 200
        assert "Processed event for ABC123" in response.get_body().decode()
        mock_channel.basic_get.assert_called_once_with('events-normalised')
        mock_channel.basic_ack.assert_called_once_with('delivery-tag-123')
        mock_connection.close.assert_called_once()

    @patch('AlertIntel.pika.BlockingConnection')
    def test_alertintel_handles_empty_queue(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test AlertIntel handles empty queue gracefully."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from AlertIntel import main

        # Setup mocks
        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        # No message in queue
        mock_channel.basic_get.return_value = (None, None, None)

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Assertions
        assert response.status_code == 200
        assert "No messages in queue" in response.get_body().decode()
        mock_channel.basic_ack.assert_not_called()
        mock_connection.close.assert_called_once()

    @patch('AlertIntel.pika.BlockingConnection')
    def test_alertintel_connection_error(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test AlertIntel handles connection errors."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://invalid")

        from AlertIntel import main
        import pika.exceptions

        # Mock connection failure
        mock_connection_class.side_effect = pika.exceptions.AMQPConnectionError("Connection failed")

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Assertions
        assert response.status_code == 500
        assert "Error:" in response.get_body().decode()

    @patch('AlertIntel.pika.BlockingConnection')
    def test_alertintel_invalid_json_message(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test AlertIntel handles invalid JSON messages."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from AlertIntel import main

        # Setup mocks
        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        # Invalid JSON message
        mock_method_frame = MagicMock()
        mock_method_frame.delivery_tag = 'delivery-tag-123'
        mock_header_frame = MagicMock()
        mock_body = b'invalid json data'

        mock_channel.basic_get.return_value = (mock_method_frame, mock_header_frame, mock_body)

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Assertions
        assert response.status_code == 500
        assert "Error:" in response.get_body().decode()

    @patch('AlertIntel.pika.BlockingConnection')
    def test_alertintel_missing_connection_string(self, mock_connection_class, monkeypatch):
        """Test AlertIntel handles missing connection string."""
        monkeypatch.delenv("SERVICE_BUS_CONNECTION_STRING", raising=False)

        from AlertIntel import main

        # When connection string is None, pika will likely raise an error
        mock_connection_class.side_effect = TypeError("expected string or bytes-like object")

        req = MagicMock(spec=func.HttpRequest)

        # Execute function - should return error
        response = main(req)

        # Should handle the error
        assert response.status_code == 500
        assert "Error:" in response.get_body().decode()

    @patch('AlertIntel.pika.BlockingConnection')
    def test_alertintel_channel_error(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test AlertIntel handles channel errors."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from AlertIntel import main
        import pika.exceptions

        # Setup mocks
        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        # Channel error on basic_get
        mock_channel.basic_get.side_effect = pika.exceptions.ChannelClosedByBroker(404, "Queue not found")

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Assertions
        assert response.status_code == 500
        assert "Error:" in response.get_body().decode()

    @patch('AlertIntel.pika.BlockingConnection')
    def test_alertintel_message_missing_fields(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test AlertIntel handles messages with missing required fields."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from AlertIntel import main

        # Setup mocks
        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        # Message missing 'companyNumber'
        event_data = {
            'eventType': 'accounts-filed',
            'timestamp': '2024-01-15T10:30:00'
        }
        mock_method_frame = MagicMock()
        mock_method_frame.delivery_tag = 'delivery-tag-123'
        mock_header_frame = MagicMock()
        mock_body = json.dumps(event_data).encode()

        mock_channel.basic_get.return_value = (mock_method_frame, mock_header_frame, mock_body)

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Should fail with KeyError
        assert response.status_code == 500
        assert "Error:" in response.get_body().decode()

    @patch('AlertIntel.pika.BlockingConnection')
    def test_alertintel_creates_connection_with_correct_params(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test AlertIntel creates connection with correct parameters."""
        connection_string = "amqp://user:pass@localhost:5672/vhost"
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", connection_string)

        from AlertIntel import main

        # Setup mocks
        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        mock_channel.basic_get.return_value = (None, None, None)

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Verify connection was created
        mock_connection_class.assert_called_once()
        assert response.status_code == 200

    @patch('AlertIntel.pika.BlockingConnection')
    def test_alertintel_acknowledges_message_before_closing(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test AlertIntel acknowledges message before closing connection."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from AlertIntel import main

        # Setup mocks
        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        # Track call order
        call_order = []
        mock_channel.basic_ack.side_effect = lambda *args: call_order.append('ack')
        mock_connection.close.side_effect = lambda: call_order.append('close')

        event_data = {
            'companyNumber': 'ABC123',
            'eventType': 'accounts-filed',
            'timestamp': '2024-01-15T10:30:00'
        }
        mock_method_frame = MagicMock()
        mock_method_frame.delivery_tag = 'delivery-tag-123'
        mock_header_frame = MagicMock()
        mock_body = json.dumps(event_data).encode()

        mock_channel.basic_get.return_value = (mock_method_frame, mock_header_frame, mock_body)

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Verify ack happens before close
        assert call_order == ['ack', 'close']

    @patch('AlertIntel.pika.BlockingConnection')
    def test_alertintel_processes_different_event_types(self, mock_connection_class, test_env_vars, monkeypatch):
        """Test AlertIntel processes different event types correctly."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost")

        from AlertIntel import main

        # Setup mocks
        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_connection_class.return_value = mock_connection

        # Test different event type
        event_data = {
            'companyNumber': 'XYZ789',
            'eventType': 'officer-change',
            'timestamp': '2024-01-15T10:30:00'
        }
        mock_method_frame = MagicMock()
        mock_method_frame.delivery_tag = 'delivery-tag-456'
        mock_header_frame = MagicMock()
        mock_body = json.dumps(event_data).encode()

        mock_channel.basic_get.return_value = (mock_method_frame, mock_header_frame, mock_body)

        req = MagicMock(spec=func.HttpRequest)

        # Execute function
        response = main(req)

        # Should process successfully
        assert response.status_code == 200
        assert "Processed event for XYZ789" in response.get_body().decode()
