import pytest


@pytest.fixture(autouse=True)
def mock_startup(monkeypatch):
    async def noop_seed():
        return False

    monkeypatch.setattr("app.main.seed_if_empty", noop_seed)
