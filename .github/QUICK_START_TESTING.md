# Quick Start: Testing Guide

Get up and running with tests in under 5 minutes.

## 1. Install Dependencies

```bash
pip install -r requirements.txt
```

## 2. Run Tests

```bash
# Run all unit tests
python3 -m pytest tests/unit -v

# Run with coverage report
python3 -m pytest tests/unit --cov=. --cov-report=html
```

## 3. View Results

```bash
# Open coverage report in browser
open htmlcov/index.html
```

## Common Commands

```bash
# Run specific test file
pytest tests/unit/test_mongo_client.py -v

# Run tests matching pattern
pytest -k "mongo" -v

# Run only fast unit tests
pytest tests/unit -v -m unit

# Run with detailed output
pytest tests/unit -vv

# Stop on first failure
pytest tests/unit -x

# Run in parallel (install pytest-xdist first)
pip install pytest-xdist
pytest tests/unit -n auto
```

## Test Structure

```
tests/
├── unit/                    # Fast isolated tests
│   ├── test_mongo_client.py
│   ├── test_queue_client.py
│   ├── test_datasentinel.py
│   └── test_alertintel.py
└── integration/             # Tests with real services
    ├── test_integration_datasentinel.py
    └── test_integration_alertintel.py
```

## Current Test Status

- ✅ 32 unit tests passing
- ✅ 100% coverage on shared clients
- ✅ All Azure Function agents tested
- ✅ Integration tests included

## Need Help?

- Full guide: [TESTING.md](../TESTING.md)
- Test summary: [TEST_SUMMARY.md](../TEST_SUMMARY.md)
- CI/CD config: [.github/workflows/test.yml](workflows/test.yml)

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests
- Across Python 3.9, 3.10, and 3.11

## What's Tested?

### Shared Clients
- MongoDB singleton pattern and queries
- RabbitMQ connection and messaging
- Error handling and edge cases

### Azure Function Agents
- DataSentinel: Company watching and event generation
- AlertIntel: Queue consumption and event processing
- HTTP request/response handling
- External service integration

### Test Types
- **Unit**: Isolated component testing with mocks
- **Integration**: Component interaction testing
- **Error Scenarios**: Connection failures, invalid data
- **Edge Cases**: Empty results, missing config

## Next Steps

1. Review test output
2. Check coverage report
3. Add tests for new features
4. Keep coverage above 80%
