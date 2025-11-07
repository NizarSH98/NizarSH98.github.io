#!/usr/bin/env python3
"""Generate an ATS-friendly PDF resume from the markdown source."""

from __future__ import annotations

import re
import textwrap
from pathlib import Path
from typing import List

PAGE_WIDTH = 612  # 8.5in * 72pt
PAGE_HEIGHT = 792  # 11in * 72pt
MARGIN_X = 48
MARGIN_TOP = 48
FONT_SIZE = 11
LINE_HEIGHT = 13
WRAP_WIDTH = 88

REPLACEMENTS = {
    "\u2013": "-",  # en dash
    "\u2014": "-",  # em dash
    "\u2022": "-",  # bullet
    "\u00b7": "-",  # middle dot
    "\u2019": "'",
    "\u2018": "'",
    "\u201c": '"',
    "\u201d": '"',
    "\u2122": "TM",
    "\u00ae": "(R)",
    "\u00a0": " ",
    "\u2082": "2",
}


def sanitize_text(text: str) -> str:
    for src, dst in REPLACEMENTS.items():
        text = text.replace(src, dst)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"__(.*?)__", r"\1", text)
    text = text.replace("*", "")
    text = text.replace("`", "")
    return text


def wrap_paragraph(text: str, *, initial_indent: str = "", subsequent_indent: str | None = None) -> List[str]:
    if subsequent_indent is None:
        subsequent_indent = initial_indent
    wrapper = textwrap.TextWrapper(width=WRAP_WIDTH, initial_indent=initial_indent, subsequent_indent=subsequent_indent, break_long_words=False, break_on_hyphens=True)
    return wrapper.wrap(text)


def parse_markdown(md_text: str) -> List[str]:
    lines: List[str] = []

    def add_blank_line() -> None:
        if lines and lines[-1] != "":
            lines.append("")

    for raw_line in md_text.splitlines():
        stripped = raw_line.strip()
        if not stripped:
            add_blank_line()
            continue

        sanitized = sanitize_text(stripped)

        if stripped.startswith("# "):
            add_blank_line()
            lines.append(sanitize_text(stripped[2:].upper()))
            add_blank_line()
        elif stripped.startswith("## "):
            add_blank_line()
            lines.append(sanitize_text(stripped[3:].upper()))
            add_blank_line()
        elif stripped.startswith("### "):
            add_blank_line()
            lines.extend(wrap_paragraph(sanitize_text(stripped[4:]), initial_indent="", subsequent_indent=""))
        elif stripped.startswith("- "):
            bullet_text = sanitize_text(stripped[2:])
            lines.extend(wrap_paragraph(bullet_text, initial_indent="  - ", subsequent_indent="    "))
        else:
            if stripped.startswith("*") and stripped.endswith("*"):
                sanitized = sanitize_text(stripped.strip("*"))
            lines.extend(wrap_paragraph(sanitized))

    while lines and lines[-1] == "":
        lines.pop()

    return lines


def escape_text(text: str) -> str:
    text = text.replace("\\", "\\\\")
    text = text.replace("(", "\\(")
    text = text.replace(")", "\\)")
    return text


def build_content_stream(lines: List[str]) -> str:
    commands: List[str] = [
        "BT",
        f"/F1 {FONT_SIZE} Tf",
        f"{LINE_HEIGHT} TL",
        f"{MARGIN_X} {PAGE_HEIGHT - MARGIN_TOP} Td",
    ]

    first = True
    for line in lines:
        if first:
            if line:
                commands.append(f"({escape_text(line)}) Tj")
            first = False
            continue
        commands.append("T*")
        if line:
            commands.append(f"({escape_text(line)}) Tj")

    commands.append("ET")
    return "\n".join(commands)


def paginate(lines: List[str]) -> List[List[str]]:
    usable_height = PAGE_HEIGHT - 2 * MARGIN_TOP
    max_lines = max(1, usable_height // LINE_HEIGHT)
    pages: List[List[str]] = []
    for idx in range(0, len(lines), max_lines):
        pages.append(lines[idx : idx + max_lines])
    return pages


def assemble_pdf(pages: List[List[str]]) -> bytes:
    objects: List[str | None] = [None, None]  # placeholders for catalog and pages
    page_refs: List[int] = []
    content_refs: List[int] = []

    def add_object(content: str) -> int:
        objects.append(content)
        return len(objects)

    def reserve_object() -> int:
        objects.append(None)
        return len(objects)

    for page_lines in pages:
        stream = build_content_stream(page_lines)
        stream_bytes = stream.encode("latin-1", errors="ignore")
        content_obj = f"<< /Length {len(stream_bytes)} >>\nstream\n{stream}\nendstream"
        content_id = add_object(content_obj)
        page_id = reserve_object()
        page_refs.append(page_id)
        content_refs.append(content_id)

    font_id = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    for page_id, content_id in zip(page_refs, content_refs):
        page_obj = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
            f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>"
        )
        objects[page_id - 1] = page_obj

    kids = " ".join(f"{ref} 0 R" for ref in page_refs)
    pages_obj = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_refs)} >>"
    objects[1] = pages_obj

    catalog_obj = "<< /Type /Catalog /Pages 2 0 R >>"
    objects[0] = catalog_obj

    pdf = bytearray()
    pdf.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

    offsets = [0]
    for obj_id, content in enumerate(objects, start=1):
        if content is None:
            raise ValueError(f"Object {obj_id} was not initialized")
        offset = len(pdf)
        offsets.append(offset)
        pdf.extend(f"{obj_id} 0 obj\n".encode("latin-1"))
        pdf.extend(content.encode("latin-1"))
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects)+1}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))

    pdf.extend(f"trailer << /Size {len(objects)+1} /Root 1 0 R >>\n".encode("latin-1"))
    pdf.extend(f"startxref\n{xref_offset}\n%%EOF".encode("latin-1"))
    return bytes(pdf)


def main() -> None:
    source = Path("content/resume/resume.md")
    output = Path("static/resume/Nizar_Shehayeb_Resume.pdf")

    if not source.exists():
        raise SystemExit(f"Resume source not found: {source}")

    lines = parse_markdown(source.read_text(encoding="utf-8"))
    if not lines:
        raise SystemExit("Resume markdown is empty")

    pages = paginate(lines)
    pdf_bytes = assemble_pdf(pages)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(pdf_bytes)
    print(f"Generated {output} ({len(pdf_bytes)} bytes, {len(pages)} page(s))")


if __name__ == "__main__":
    main()
