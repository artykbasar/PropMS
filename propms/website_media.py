from __future__ import annotations

import io
import json
import os
from dataclasses import dataclass
from html import escape
from pathlib import Path

import frappe
from frappe import _
from frappe.utils import cint
from PIL import Image, ImageOps


MEDIA_VERSION = 1
SUPPORTED_SOURCE_FORMATS = {"JPEG", "PNG", "WEBP", "AVIF"}
DERIVATIVE_FORMATS = ("AVIF", "WEBP", "FALLBACK")
MAX_SOURCE_BYTES = 12 * 1024 * 1024
HERO_MIN_WIDTH = 1600
SOCIAL_RATIO = 1200 / 630
SOCIAL_RATIO_TOLERANCE = 0.03


@dataclass(frozen=True)
class MediaProfile:
    width: int
    height: int | None = None
    crop: bool = False


PROFILES = {
    "thumbnail": MediaProfile(320),
    "card": MediaProfile(640),
    "content": MediaProfile(960),
    "hero-mobile": MediaProfile(768),
    "hero-tablet": MediaProfile(1280),
    "hero-desktop": MediaProfile(1920),
    "social-preview": MediaProfile(1200, 630, crop=True),
}


def enqueue_media_generation(doc, method=None) -> None:
    """Queue derivatives for a newly uploaded website-capable image."""
    if cint(doc.get("website_media_is_derivative")) or doc.is_folder:
        return
    if not cint(doc.get("website_media_enabled")):
        return
    if doc.get("website_media_status") in {"processing", "ready"}:
        return
    if not _looks_like_supported_image(doc.file_name):
        frappe.db.set_value("File", doc.name, "website_media_status", "unsupported", update_modified=False)
        return
    frappe.db.set_value("File", doc.name, "website_media_status", "pending", update_modified=False)
    frappe.enqueue(
        "propms.website_media.generate_media_derivatives",
        queue="short",
        enqueue_after_commit=True,
        job_id=f"propms-media:{frappe.local.site}:{doc.name}",
        deduplicate=True,
        file_name=doc.name,
    )


def generate_media_derivatives(file_name: str) -> dict:
    """Generate all fixed responsive profiles for one original File."""
    source = frappe.get_doc("File", file_name)
    if cint(source.get("website_media_is_derivative")):
        return {}

    _set_source_state(source.name, status="processing", error=None)
    _delete_existing_derivatives(source.name)
    try:
        content = source.get_content()
        if isinstance(content, str):
            content = content.encode()
        image = _open_source_image(content)
        source_width, source_height = image.size
        derivatives = _generate_all_profiles(source, image)
        metadata = _build_metadata(source_width, source_height, derivatives)
        _set_source_state(
            source.name,
            status="ready",
            error=None,
            width=source_width,
            height=source_height,
            metadata=metadata,
        )
        return metadata
    except Exception as exc:
        _delete_existing_derivatives(source.name)
        _set_source_state(source.name, status="failed", error=str(exc)[:500])
        frappe.log_error(frappe.get_traceback(), "PropMS website media optimisation failed")
        return {}


def resolve_media(file_url: str, usage: str = "content") -> dict:
    """Resolve already-generated media metadata without doing image work."""
    source = _get_source_file(file_url)
    if not source:
        return {"src": file_url, "width": None, "height": None, "sources": []}
    metadata = _parse_metadata(source.get("website_media_derivatives"))
    if not metadata:
        return {
            "src": source.file_url,
            "width": source.get("website_media_width"),
            "height": source.get("website_media_height"),
            "sources": [],
        }

    profiles = _profiles_for_usage(usage)
    derivatives = [d for d in metadata.get("derivatives", []) if d.get("profile") in profiles]
    fallback = _largest_derivative(derivatives, "fallback")
    return {
        "src": fallback.get("file_url") if fallback else source.file_url,
        "width": fallback.get("width") if fallback else metadata.get("width"),
        "height": fallback.get("height") if fallback else metadata.get("height"),
        "aspect_ratio": metadata.get("aspect_ratio"),
        "sources": _group_sources(derivatives, usage),
    }


def render_responsive_image(
    file_url: str,
    alt: str = "",
    *,
    usage: str = "content",
    decorative: bool = False,
    css_class: str = "",
) -> str:
    """Render responsive picture markup from stored derivative metadata."""
    validate_image_text_policy(file_url, alt=alt, decorative=decorative)
    media = resolve_media(file_url, usage=usage)
    loading = "eager" if usage == "hero" else "lazy"
    fetchpriority = ' fetchpriority="high"' if usage == "hero" else ""
    alt_text = "" if decorative else alt
    class_attr = f' class="{escape(css_class, quote=True)}"' if css_class else ""
    width = f' width="{int(media["width"])}"' if media.get("width") else ""
    height = f' height="{int(media["height"])}"' if media.get("height") else ""
    source_html = "".join(
        f'<source type="image/{fmt}" srcset="{escape(data["srcset"], quote=True)}" sizes="{escape(data["sizes"], quote=True)}">'
        for fmt, data in media.get("sources", [])
    )
    img = (
        f'<img src="{escape(media["src"], quote=True)}" alt="{escape(alt_text, quote=True)}"'
        f'{width}{height} loading="{loading}"{fetchpriority}{class_attr}>'
    )
    return f"<picture>{source_html}{img}</picture>"


def validate_image_text_policy(file_url: str, *, alt: str, decorative: bool = False) -> None:
    if decorative:
        return
    if not alt or not alt.strip():
        frappe.throw(_("Meaningful website images require alternative text"))


def validate_media_for_usage(file_url: str, usage: str) -> None:
    source = _get_source_file(file_url)
    if not source:
        frappe.throw(_("Website image must reference a Frappe File"))
    status = source.get("website_media_status")
    if status in {"failed", "unsupported"}:
        frappe.throw(_("Website image optimisation failed; replace or regenerate this image"))
    if status != "ready":
        frappe.throw(_("Website image optimisation must finish before publishing"))
    width = cint(source.get("website_media_width"))
    height = cint(source.get("website_media_height"))
    if cint(source.file_size) > MAX_SOURCE_BYTES:
        frappe.throw(_("Website image is too large; upload an image smaller than 12 MB"))
    if usage == "hero" and width and width < HERO_MIN_WIDTH:
        frappe.throw(_("Hero image is undersized; use an image at least {0}px wide").format(HERO_MIN_WIDTH))
    if usage == "social-preview" and width and height:
        ratio = width / height
        if abs(ratio - SOCIAL_RATIO) / SOCIAL_RATIO > SOCIAL_RATIO_TOLERANCE:
            frappe.throw(_("Social preview image must use approximately a 1200:630 aspect ratio"))


def _generate_all_profiles(source, image: Image.Image) -> list[dict]:
    derivatives = []
    for profile_name, profile in PROFILES.items():
        rendered = _resize_for_profile(image, profile)
        for output_format in DERIVATIVE_FORMATS:
            saved = _save_derivative(source, rendered, profile_name, output_format)
            derivatives.append(saved)
    return derivatives


def _resize_for_profile(image: Image.Image, profile: MediaProfile) -> Image.Image:
    source = ImageOps.exif_transpose(image)
    if profile.crop and profile.height:
        return ImageOps.fit(source, (profile.width, profile.height), method=Image.Resampling.LANCZOS)
    resized = source.copy()
    resized.thumbnail((profile.width, profile.width * 8), Image.Resampling.LANCZOS)
    return resized


def _save_derivative(source, image: Image.Image, profile: str, output_format: str) -> dict:
    fmt, extension = _format_for_output(source, image, output_format)
    payload = _encode_image(image, fmt)
    stem = Path(source.file_name).stem[:80]
    derivative_name = f"{stem}--propms-{profile}.{extension}"
    file_doc = frappe.get_doc(
        {
            "doctype": "File",
            "file_name": derivative_name,
            "is_private": source.is_private,
            "attached_to_doctype": "File",
            "attached_to_name": source.name,
            "content": payload,
            "website_media_is_derivative": 1,
            "website_media_source_file": source.name,
            "website_media_profile": profile,
            "website_media_format": fmt.lower(),
        }
    )
    file_doc.flags.ignore_permissions = True
    file_doc.insert()
    return {
        "file": file_doc.name,
        "file_url": file_doc.file_url,
        "profile": profile,
        "format": fmt.lower(),
        "width": image.width,
        "height": image.height,
        "file_size": file_doc.file_size,
    }


def _format_for_output(source, image: Image.Image, output_format: str) -> tuple[str, str]:
    if output_format == "AVIF":
        return "AVIF", "avif"
    if output_format == "WEBP":
        return "WEBP", "webp"
    if image.mode in {"RGBA", "LA", "P"} or source.file_name.lower().endswith(".png"):
        return "PNG", "png"
    return "JPEG", "jpg"


def _encode_image(image: Image.Image, fmt: str) -> bytes:
    output = io.BytesIO()
    prepared = image
    if fmt == "JPEG" and image.mode not in {"RGB", "L"}:
        prepared = image.convert("RGB")
    options = {"quality": 82}
    if fmt == "PNG":
        options = {"optimize": True}
    elif fmt == "AVIF":
        options = {"quality": 55}
    prepared.save(output, format=fmt, **options)
    return output.getvalue()


def _build_metadata(width: int, height: int, derivatives: list[dict]) -> dict:
    return {
        "version": MEDIA_VERSION,
        "width": width,
        "height": height,
        "aspect_ratio": round(width / height, 6),
        "derivatives": derivatives,
    }


def _set_source_state(name: str, *, status: str, error=None, width=None, height=None, metadata=None) -> None:
    values = {"website_media_status": status, "website_media_error": error or ""}
    if width:
        values["website_media_width"] = width
    if height:
        values["website_media_height"] = height
    if width and height:
        values["website_media_aspect_ratio"] = f"{width}:{height}"
    if metadata is not None:
        values["website_media_derivatives"] = frappe.as_json(metadata)
    frappe.db.set_value("File", name, values, update_modified=False)


def _open_source_image(content: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(content))
    if image.format not in SUPPORTED_SOURCE_FORMATS:
        frappe.throw(_("Unsupported website image format: {0}").format(image.format or "unknown"))
    image.load()
    return image


def _get_source_file(file_url: str):
    if not file_url:
        return None
    fields = [
        "name", "file_url", "file_name", "file_size", "is_private",
        "website_media_status", "website_media_width", "website_media_height",
        "website_media_derivatives",
    ]
    sources = frappe.get_all(
        "File",
        filters={"file_url": file_url, "website_media_is_derivative": 0},
        fields=fields,
        order_by="creation asc",
    )
    return next((source for source in sources if source.website_media_status == "ready"), None) or (
        sources[0] if sources else None
    )


def _parse_metadata(value) -> dict:
    if not value:
        return {}
    try:
        parsed = json.loads(value) if isinstance(value, str) else value
    except (TypeError, ValueError):
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _profiles_for_usage(usage: str) -> tuple[str, ...]:
    mapping = {
        "thumbnail": ("thumbnail",),
        "card": ("thumbnail", "card"),
        "content": ("card", "content"),
        "hero": ("hero-mobile", "hero-tablet", "hero-desktop"),
        "social-preview": ("social-preview",),
    }
    if usage not in mapping:
        frappe.throw(_("Unsupported website media usage: {0}").format(usage))
    return mapping[usage]


def _group_sources(derivatives: list[dict], usage: str) -> list[tuple[str, dict]]:
    grouped = []
    sizes = _sizes_for_usage(usage)
    for fmt in ("avif", "webp"):
        items = sorted((d for d in derivatives if d.get("format") == fmt), key=lambda d: d.get("width") or 0)
        if items:
            grouped.append((fmt, {"srcset": ", ".join(f'{d["file_url"]} {d["width"]}w' for d in items), "sizes": sizes}))
    return grouped


def _sizes_for_usage(usage: str) -> str:
    return {
        "thumbnail": "320px",
        "card": "(max-width: 768px) 100vw, 640px",
        "content": "(max-width: 900px) 100vw, 50vw",
        "hero": "100vw",
        "social-preview": "1200px",
    }[usage]


def _largest_derivative(derivatives: list[dict], fmt: str):
    matches = [d for d in derivatives if d.get("format") in {fmt, "jpeg", "png"}]
    return max(matches, key=lambda d: d.get("width") or 0, default=None)


def _looks_like_supported_image(file_name: str | None) -> bool:
    extension = os.path.splitext((file_name or "").lower())[1]
    return extension in {".jpg", ".jpeg", ".png", ".webp", ".avif"}


def _delete_existing_derivatives(source_name: str) -> None:
    names = frappe.get_all(
        "File",
        filters={
            "website_media_is_derivative": 1,
            "website_media_source_file": source_name,
        },
        pluck="name",
    )
    for name in names:
        frappe.delete_doc("File", name, ignore_permissions=True, force=True)
