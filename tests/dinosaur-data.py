"""Offline checks for fossil age filtering and provenance."""
import gzip
import hashlib
import importlib.util
import json
import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('dinosaur_builder', ROOT / 'scripts/build-dinosaur-data.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class DinosaurDataTests(unittest.TestCase):
    def test_uncertain_ages_overlap_window_without_becoming_timeless(self):
        self.assertTrue(builder.matches({'eag': 157, 'lag': 152}, 150))
        self.assertFalse(builder.matches({'eag': 170, 'lag': 160}, 150))
        self.assertFalse(builder.matches({'eag': 200, 'lag': 100}, 150))
        self.assertFalse(builder.matches({'eag': 145, 'lag': 155}, 150))
        self.assertFalse(builder.matches({}, 150))

    def test_extinction_boundary_and_indian_plate(self):
        self.assertFalse(builder.matches({'eag': 70, 'lag': 60}, 65))
        self.assertIn('Dinosauria%5EAves', builder.query_url('IND'))
        self.assertIn('%5EIN', builder.query_url('ASI'))
        self.assertNotEqual(builder.query_url('IND'), builder.query_url('ASI'))

    def test_snapshots_complete_and_unmodified(self):
        evidence = json.loads((builder.SOURCE / 'evidence.json').read_text(encoding='utf-8'))
        for source in evidence['sources']:
            raw = gzip.decompress((builder.SOURCE / (source['region'] + '.json.gz')).read_bytes())
            self.assertEqual(hashlib.sha256(raw).hexdigest(), source['sha256'])
            payload = json.loads(raw)
            self.assertEqual(len(payload['records']), int(payload['records_found']))
            self.assertFalse(payload.get('warnings') or payload.get('errors'))
        self.assertEqual(set(evidence['eras']), {str(a) for a in builder.AGES})
        for regions in evidence['eras'].values():
            for region in regions:
                self.assertGreater(region['collections'], 0)
                self.assertTrue(region['sample_occurrences'])


unittest.main()
