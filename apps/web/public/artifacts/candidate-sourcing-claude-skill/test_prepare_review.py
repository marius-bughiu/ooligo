"""Run with python3 -B test_prepare_review.py from the extracted bundle."""
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest

ROOT = Path(__file__).resolve().parent
BRIEF = (ROOT / "examples" / "brief.json").read_text(encoding="utf-8")
COMMAND = [sys.executable, str(ROOT / "prepare_review.py")]


class EvidenceWorksheetChecks(unittest.TestCase):
    def test_example_matches_published_output(self):
        result = subprocess.run(COMMAND + [str(ROOT / "examples" / "brief.json")],
                                check=True, capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(result.stdout, (ROOT / "examples" / "expected-review.json").read_text(encoding="utf-8"))

    def check_rejected(self, text):
        with TemporaryDirectory() as folder:
            path = Path(folder) / "brief.json"
            path.write_text(text, encoding="utf-8")
            result = subprocess.run(COMMAND + [str(path)], capture_output=True)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(result.stdout, b"")

    def test_conflicting_hold_marker_cannot_release_an_excerpt(self):
        self.check_rejected(BRIEF.replace('"use": "hold"', '"use": "hold", "use": "review"'))

    def test_ambiguous_records_leave_no_partial_worksheet(self):
        for field, value in (("id", "C-03"), ("use", "pending"), ("source", "")):
            with self.subTest(field=field):
                brief = json.loads(BRIEF)
                brief["profiles"][0][field] = value
                self.check_rejected(json.dumps(brief))


if __name__ == "__main__":
    unittest.main()
