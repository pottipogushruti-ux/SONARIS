"""
SONARIS Report Generation Service

Generates a professional PDF mission report using ReportLab.
"""
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
)

from ai.model_loader import model_info
from config import (
    REPORTS_DIR, RISK_DISCLAIMER, CONFIDENCE_DISCLAIMER, HISTORICAL_DISCLAIMER,
)


def generate_pdf_report(mission, detections) -> str:
    """
    mission: models.Mission ORM instance
    detections: list of models.Detection ORM instances
    Returns the absolute path to the generated PDF.
    """
    out_path = os.path.join(REPORTS_DIR, f"{mission.mission_id}.pdf")
    doc = SimpleDocTemplate(out_path, pagesize=A4, topMargin=1.5 * cm, bottomMargin=1.5 * cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "SonarisTitle", parent=styles["Title"], textColor=colors.HexColor("#0B3D66")
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer", parent=styles["Normal"], fontSize=8, textColor=colors.grey,
    )

    story = []

    story.append(Paragraph("SONARIS", title_style))
    story.append(Paragraph("AI-Powered Underwater Anomaly Detection System", styles["Normal"]))
    story.append(Spacer(1, 0.6 * cm))

    minfo = model_info()

    meta_rows = [
        ["Mission ID", mission.mission_id],
        ["Date / Time", mission.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")],
        ["Image Name", mission.image_name],
        ["Analysis Mode", mission.analysis_mode],
        ["Processing Time", f"{mission.processing_time_ms} ms"],
        ["Model", f"{minfo['name']} (v{minfo['version']}, mode={minfo['mode']})"],
        ["Location Source", mission.location_source],
    ]
    meta_table = Table(meta_rows, colWidths=[5 * cm, 10 * cm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EAF1F8")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.8 * cm))

    story.append(Paragraph("Detection Summary", styles["Heading2"]))
    det_header = ["Object", "Confidence", "Risk", "Coordinates", "Verification"]
    det_rows = [det_header]
    for d in detections:
        coords = (
            f"{d.latitude:.5f}, {d.longitude:.5f}"
            if d.latitude is not None and d.longitude is not None
            else f"N/A ({d.location_source})"
        )
        det_rows.append([
            d.object_class,
            f"{round(d.confidence * 100)}%",
            d.risk,
            coords,
            d.verification_status,
        ])

    if len(det_rows) == 1:
        det_rows.append(["No detections above threshold", "-", "-", "-", "-"])

    det_table = Table(det_rows, colWidths=[3.6 * cm, 2.4 * cm, 2 * cm, 4 * cm, 3.5 * cm])
    det_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B3D66")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F8FB")]),
    ]))
    story.append(det_table)
    story.append(Spacer(1, 0.8 * cm))

    # --- Images ---------------------------------------------------------
    processed_dir = os.path.join(REPORTS_DIR, "..", "processed", mission.mission_id)
    original_path = os.path.join(processed_dir, "original.png")
    annotated_path = os.path.join(processed_dir, "annotated.png")

    story.append(Paragraph("Sonar Imagery", styles["Heading2"]))
    img_row = []
    if os.path.exists(original_path):
        img_row.append(_labelled_image(original_path, "Original", styles))
    if os.path.exists(annotated_path):
        img_row.append(_labelled_image(annotated_path, "Annotated", styles))
    if img_row:
        img_table = Table([img_row])
        story.append(img_table)
    story.append(Spacer(1, 0.6 * cm))

    story.append(Paragraph("Preprocessing", styles["Heading2"]))
    story.append(Paragraph(
        "Pipeline applied: grayscale conversion, non-local-means denoising, "
        "CLAHE contrast enhancement, and min-max intensity normalization.",
        styles["Normal"],
    ))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("Notes", styles["Heading2"]))
    story.append(Paragraph(
        "This report was generated automatically by SONARIS. Detections marked "
        "REQUIRES_EXPERT_REVIEW have not been confirmed by a human operator.",
        styles["Normal"],
    ))
    story.append(Spacer(1, 0.6 * cm))

    story.append(Paragraph("Disclaimers", styles["Heading2"]))
    for text in (RISK_DISCLAIMER, CONFIDENCE_DISCLAIMER, HISTORICAL_DISCLAIMER):
        story.append(Paragraph(text, disclaimer_style))
        story.append(Spacer(1, 0.15 * cm))

    doc.build(story)
    return out_path


def _labelled_image(path, label, styles):
    from reportlab.platypus import Table as _T
    img = RLImage(path, width=7.5 * cm, height=5.6 * cm)
    return img
