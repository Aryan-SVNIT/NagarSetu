"""Local smoke tests for the core NagarSetu demo workflow.

Run from the repository root with:
    python -m unittest discover -s tests -v
"""
from __future__ import annotations

import io
import os
import tempfile
import unittest
from pathlib import Path

from PIL import Image
from fastapi.testclient import TestClient


class NagarSetuSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data_dir = tempfile.TemporaryDirectory(prefix="nagarsetu-test-")
        os.environ["CIVICLENS_DATA_DIR"] = cls.data_dir.name
        os.environ["DEMO_MODE"] = "true"
        # Import only after setting test-specific environment values.
        from backend.app.main import app
        cls.client_context = TestClient(app)
        cls.client = cls.client_context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client_context.__exit__(None, None, None)
        cls.data_dir.cleanup()

    def test_frontend_pages_and_health(self):
        for path in (
            "/", "/public.html", "/incident.html", "/citizen/welcome.html",
            "/citizen/join.html", "/citizen/otp.html", "/citizen/report.html",
            "/citizen/dashboard.html", "/citizen/submitted.html",
            "/citizen/verify-fix.html", "/admin/login.html", "/admin/dashboard.html",
            "/admin/metrics.html", "/admin/accountability.html", "/admin/escalations.html",
            "/admin/cluster-detail.html",
        ):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertIn("text/html", response.headers.get("content-type", ""))
        self.assertEqual(self.client.get("/api/health").json()["status"], "ok")

    def test_citizen_report_and_evidence_flow(self):
        guest = self.client.post("/api/auth/guest", json={"display_name": "Smoke Test Citizen"})
        self.assertEqual(guest.status_code, 200, guest.text)
        token = guest.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        report = self.client.post("/api/issues", headers=headers, json={
            "category": "Pothole",
            "description": "Large pothole in the road near the public library.",
            "address": "Smoke Test Road, Surat",
            "lat": 21.17,
            "lng": 72.83,
        })
        self.assertEqual(report.status_code, 200, report.text)
        issue = report.json()["issue"]
        self.assertTrue(issue["tracking_id"].startswith("CL-"))

        image_bytes = io.BytesIO()
        Image.new("RGB", (32, 32), "white").save(image_bytes, format="PNG")
        image_bytes.seek(0)
        uploaded = self.client.post(
            f"/api/issues/{issue['id']}/images",
            headers=headers,
            files={"image": ("evidence.png", image_bytes.getvalue(), "image/png")},
        )
        self.assertEqual(uploaded.status_code, 200, uploaded.text)
        self.assertIn("image", uploaded.json())

        dashboard = self.client.get("/api/citizen/dashboard", headers=headers)
        self.assertEqual(dashboard.status_code, 200, dashboard.text)
        self.assertEqual(len(dashboard.json()["issues"]), 1)
        self.assertEqual(self.client.get("/api/public/incidents").status_code, 200)
        public_detail = self.client.get(f"/api/public/incidents/{issue['tracking_id']}")
        self.assertEqual(public_detail.status_code, 200, public_detail.text)
        self.assertEqual(len(public_detail.json()["evidence"]), 1)

    def test_admin_demo_and_access_control(self):
        response = self.client.get("/api/auth/admin/demo")
        self.assertEqual(response.status_code, 200, response.text)
        headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
        self.assertEqual(self.client.get("/api/admin/clusters", headers=headers).status_code, 200)
        self.assertEqual(self.client.get("/api/admin/metrics", headers=headers).status_code, 200)
        self.assertEqual(self.client.get("/api/admin/clusters").status_code, 401)

    def test_hosted_admin_access_key(self):
        os.environ["ADMIN_ACCESS_KEY"] = "test-key-that-is-long-enough-123456"
        self.assertEqual(self.client.get("/api/auth/admin/demo").status_code, 403)
        denied = self.client.post("/api/auth/admin/access", json={"access_key": "incorrect-key-that-is-long-enough"})
        self.assertEqual(denied.status_code, 401)
        allowed = self.client.post("/api/auth/admin/access", json={"access_key": os.environ["ADMIN_ACCESS_KEY"]})
        self.assertEqual(allowed.status_code, 200, allowed.text)
        headers = {"Authorization": f"Bearer {allowed.json()['access_token']}"}
        self.assertEqual(self.client.get("/api/admin/clusters", headers=headers).status_code, 200)
        del os.environ["ADMIN_ACCESS_KEY"]


if __name__ == "__main__":
    unittest.main(verbosity=2)
