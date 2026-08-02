from __future__ import annotations

import json
import os
import subprocess
import sys
import textwrap
from pathlib import Path

from frappe.tests.utils import FrappeTestCase


class TestMapSnapshotImportIsolation(FrappeTestCase):
	@staticmethod
	def _pythonpath() -> str:
		bench_apps = Path(__file__).resolve().parents[3]
		return os.pathsep.join([str(bench_apps), str(bench_apps / "propms")])

	def _run_subprocess(self, code: str) -> dict[str, object]:
		env = os.environ.copy()
		env["PYTHONPATH"] = self._pythonpath()
		result = subprocess.run(
			[sys.executable, "-c", code],
			check=True,
			capture_output=True,
			text=True,
			env=env,
		)
		return json.loads(result.stdout)

	def test_migration_imports_do_not_require_pillow(self):
		code = textwrap.dedent(
			"""
			import importlib
			import json
			import sys

			for name in list(sys.modules):
			    if name == "PIL" or name.startswith("PIL."):
			        sys.modules.pop(name, None)
			sys.modules["PIL"] = None
			sys.modules["PIL.Image"] = None

			importlib.import_module("propms.patches.v1_0.migrate_google_maps_embed_html_to_custom_map_embed_url")
			importlib.import_module("propms.map_snapshot.legacy_migration")

			print(json.dumps({
			    "capture_loaded": "propms.map_snapshot.capture" in sys.modules,
			    "pil_loaded": any(
			        name == "PIL" or name.startswith("PIL.")
			        for name, module in sys.modules.items()
			        if module is not None
			    ),
			}))
			"""
		)
		result = self._run_subprocess(code)
		self.assertFalse(result["capture_loaded"])
		self.assertFalse(result["pil_loaded"])

	def test_capture_import_succeeds_with_runtime_pillow(self):
		from PIL import Image
		from propms.map_snapshot.capture import capture_map_png

		self.assertTrue(callable(capture_map_png))
		self.assertTrue(hasattr(Image, "open"))

	def test_capture_execution_boundary_still_requires_pillow(self):
		code = textwrap.dedent(
			"""
			import importlib
			import json
			import sys

			for name in list(sys.modules):
			    if name == "PIL" or name.startswith("PIL."):
			        sys.modules.pop(name, None)
			sys.modules["PIL"] = None
			sys.modules["PIL.Image"] = None

			jobs = importlib.import_module("propms.map_snapshot.jobs")
			capture_loaded_before = "propms.map_snapshot.capture" in sys.modules
			try:
			    jobs.capture_map_png("PI-TEST", "property-location")
			except Exception as exc:
			    payload = {
			        "exception_type": type(exc).__name__,
			        "exception_text": str(exc),
			        "capture_loaded_before": capture_loaded_before,
			        "capture_loaded_after": "propms.map_snapshot.capture" in sys.modules,
			    }
			else:
			    payload = {
			        "exception_type": None,
			        "exception_text": "",
			        "capture_loaded_before": capture_loaded_before,
			        "capture_loaded_after": "propms.map_snapshot.capture" in sys.modules,
			    }

			print(json.dumps(payload))
			"""
		)
		result = self._run_subprocess(code)
		self.assertFalse(result["capture_loaded_before"])
		self.assertEqual(result["exception_type"], "ModuleNotFoundError")
		self.assertIn("PIL", result["exception_text"])
