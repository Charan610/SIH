"""
tests/test_self_employment.py — Unit tests for Self-Employment & Entrepreneurship module
"""

import unittest
from fastapi.testclient import TestClient

import db
from main import app

class TestSelfEmploymentModule(unittest.TestCase):
    def setUp(self):
        db.init_database()
        self.client = TestClient(app)

    def test_get_all_business_pathways(self):
        pathways = db.get_all_business_pathways()
        self.assertGreaterEqual(len(pathways), 8)
        first = pathways[0]
        self.assertIn("title", first)
        self.assertIn("equipment_checklist", first)
        self.assertIn("indicative_investment", first)
        self.assertIn("total_indicative_cost", first["indicative_investment"])
        self.assertIn("disclaimer", first["indicative_investment"])

    def test_get_all_government_schemes(self):
        schemes = db.get_all_schemes()
        self.assertGreaterEqual(len(schemes), 5)
        scheme_names = [s["scheme_name"] for s in schemes]
        self.assertTrue(any("PM-AJAY" in s for s in scheme_names))
        self.assertTrue(any("MUDRA" in s or "Mudra" in s for s in scheme_names))
        self.assertTrue(any("Vishwakarma" in s for s in scheme_names))

    def test_get_livelihood_comparison(self):
        comp = db.get_livelihood_comparison("Solar Technician")
        self.assertEqual(comp["existing_skill"], "Solar Technician")
        self.assertIn("employment_training", comp)
        self.assertIn("self_employment_training", comp)
        self.assertIn("employment_investment", comp)
        self.assertIn("self_employment_investment", comp)

    def test_self_employment_api_endpoints(self):
        r1 = self.client.get("/self-employment/pathways")
        self.assertEqual(r1.status_code, 200)
        data1 = r1.json()
        self.assertGreaterEqual(data1["count"], 1)

        r2 = self.client.get("/self-employment/schemes")
        self.assertEqual(r2.status_code, 200)
        data2 = r2.json()
        self.assertGreaterEqual(data2["count"], 5)

        r3 = self.client.get("/self-employment/compare?trade=Electrician")
        self.assertEqual(r3.status_code, 200)
        data3 = r3.json()
        self.assertEqual(data3["existing_skill"], "Electrician")

if __name__ == "__main__":
    unittest.main()
