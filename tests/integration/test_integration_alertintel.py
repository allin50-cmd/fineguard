import pytest
from unittest.mock import MagicMock, patch
import azure.functions as func
import json


@pytest.mark.integration
@pytest.mark.slow
class TestAlertIntelIntegration:
    """Integration tests for AlertIntel with real services."""

    def test_alertintel_end_to_end_message_processing(self, mock_pika_connection, test_env_vars, monkeypatch):
        """Test AlertIntel processing a complete message flow."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost:5672")

        from AlertIntel import main

        mock_connection, mock_channel = mock_pika_connection

        # Simulate a real message in the queue
        event_data = {
            'companyNumber': 'E2E001',
            'eventType': 'accounts-filed',
            'timestamp': '2024-01-15T10:30:00',
            'metadata': {
                'source': 'DataSentinel',
                'version': '1.0'
            }
        }

        mock_method_frame = MagicMock()
        mock_method_frame.delivery_tag = 'e2e-delivery-tag'
        mock_header_frame = MagicMock()
        mock_body = json.dumps(event_data).encode()

        mock_channel.basic_get.return_value = (mock_method_frame, mock_header_frame, mock_body)

        with patch('AlertIntel.pika.BlockingConnection') as mock_conn_class:
            mock_conn_class.return_value = mock_connection

            req = MagicMock(spec=func.HttpRequest)
            response = main(req)

            # Verify successful processing
            assert response.status_code == 200
            assert "E2E001" in response.get_body().decode()
            mock_channel.basic_ack.assert_called_once_with('e2e-delivery-tag')
            mock_connection.close.assert_called_once()

    def test_alertintel_datasentinel_message_compatibility(self, mock_pika_connection, test_env_vars, monkeypatch):
        """Test that AlertIntel can process messages sent by DataSentinel."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost:5672")

        from AlertIntel import main

        mock_connection, mock_channel = mock_pika_connection

        # Message format from DataSentinel
        datasentinel_message = {
            'companyNumber': 'COMPAT001',
            'eventType': 'accounts-filed',
            'timestamp': '2024-01-15T10:30:00'
        }

        mock_method_frame = MagicMock()
        mock_method_frame.delivery_tag = 'compat-tag'
        mock_header_frame = MagicMock()
        mock_body = json.dumps(datasentinel_message).encode()

        mock_channel.basic_get.return_value = (mock_method_frame, mock_header_frame, mock_body)

        with patch('AlertIntel.pika.BlockingConnection') as mock_conn_class:
            mock_conn_class.return_value = mock_connection

            req = MagicMock(spec=func.HttpRequest)
            response = main(req)

            # Verify AlertIntel can parse and process DataSentinel messages
            assert response.status_code == 200
            assert "COMPAT001" in response.get_body().decode()
            mock_channel.basic_ack.assert_called_once()

    def test_alertintel_queue_connection_reuse(self, mock_pika_connection, test_env_vars, monkeypatch):
        """Test AlertIntel connection handling across multiple invocations."""
        monkeypatch.setenv("SERVICE_BUS_CONNECTION_STRING", "amqp://localhost:5672")

        from AlertIntel import main

        mock_connection, mock_channel = mock_pika_connection

        with patch('AlertIntel.pika.BlockingConnection') as mock_conn_class:
            mock_conn_class.return_value = mock_connection

            # First invocation - with message
            event_data = {
                'companyNumber': 'REUSE001',
                'eventType': 'accounts-filed',
                'timestamp': '2024-01-15T10:30:00'
            }
            mock_method_frame = MagicMock()
            mock_method_frame.delivery_tag = 'tag1'
            mock_body = json.dumps(event_data).encode()
            mock_channel.basic_get.return_value = (mock_method_frame, MagicMock(), mock_body)

            req1 = MagicMock(spec=func.HttpRequest)
            response1 = main(req1)

            assert response1.status_code == 200
            assert mock_conn_class.call_count == 1

            # Second invocation - empty queue
            mock_channel.basic_get.return_value = (None, None, None)

            req2 = MagicMock(spec=func.HttpRequest)
            response2 = main(req2)

            assert response2.status_code == 200
            # New connection created for each invocation
            assert mock_conn_class.call_count == 2
