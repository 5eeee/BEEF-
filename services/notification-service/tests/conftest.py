import pytest


class FakeSession:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass


@pytest.fixture(autouse=True)
def mock_startup(monkeypatch):
    async def noop(*args, **kwargs):
        return None

    monkeypatch.setattr("app.consumers.connect_rabbitmq", noop)
    monkeypatch.setattr("app.main.connect_rabbitmq", noop)
    monkeypatch.setattr("app.main.EventConsumer.start", noop)
    monkeypatch.setattr("app.main.SessionLocal", lambda: FakeSession())
    monkeypatch.setattr("app.services.NotificationService.ensure_default_templates", noop)
