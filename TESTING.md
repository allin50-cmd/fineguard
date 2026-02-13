# Testing Guide for FineGuard Unified

This document provides comprehensive information about the testing infrastructure and how to run tests for the FineGuard Unified project.

## Table of Contents

- [Overview](#overview)
- [Testing Infrastructure](#testing-infrastructure)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Coverage Reports](#coverage-reports)

## Overview

The FineGuard Unified project uses `pytest` as the primary testing framework. The test suite includes:

- **Unit Tests**: Test individual components in isolation with mocked dependencies
- **Integration Tests**: Test components working together with real or simulated services
- **Code Coverage**: Track test coverage using `pytest-cov`

## Testing Infrastructure

### Dependencies

The following testing dependencies are included in `requirements.txt`:

- `pytest` - Testing framework
- `pytest-asyncio` - Async test support
- `pytest-cov` - Coverage reporting
- `pytest-mock` - Enhanced mocking capabilities
- `mongomock` - MongoDB mocking for tests
- `python-dotenv` - Environment variable management

### Installation

Install all dependencies including test dependencies:

```bash
pip install -r requirements.txt
```

## Running Tests

### Run All Tests

```bash
pytest
```

### Run Only Unit Tests

```bash
pytest tests/unit -m unit
```

### Run Only Integration Tests

```bash
pytest tests/integration -m integration
```

### Run with Coverage

```bash
pytest --cov=. --cov-report=html --cov-report=term-missing
```

### Run Specific Test File

```bash
pytest tests/unit/test_mongo_client.py -v
```

### Run Specific Test Function

```bash
pytest tests/unit/test_mongo_client.py::TestMongoDBClient::test_mongo_client_singleton_creation -v
```

### Run Tests in Parallel (Optional)

Install pytest-xdist and run:

```bash
pip install pytest-xdist
pytest -n auto
```

## Test Structure

```
tests/
├── conftest.py                           # Shared fixtures and configuration
├── __init__.py
├── unit/                                 # Unit tests
│   ├── __init__.py
│   ├── test_mongo_client.py             # MongoDB client tests
│   ├── test_queue_client.py             # RabbitMQ client tests
│   ├── test_datasentinel.py             # DataSentinel agent tests
│   └── test_alertintel.py               # AlertIntel agent tests
└── integration/                          # Integration tests
    ├── __init__.py
    ├── test_integration_datasentinel.py # DataSentinel integration tests
    └── test_integration_alertintel.py   # AlertIntel integration tests
```

## Writing Tests

### Unit Test Example

```python
import pytest
from unittest.mock import patch, MagicMock


@pytest.mark.unit
class TestMyComponent:
    """Test suite for MyComponent."""

    @patch('mymodule.SomeDependency')
    def test_my_function(self, mock_dependency, test_env_vars):
        """Test that my function works correctly."""
        from mymodule import my_function

        # Setup mocks
        mock_dependency.return_value = "mocked_value"

        # Execute
        result = my_function()

        # Assert
        assert result == "expected_value"
        mock_dependency.assert_called_once()
```

### Integration Test Example

```python
import pytest


@pytest.mark.integration
@pytest.mark.slow
class TestMyIntegration:
    """Integration tests for MyComponent."""

    def test_with_real_service(self, test_env_vars):
        """Test with real service dependencies."""
        # Your integration test code
        pass
```

### Available Fixtures

Defined in `tests/conftest.py`:

- `mock_mongo_client` - Provides a mongomock MongoClient instance
- `mock_pika_connection` - Provides mock RabbitMQ connection and channel
- `mock_azure_function_request` - Provides mock Azure Functions HTTP request
- `test_env_vars` - Sets up test environment variables
- `reset_singletons` - Automatically resets singleton instances between tests

## CI/CD Integration

### GitHub Actions Workflow

The project includes a comprehensive CI/CD workflow at `.github/workflows/test.yml` that:

- Runs on push to `main` and `develop` branches
- Runs on pull requests
- Tests against Python 3.9, 3.10, and 3.11
- Spins up MongoDB and RabbitMQ services
- Runs both unit and integration tests
- Generates coverage reports
- Uploads coverage to Codecov
- Caches dependencies for faster builds

### Running Locally with Docker

To run tests with real MongoDB and RabbitMQ instances:

```bash
# Start services
docker-compose up -d mongo rabbitmq

# Run integration tests
pytest tests/integration -v

# Stop services
docker-compose down
```

## Coverage Reports

### Viewing Coverage

After running tests with coverage:

```bash
pytest --cov=. --cov-report=html
```

Open the HTML report:

```bash
open htmlcov/index.html
```

### Coverage Configuration

Coverage settings are defined in:

- `pytest.ini` - Pytest-specific coverage settings
- `pyproject.toml` - Coverage tool configuration

Excluded from coverage:

- `.venv/*` - Virtual environment
- `tests/*` - Test files themselves
- `*/__init__.py` - Init files
- `*/conftest.py` - Test configuration

## Test Markers

The project uses the following pytest markers:

- `@pytest.mark.unit` - Unit tests (fast, isolated, mocked dependencies)
- `@pytest.mark.integration` - Integration tests (slower, real dependencies)
- `@pytest.mark.slow` - Tests that take longer to execute

Run only fast unit tests:

```bash
pytest -m "unit and not slow"
```

## Best Practices

1. **Mock External Dependencies**: Use mocks for MongoDB, RabbitMQ, and other external services in unit tests
2. **Test Isolation**: Each test should be independent and not rely on other tests
3. **Descriptive Names**: Use clear, descriptive test function names
4. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and assertion phases
5. **Use Fixtures**: Leverage shared fixtures from `conftest.py` for common test setup
6. **Test Edge Cases**: Include tests for error conditions, missing data, and boundary conditions
7. **Keep Tests Fast**: Unit tests should execute quickly; use integration tests for slower scenarios

## Troubleshooting

### Import Errors

If you encounter import errors, ensure you're running pytest from the project root:

```bash
cd /Users/admin/fineguard-unified
pytest
```

### Singleton Issues

The `reset_singletons` fixture automatically resets singleton instances between tests. If you still encounter issues:

```python
# Manually reset in your test
import sys
if 'shared.clients.mongo_client' in sys.modules:
    sys.modules['shared.clients.mongo_client']._instance = None
```

### Environment Variables

Tests use the `test_env_vars` fixture to set environment variables. If you need custom variables:

```python
def test_custom_env(monkeypatch):
    monkeypatch.setenv("MY_VAR", "my_value")
    # Your test code
```

## Future Improvements

Potential areas for test enhancement:

1. Add contract tests for API endpoints
2. Implement property-based testing with Hypothesis
3. Add performance/load tests
4. Increase test coverage to 90%+
5. Add mutation testing
6. Implement snapshot testing for Azure Function responses
7. Add end-to-end tests with fully deployed environment

## Support

For questions or issues with tests:

1. Check this documentation
2. Review existing test examples in `tests/unit/` and `tests/integration/`
3. Review the CI/CD workflow for test execution patterns
