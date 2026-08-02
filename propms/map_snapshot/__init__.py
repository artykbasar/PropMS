from importlib import import_module
from typing import TYPE_CHECKING

__all__ = [
	"CAPTURE_CLIP_SCALE",
	"CAPTURE_DEVICE_SCALE_FACTOR",
	"CAPTURE_IMPLEMENTATION_VERSION",
	"CAPTURE_TEMPLATE_VERSION",
	"CAPTURE_VIEWPORT_HEIGHT_CSS_PX",
	"CAPTURE_VIEWPORT_WIDTH_CSS_PX",
	"CAPTURE_VISIBLE_HEIGHT_CSS_PX",
	"CAPTURE_VISIBLE_WIDTH_CSS_PX",
	"CaptureMapReference",
	"MAX_CAPTURE_DOCUMENT_BYTES",
	"MapSnapshotManifestEntry",
	"MY_MAPS_HEADER_CROP_PX",
	"MY_MAPS_PRESENTATION_VERSION",
	"MapCaptureResult",
	"ResolvedMap",
	"SNAPSHOT_STATUS_FAILED",
	"SNAPSHOT_STATUS_NOT_REQUIRED",
	"SNAPSHOT_STATUS_OPTIONS",
	"SNAPSHOT_STATUS_PENDING",
	"SNAPSHOT_STATUS_PROCESSING",
	"SNAPSHOT_STATUS_READY",
	"build_map_source_hash",
	"build_manifest_entries",
	"build_manifest_hash",
	"capture_property_instruction_maps",
	"capture_map_png",
	"get_all_map_snapshot_targets",
	"get_map_presentation",
	"get_map_snapshot_target",
	"is_google_my_maps",
	"is_snapshot_current",
	"normalize_map_kind",
	"queue_snapshot_generation",
	"resolve_capture_map",
]

_LAZY_ATTRS = {
	"CAPTURE_CLIP_SCALE": "presentation",
	"CAPTURE_DEVICE_SCALE_FACTOR": "presentation",
	"CAPTURE_IMPLEMENTATION_VERSION": "presentation",
	"CAPTURE_TEMPLATE_VERSION": "presentation",
	"CAPTURE_VIEWPORT_HEIGHT_CSS_PX": "presentation",
	"CAPTURE_VIEWPORT_WIDTH_CSS_PX": "presentation",
	"CAPTURE_VISIBLE_HEIGHT_CSS_PX": "presentation",
	"CAPTURE_VISIBLE_WIDTH_CSS_PX": "presentation",
	"CaptureMapReference": "resolver",
	"MAX_CAPTURE_DOCUMENT_BYTES": "capture",
	"MapSnapshotManifestEntry": "manifest",
	"MY_MAPS_HEADER_CROP_PX": "presentation",
	"MY_MAPS_PRESENTATION_VERSION": "presentation",
	"MapCaptureResult": "capture",
	"ResolvedMap": "resolver",
	"SNAPSHOT_STATUS_FAILED": "manifest",
	"SNAPSHOT_STATUS_NOT_REQUIRED": "manifest",
	"SNAPSHOT_STATUS_OPTIONS": "manifest",
	"SNAPSHOT_STATUS_PENDING": "manifest",
	"SNAPSHOT_STATUS_PROCESSING": "manifest",
	"SNAPSHOT_STATUS_READY": "manifest",
	"build_map_source_hash": "presentation",
	"build_manifest_entries": "manifest",
	"build_manifest_hash": "manifest",
	"capture_property_instruction_maps": "jobs",
	"capture_map_png": "capture",
	"get_all_map_snapshot_targets": "manifest",
	"get_map_presentation": "presentation",
	"get_map_snapshot_target": "manifest",
	"is_google_my_maps": "presentation",
	"is_snapshot_current": "manifest",
	"normalize_map_kind": "presentation",
	"queue_snapshot_generation": "jobs",
	"resolve_capture_map": "resolver",
}


def __getattr__(name):
	module_name = _LAZY_ATTRS.get(name)
	if not module_name:
		raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
	module = import_module(f"{__name__}.{module_name}")
	value = getattr(module, name)
	globals()[name] = value
	return value


if TYPE_CHECKING:
	from .capture import MAX_CAPTURE_DOCUMENT_BYTES, MapCaptureResult, capture_map_png
	from .jobs import capture_property_instruction_maps, queue_snapshot_generation
	from .manifest import (
		SNAPSHOT_STATUS_FAILED,
		SNAPSHOT_STATUS_NOT_REQUIRED,
		SNAPSHOT_STATUS_OPTIONS,
		SNAPSHOT_STATUS_PENDING,
		SNAPSHOT_STATUS_PROCESSING,
		SNAPSHOT_STATUS_READY,
		MapSnapshotManifestEntry,
		build_manifest_entries,
		build_manifest_hash,
		get_all_map_snapshot_targets,
		get_map_snapshot_target,
		is_snapshot_current,
	)
	from .presentation import (
		CAPTURE_CLIP_SCALE,
		CAPTURE_DEVICE_SCALE_FACTOR,
		CAPTURE_IMPLEMENTATION_VERSION,
		CAPTURE_TEMPLATE_VERSION,
		CAPTURE_VIEWPORT_HEIGHT_CSS_PX,
		CAPTURE_VIEWPORT_WIDTH_CSS_PX,
		CAPTURE_VISIBLE_HEIGHT_CSS_PX,
		CAPTURE_VISIBLE_WIDTH_CSS_PX,
		MY_MAPS_HEADER_CROP_PX,
		MY_MAPS_PRESENTATION_VERSION,
		build_map_source_hash,
		get_map_presentation,
		is_google_my_maps,
		normalize_map_kind,
	)
	from .resolver import CaptureMapReference, ResolvedMap, resolve_capture_map
