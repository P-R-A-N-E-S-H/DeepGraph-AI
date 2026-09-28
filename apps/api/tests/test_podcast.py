import pytest
from app.schemas.podcast import PodcastGenerateRequest
from app.agents.podcast_agent import podcast_agent

@pytest.mark.asyncio
async def test_podcast_agent_generation(db_session):
    req = PodcastGenerateRequest(
        topic="Transformers vs Residual Networks",
        style="deep_dive",
        duration_target_minutes=5
    )
    res = await podcast_agent.generate_podcast(session=db_session, request=req)
    
    assert res.episode_id is not None
    assert "Transformers vs Residual Networks" in res.title
    assert len(res.chapters) >= 3
    assert len(res.dialogue) >= 5
    assert len(res.key_takeaways) >= 2

    # Verify dialogue turns have valid timestamps and speakers
    first_turn = res.dialogue[0]
    assert first_turn.speaker in ["Dr. Aris", "Dr. Nova"]
    assert first_turn.timestamp_formatted is not None
    assert first_turn.tone != ""

@pytest.mark.asyncio
async def test_podcast_api_endpoint(client):
    # Test presets endpoint
    presets_resp = await client.get("/api/v1/podcast/presets")
    assert presets_resp.status_code == 200
    presets_data = presets_resp.json()
    assert len(presets_data) >= 2
    assert presets_data[0]["id"] != ""

    # Test generate endpoint
    gen_resp = await client.post(
        "/api/v1/podcast/generate",
        json={"topic": "Vision Transformers", "style": "debate"}
    )
    assert gen_resp.status_code == 200
    data = gen_resp.json()
    assert data["title"] is not None
    assert len(data["dialogue"]) > 0
