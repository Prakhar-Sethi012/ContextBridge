"""End-to-End Live Verification Script for ContextBridge Backend.

Tests live database (PostgreSQL + pgvector) and Gemini API integration:
1. POST /api/seed/chat?project_id=1
2. POST /api/handover/generate
3. GET  /api/handover/1?role=project_head
4. GET  /api/analytics/bus-factor/1
"""

import asyncio
import json
import sys
import httpx

BASE_URL = "http://localhost:8000/api"
TIMEOUT = 60.0  # Allow enough time for live Gemini embedding and extraction calls


async def run_live_tests():
    print("=" * 70)
    print("Starting ContextBridge Live End-to-End Verification")
    print(f"Target Base URL: {BASE_URL}")
    print("=" * 70)

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=TIMEOUT) as client:
        # Step 0: Health Check
        print("\n[Step 0] Checking server health...")
        try:
            health_resp = await client.get("http://localhost:8000/health")
            if health_resp.status_code == 200:
                print(f"  [SUCCESS] Server healthy: {health_resp.json()}")
            else:
                print(f"  [FAIL] Unexpected health status: {health_resp.status_code}")
                return False
        except Exception as e:
            print(f"  [FAIL] Could not reach http://localhost:8000/health: {e}")
            print("  Please ensure FastAPI server is running on port 8000.")
            return False

        # Step 1: Seed Database
        print("\n[Step 1] Seeding database with synthetic chat & generating embeddings...")
        print("  POST /api/seed/chat?project_id=1")
        try:
            seed_resp = await client.post("/seed/chat?project_id=1")
            print(f"  Response Status: {seed_resp.status_code}")
            if seed_resp.status_code == 201:
                seed_data = seed_resp.json()
                print(f"  [SUCCESS] Seeded {seed_data.get('ingested_count')} sources into project {seed_data.get('project_id')}.")
                print(f"  Source IDs: {seed_data.get('source_ids')}")
            else:
                print(f"  [FAIL] Seeding failed with status {seed_resp.status_code}: {seed_resp.text}")
                return False
        except Exception as e:
            print(f"  [FAIL] Error during seed request: {e}")
            return False

        # Step 2: Generate Handover Blueprint via Gemini
        print("\n[Step 2] Generating handover blueprint via Gemini LLM & RAG retrieval...")
        print("  POST /api/handover/generate with role='project_head'")
        payload = {"project_id": 1, "role": "project_head"}
        try:
            gen_resp = await client.post("/handover/generate", json=payload)
            print(f"  Response Status: {gen_resp.status_code}")
            if gen_resp.status_code == 201:
                gen_data = gen_resp.json()
                claims_count = gen_data.get("count", len(gen_data.get("claims", [])))
                print(f"  [SUCCESS] Generated {claims_count} knowledge claims.")
            else:
                print(f"  [FAIL] Handover generation failed with status {gen_resp.status_code}: {gen_resp.text}")
                return False
        except Exception as e:
            print(f"  [FAIL] Error during handover generation: {e}")
            return False

        # Step 3: Fetch Claims and verify nested evidences
        print("\n[Step 3] Fetching claims for role='project_head'...")
        print("  GET /api/handover/1?role=project_head")
        try:
            claims_resp = await client.get("/handover/1?role=project_head")
            print(f"  Response Status: {claims_resp.status_code}")
            if claims_resp.status_code == 200:
                claims_json = claims_resp.json()
                # Must be a list containing at least one claim
                assert isinstance(claims_json, list), f"Expected list response, got {type(claims_json)}"
                assert len(claims_json) >= 1, f"Expected at least one claim, got {len(claims_json)}"

                # Verify first claim contains nested evidences array
                first_claim = claims_json[0]
                assert "evidences" in first_claim, "Claim missing 'evidences' array"
                assert isinstance(first_claim["evidences"], list), "'evidences' must be a list"

                print(f"  [SUCCESS] Retrieved {len(claims_json)} claims. Validated list format & nested evidences.")
                print("\n  Sample Extracted Claims:")
                for i, claim in enumerate(claims_json[:3], 1):
                    ev_count = len(claim.get("evidences", []))
                    print(f"    {i}. [{claim.get('claim_type', 'UNKNOWN').upper()}] ({claim.get('status')}): {claim.get('statement')}")
                    print(f"       Supporting sources: {ev_count}")
                    if ev_count > 0:
                        first_ev = claim["evidences"][0]
                        src = first_ev.get("source", {})
                        print(f"       Evidence #1: Source ID {first_ev.get('source_id')} by @{src.get('author')}: \"{src.get('content', '')[:60]}...\"")
            else:
                print(f"  [FAIL] Fetch claims failed with status {claims_resp.status_code}: {claims_resp.text}")
                return False
        except AssertionError as e:
            print(f"  [FAIL] Assertion failed: {e}")
            return False
        except Exception as e:
            print(f"  [FAIL] Error during fetch claims: {e}")
            return False

        # Step 4: Fetch Bus-Factor Analytics
        print("\n[Step 4] Fetching Bus-Factor analytics...")
        print("  GET /api/analytics/bus-factor/1")
        try:
            bf_resp = await client.get("/analytics/bus-factor/1")
            print(f"  Response Status: {bf_resp.status_code}")
            if bf_resp.status_code == 200:
                bf_json = bf_resp.json()
                assert isinstance(bf_json, list), f"Expected list response, got {type(bf_json)}"

                domains = [item.get("domain") for item in bf_json if isinstance(item, dict)]
                expected_domains = ["Database", "Deployment", "Authentication"]

                for expected in expected_domains:
                    assert expected in domains, f"Missing expected domain: '{expected}' in {domains}"

                print(f"  [SUCCESS] Bus-Factor analytics returned all {len(expected_domains)} expected domains.")
                print("\n  Bus-Factor Analytics Breakdown:")
                for domain_item in bf_json:
                    print(f"    - Domain: {domain_item.get('domain')}")
                    print(f"      Primary Holder: @{domain_item.get('primary_holder')}")
                    print(f"      Risk Level:     {domain_item.get('risk_level')}")
                    print(f"      Contributors:   {domain_item.get('unique_contributors')}")
            else:
                print(f"  [FAIL] Analytics failed with status {bf_resp.status_code}: {bf_resp.text}")
                return False
        except AssertionError as e:
            print(f"  [FAIL] Assertion failed: {e}")
            return False
        except Exception as e:
            print(f"  [FAIL] Error during fetch analytics: {e}")
            return False

    print("\n" + "=" * 70)
    print("ALL 4 LIVE END-TO-END TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)
    return True


if __name__ == "__main__":
    success = asyncio.run(run_live_tests())
    sys.exit(0 if success else 1)
