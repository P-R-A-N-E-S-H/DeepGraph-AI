import pytest
from app.core.security import get_password_hash, verify_password, create_access_token, decode_token

@pytest.mark.asyncio
async def test_password_hashing():
    pwd = "ResearchPassword2026!"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

@pytest.mark.asyncio
async def test_jwt_token_generation_and_decoding():
    user_id = "test-user-uuid"
    token = create_access_token(subject=user_id, role="RESEARCHER")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == user_id
    assert payload["role"] == "RESEARCHER"
    assert payload["type"] == "access"

@pytest.mark.asyncio
async def test_auth_registration_and_login(client):
    reg_payload = {
        "email": "researcher@deepgraph.ai",
        "password": "Password123!",
        "full_name": "Dr. Turing",
        "role": "RESEARCHER"
    }
    resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "researcher@deepgraph.ai"
    assert data["full_name"] == "Dr. Turing"

    login_payload = {
        "email": "researcher@deepgraph.ai",
        "password": "Password123!"
    }
    resp_login = await client.post("/api/v1/auth/login", json=login_payload)
    assert resp_login.status_code == 200
    token_data = resp_login.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data

    # Test /me endpoint with token
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    resp_me = await client.get("/api/v1/auth/me", headers=headers)
    assert resp_me.status_code == 200
    assert resp_me.json()["email"] == "researcher@deepgraph.ai"
