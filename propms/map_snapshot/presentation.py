from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass


MY_MAPS_HEADER_CROP_PX = 68
MY_MAPS_BOTTOM_OVERSCAN_PX = 2
MY_MAPS_PRESENTATION_VERSION = 2

CAPTURE_VISIBLE_WIDTH_CSS_PX = 1047
CAPTURE_VISIBLE_HEIGHT_CSS_PX = 590

CAPTURE_VIEWPORT_WIDTH_CSS_PX = 1365
CAPTURE_VIEWPORT_HEIGHT_CSS_PX = 900

CAPTURE_DEVICE_SCALE_FACTOR = 2
CAPTURE_CLIP_SCALE = 1

CAPTURE_IMPLEMENTATION_VERSION = 1
CAPTURE_TEMPLATE_VERSION = 1


@dataclass(frozen=True)
class MapPresentation:
	map_kind: str
	crop_px: int
	bottom_overscan_px: int
	presentation_version: int
	visible_width_css_px: int
	visible_height_css_px: int
	viewport_width_css_px: int
	viewport_height_css_px: int
	device_scale_factor: int
	clip_scale: int
	capture_implementation_version: int
	capture_template_version: int

	def to_source_hash_payload(self, embed_url: str) -> dict[str, object]:
		return {
			"embed_url": (embed_url or "").strip(),
			"map_kind": self.map_kind,
			"crop_px": self.crop_px,
			"bottom_overscan_px": self.bottom_overscan_px,
			"presentation_version": self.presentation_version,
			"visible_width_css_px": self.visible_width_css_px,
			"visible_height_css_px": self.visible_height_css_px,
			"viewport_width_css_px": self.viewport_width_css_px,
			"viewport_height_css_px": self.viewport_height_css_px,
			"device_scale_factor": self.device_scale_factor,
			"clip_scale": self.clip_scale,
			"capture_implementation_version": self.capture_implementation_version,
			"capture_template_version": self.capture_template_version,
		}


STANDARD_MAP_PRESENTATION = MapPresentation(
	map_kind="google-maps",
	crop_px=0,
	bottom_overscan_px=0,
	presentation_version=0,
	visible_width_css_px=CAPTURE_VISIBLE_WIDTH_CSS_PX,
	visible_height_css_px=CAPTURE_VISIBLE_HEIGHT_CSS_PX,
	viewport_width_css_px=CAPTURE_VIEWPORT_WIDTH_CSS_PX,
	viewport_height_css_px=CAPTURE_VIEWPORT_HEIGHT_CSS_PX,
	device_scale_factor=CAPTURE_DEVICE_SCALE_FACTOR,
	clip_scale=CAPTURE_CLIP_SCALE,
	capture_implementation_version=CAPTURE_IMPLEMENTATION_VERSION,
	capture_template_version=CAPTURE_TEMPLATE_VERSION,
)
MY_MAPS_PRESENTATION = MapPresentation(
	map_kind="google-my-maps",
	crop_px=MY_MAPS_HEADER_CROP_PX,
	bottom_overscan_px=MY_MAPS_BOTTOM_OVERSCAN_PX,
	presentation_version=MY_MAPS_PRESENTATION_VERSION,
	visible_width_css_px=CAPTURE_VISIBLE_WIDTH_CSS_PX,
	visible_height_css_px=CAPTURE_VISIBLE_HEIGHT_CSS_PX,
	viewport_width_css_px=CAPTURE_VIEWPORT_WIDTH_CSS_PX,
	viewport_height_css_px=CAPTURE_VIEWPORT_HEIGHT_CSS_PX,
	device_scale_factor=CAPTURE_DEVICE_SCALE_FACTOR,
	clip_scale=CAPTURE_CLIP_SCALE,
	capture_implementation_version=CAPTURE_IMPLEMENTATION_VERSION,
	capture_template_version=CAPTURE_TEMPLATE_VERSION,
)


def normalize_map_kind(value: str | None) -> str:
	text = (value or "").strip().lower()
	if text == "google-my-maps":
		return "google-my-maps"
	if text == "google-maps":
		return "google-maps"
	return ""


def is_google_my_maps(value: str | None) -> bool:
	return normalize_map_kind(value) == "google-my-maps"


def get_map_kind_class(value: str | None) -> str:
	kind = normalize_map_kind(value)
	if not kind:
		return ""
	return kind.replace("_", "-")


def get_map_presentation(map_kind: str | None) -> MapPresentation:
	kind = normalize_map_kind(map_kind)
	if kind == "google-my-maps":
		return MY_MAPS_PRESENTATION
	return STANDARD_MAP_PRESENTATION


def build_map_source_hash(embed_url: str | None, map_kind: str | None) -> str:
	presentation = get_map_presentation(map_kind)
	payload = presentation.to_source_hash_payload(embed_url or "")
	encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
	return hashlib.sha256(encoded).hexdigest()


def get_map_presentation_context(map_kind: str | None) -> dict[str, object]:
	presentation = get_map_presentation(map_kind)
	return {
		"map_kind": presentation.map_kind,
		"map_kind_class": get_map_kind_class(presentation.map_kind),
		"my_maps_header_crop_px": presentation.crop_px,
		"my_maps_bottom_overscan_px": presentation.bottom_overscan_px,
		"my_maps_presentation_version": presentation.presentation_version,
		"capture_visible_width_css_px": presentation.visible_width_css_px,
		"capture_visible_height_css_px": presentation.visible_height_css_px,
		"capture_viewport_width_css_px": presentation.viewport_width_css_px,
		"capture_viewport_height_css_px": presentation.viewport_height_css_px,
		"capture_device_scale_factor": presentation.device_scale_factor,
		"capture_clip_scale": presentation.clip_scale,
		"capture_implementation_version": presentation.capture_implementation_version,
		"capture_template_version": presentation.capture_template_version,
		"presentation_descriptor": asdict(presentation),
	}
