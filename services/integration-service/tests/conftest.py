import pytest


@pytest.fixture(autouse=True)
def mock_startup(monkeypatch):
    async def noop(*args, **kwargs):
        return None

    monkeypatch.setattr("app.consumers.connect_rabbitmq", noop)
    monkeypatch.setattr("app.main.connect_rabbitmq", noop)
    monkeypatch.setattr("app.main.EventConsumer.start", noop)
