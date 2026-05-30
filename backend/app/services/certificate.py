import io
import logging
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from app.services.storage import storage_service

logger = logging.getLogger(__name__)

class CertificateService:
    @staticmethod
    async def generate_adoption_certificate(
        tree_name: str,
        adopter_name: str,
        occasion: str,
        dedication_message: str,
        farm_name: str,
        location: str,
        adoption_date: str
    ) -> str:
        """
        Generates a premium landscape PDF certificate using ReportLab,
        saves it to our file storage service, and returns the file URL.
        """
        logger.info(f"Generating physical PDF certificate for tree naming ceremony: {tree_name}")
        
        # Create an in-memory buffer to generate PDF bytes
        buffer = io.BytesIO()
        
        # Establish landscape document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        
        story = []
        styles = getSampleStyleSheet()
        
        # Define high-end custom typography/colors
        primary_color = colors.HexColor("#1b4332") # Dark green forest tone
        secondary_color = colors.HexColor("#40916c") # Muted green
        accent_color = colors.HexColor("#d8f3dc") # Light nature cream
        text_dark = colors.HexColor("#2d6a4f")
        
        title_style = ParagraphStyle(
            'CertTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=34,
            textColor=primary_color,
            alignment=1, # Center
            spaceAfter=15
        )
        
        sub_title_style = ParagraphStyle(
            'CertSubTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=16,
            textColor=secondary_color,
            alignment=1,
            spaceAfter=25
        )
        
        body_style = ParagraphStyle(
            'CertBody',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=20,
            textColor=text_dark,
            alignment=1,
            spaceAfter=15
        )
        
        meta_style = ParagraphStyle(
            'CertMeta',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=12,
            textColor=primary_color,
            alignment=1,
            spaceAfter=10
        )
        
        dedication_style = ParagraphStyle(
            'CertDedication',
            parent=styles['Normal'],
            fontName='Times-Italic',
            fontSize=14,
            textColor=colors.HexColor("#52b788"),
            alignment=1,
            spaceAfter=25
        )

        # Assemble certificate elements
        story.append(Spacer(1, 20))
        story.append(Paragraph("CERTIFICATE OF DIGITAL ADOPTION", title_style))
        story.append(Paragraph("This certifies a lifelong connection with nature", sub_title_style))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph(f"Presented proudly to <b>{adopter_name}</b>", body_style))
        story.append(Paragraph(f"Who has adopted and named their tree:", meta_style))
        story.append(Paragraph(f"🌲 <b>{tree_name}</b> 🌲", title_style))
        
        if occasion:
            story.append(Paragraph(f"On the beautiful occasion of: <i>{occasion}</i>", meta_style))
        
        if dedication_message:
            story.append(Paragraph(f"\"{dedication_message}\"", dedication_style))
            
        story.append(Spacer(1, 15))
        story.append(Paragraph(f"Located at: <b>{farm_name}</b> ({location})", meta_style))
        story.append(Paragraph(f"Adoption Date: {adoption_date}", meta_style))
        
        # Custom elegant green signature border drawing
        d = Drawing(700, 40)
        # Decorative divider line
        d.add(Line(50, 20, 650, 20, strokeColor=secondary_color, strokeWidth=2))
        story.append(d)
        
        # Build document
        doc.build(story)
        
        # Fetch PDF bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        # Upload using storage service
        filename = f"cert_{tree_name.lower().replace(' ', '_')}.pdf"
        file_url = await storage_service.upload_bytes(pdf_bytes, filename=filename, folder="certificates")
        
        logger.info(f"Certificate successfully generated and saved at URL: {file_url}")
        return file_url
