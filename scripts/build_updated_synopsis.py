from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Tenantly_Updated_Synopsis.pdf"
REFERENCE_PDF = Path("C:/Users/User/Downloads/2440107 WORK DONE DIARY.docx.pdf")
LOGO_PATH = ROOT / "tmp" / "pdfs" / "cover-reference" / "christ-logo.png"

PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#16233B")
BLUE = colors.HexColor("#2E5B91")
PALE = colors.HexColor("#EEF4FA")
INK = colors.HexColor("#18202B")
MUTED = colors.HexColor("#5A6675")
RULE = colors.HexColor("#C9D3DF")
GREEN = colors.HexColor("#31725C")
AMBER = colors.HexColor("#91652D")


def register_fonts() -> tuple[str, str, str]:
    candidates = [
        (
            Path("C:/Windows/Fonts/arial.ttf"),
            Path("C:/Windows/Fonts/arialbd.ttf"),
            Path("C:/Windows/Fonts/ariali.ttf"),
        ),
        (
            Path("C:/Windows/Fonts/calibri.ttf"),
            Path("C:/Windows/Fonts/calibrib.ttf"),
            Path("C:/Windows/Fonts/calibrii.ttf"),
        ),
    ]
    for regular, bold, italic in candidates:
        if all(p.exists() for p in (regular, bold, italic)):
            pdfmetrics.registerFont(TTFont("DocRegular", str(regular)))
            pdfmetrics.registerFont(TTFont("DocBold", str(bold)))
            pdfmetrics.registerFont(TTFont("DocItalic", str(italic)))
            return "DocRegular", "DocBold", "DocItalic"
    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"


REGULAR, BOLD, ITALIC = register_fonts()


class SynopsisDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=23 * mm,
            rightMargin=23 * mm,
            topMargin=24 * mm,
            bottomMargin=19 * mm,
            title="Tenantly - Updated Synopsis",
            author="Avalbir Singh Banga",
            subject="Computer Science Project synopsis",
        )
        body_frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="body",
        )
        self.addPageTemplates(PageTemplate(id="main", frames=[body_frame], onPage=draw_page))


def draw_page(canvas, doc):
    canvas.saveState()
    page = canvas.getPageNumber()
    if page == 1:
        pass
    else:
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.6)
        canvas.line(doc.leftMargin, PAGE_H - 15 * mm, PAGE_W - doc.rightMargin, PAGE_H - 15 * mm)
        canvas.setFont(REGULAR, 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(doc.leftMargin, PAGE_H - 11.8 * mm, "TENANTLY - UPDATED SYNOPSIS")
        canvas.drawRightString(PAGE_W - doc.rightMargin, PAGE_H - 11.8 * mm, "CSC481-5")
        canvas.line(doc.leftMargin, 13 * mm, PAGE_W - doc.rightMargin, 13 * mm)
        canvas.drawString(doc.leftMargin, 8.8 * mm, "Avalbir Singh Banga | 2440114")
        canvas.drawRightString(PAGE_W - doc.rightMargin, 8.8 * mm, str(page - 1))
    canvas.restoreState()


base = getSampleStyleSheet()
styles = {
    "cover_institution": ParagraphStyle(
        "cover_institution", fontName="Times-Bold", fontSize=16.5, leading=21,
        textColor=colors.black, alignment=TA_CENTER, spaceAfter=1.5 * mm,
    ),
    "cover_department": ParagraphStyle(
        "cover_department", fontName="Times-Bold", fontSize=13.5, leading=17,
        textColor=colors.black, alignment=TA_CENTER, spaceAfter=10 * mm,
    ),
    "cover_document": ParagraphStyle(
        "cover_document", fontName="Times-Bold", fontSize=19, leading=23,
        textColor=colors.black, alignment=TA_CENTER, spaceAfter=7 * mm,
    ),
    "cover_project": ParagraphStyle(
        "cover_project", fontName="Times-Bold", fontSize=14.2, leading=18,
        textColor=colors.black, alignment=TA_CENTER, spaceAfter=17 * mm,
    ),
    "cover_meta": ParagraphStyle(
        "cover_meta", fontName="Times-Roman", fontSize=12, leading=17,
        textColor=colors.black, alignment=TA_CENTER,
    ),
    "cover_emphasis": ParagraphStyle(
        "cover_emphasis", fontName="Times-Bold", fontSize=12.3, leading=17,
        textColor=colors.black, alignment=TA_CENTER,
    ),
    "h1": ParagraphStyle(
        "h1", fontName=BOLD, fontSize=17, leading=21, textColor=NAVY,
        spaceBefore=1 * mm, spaceAfter=4 * mm, keepWithNext=True,
    ),
    "h2": ParagraphStyle(
        "h2", fontName=BOLD, fontSize=11.5, leading=15, textColor=BLUE,
        spaceBefore=3.5 * mm, spaceAfter=1.8 * mm, keepWithNext=True,
    ),
    "body": ParagraphStyle(
        "body", fontName=REGULAR, fontSize=9.4, leading=14.2, textColor=INK,
        alignment=TA_JUSTIFY, spaceAfter=2.4 * mm,
    ),
    "bullet": ParagraphStyle(
        "bullet", parent=None, fontName=REGULAR, fontSize=9.2, leading=13.5,
        textColor=INK, leftIndent=5 * mm, firstLineIndent=-3.6 * mm,
        bulletIndent=0, spaceAfter=1.4 * mm,
    ),
    "number": ParagraphStyle(
        "number", parent=None, fontName=REGULAR, fontSize=9.2, leading=13.5,
        textColor=INK, leftIndent=7 * mm, firstLineIndent=-5 * mm,
        spaceAfter=1.5 * mm,
    ),
    "callout": ParagraphStyle(
        "callout", fontName=REGULAR, fontSize=9.1, leading=13.4, textColor=NAVY,
        backColor=PALE, borderColor=RULE, borderWidth=0.7, borderPadding=8,
        spaceBefore=2 * mm, spaceAfter=4 * mm,
    ),
    "small": ParagraphStyle(
        "small", fontName=REGULAR, fontSize=8.1, leading=11.4, textColor=MUTED,
    ),
    "table_header": ParagraphStyle(
        "table_header", fontName=BOLD, fontSize=8.1, leading=11.4, textColor=colors.white,
    ),
    "ref": ParagraphStyle(
        "ref", fontName=REGULAR, fontSize=8.25, leading=11.3, textColor=INK,
        leftIndent=5 * mm, firstLineIndent=-5 * mm, spaceAfter=1.8 * mm,
    ),
}


def P(text: str, style: str = "body") -> Paragraph:
    return Paragraph(text, styles[style])


def TH(text: str) -> Paragraph:
    return Paragraph(text, styles["table_header"])


def bullet(text: str) -> Paragraph:
    return Paragraph(f"&#8226;&nbsp;&nbsp;{text}", styles["bullet"])


def number(n: int, text: str) -> Paragraph:
    return Paragraph(f"<b>{n}.</b>&nbsp;&nbsp;{text}", styles["number"])


def section(title: str):
    return P(title, "h1")


def subsection(title: str):
    return P(title, "h2")


def table(rows, widths, header=True, font_size=8.0):
    t = Table(rows, colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    commands = [
        ("FONTNAME", (0, 0), (-1, -1), REGULAR),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("LEADING", (0, 0), (-1, -1), font_size + 3.2),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), BOLD),
        ]
    for row in range(1 if header else 0, len(rows)):
        if row % 2 == 0:
            commands.append(("BACKGROUND", (0, row), (-1, row), colors.HexColor("#F7F9FC")))
    t.setStyle(TableStyle(commands))
    return t


def build_story():
    s = []
    if LOGO_PATH.exists():
        logo = Image(str(LOGO_PATH), width=96 * mm, height=33.7 * mm)
        logo.hAlign = "CENTER"
        s += [Spacer(1, 7 * mm), logo, Spacer(1, 7 * mm)]
    else:
        s += [Spacer(1, 26 * mm)]
    s += [P("CHRIST (DEEMED TO BE UNIVERSITY)", "cover_institution")]
    s += [P("BANGALORE", "cover_institution"), Spacer(1, 5 * mm)]
    s += [P("DEPARTMENT OF COMPUTER SCIENCE", "cover_department")]
    s += [P("SYNOPSIS", "cover_document")]
    s += [P("TENANTLY: A MOBILE-FIRST PROPERTY MANAGEMENT SYSTEM<br/>FOR SMALL LANDLORDS AND TENANTS", "cover_project")]
    s += [P("Submitted by,", "cover_meta"), Spacer(1, 2 * mm)]
    s += [P("Avalbir Singh Banga", "cover_emphasis")]
    s += [P("2440114<br/>B.Sc. Mathematics and Computer Science", "cover_meta")]
    s += [Spacer(1, 4 * mm), P("V Semester<br/>Academic Year 2026-2027", "cover_meta")]
    s += [Spacer(1, 7 * mm), P("Project Guide: Dr. Logeshwaran J", "cover_emphasis")]
    s += [Spacer(1, 2 * mm), P("Course: Computer Science Project (CSC481-5)", "cover_emphasis"), PageBreak()]

    s += [section("1. Abstract")]
    s += [P(
        "Tenantly is a cross-platform, mobile-first property-management application for small landlords, paying-guest operators, hostel managers, tenants, and maintenance staff. The project addresses the fragmentation created when property inventory, occupancy, rent records, complaints, notices, and tenant documents are managed across paper registers, spreadsheets, and message threads. The implemented application consolidates these activities into role-aware workflows backed by a single relational data model."
    )]
    s += [P(
        "The client is implemented with Expo SDK 56, React Native 0.85, and TypeScript. Supabase provides authentication, PostgreSQL persistence, Row Level Security (RLS), database functions, and private object storage. The current system includes organization and property setup, room and bed inventory, resident and tenancy management, occupancy history, monthly invoices, manual payment proof and approval, immutable receipts, complaints, notices, private documents, operational expenses, staff tasks, notifications, dashboards, and CSV exports."
    )]
    s += [P(
        "This revised synopsis describes only functionality supported by the current repository. WhatsApp/SMS messaging, an online payment gateway, public property discovery, tenant ratings, a platform-admin console, and automated owner-report PDFs are not presented as implemented features. They are separated as possible future work."
    )]
    s += [P(
        "<b>Keywords:</b> property management, tenancy, Expo, React Native, Supabase, PostgreSQL, Row Level Security, invoices, mobile application.",
        "callout",
    )]

    s += [section("2. Problem Statement")]
    s += [P(
        "Small property operators often maintain different records for rooms, occupants, rent, payments, maintenance, and notices. These disconnected records make it difficult to determine the current vacancy of a room or bed, reconcile partial payments, preserve payment-approval history, track a complaint from submission to resolution, or ensure that one organization cannot access another organization's data. Tenants also have limited self-service and must contact the owner for routine information."
    )]
    s += [P(
        "The project therefore focuses on an authoritative, auditable operational system rather than unsupported market-wide claims. It does not rely on the unverified statistic included in the earlier synopsis."
    )]
    s += [PageBreak()]

    s += [section("3. Objectives")]
    objectives = [
        "Provide secure registration, sign-in, password recovery, invitation acceptance, session handling, and role-aware navigation.",
        "Maintain organization-scoped records for properties, rooms, beds, residents, tenancies, and occupancy assignments.",
        "Generate monthly invoices without duplicates and support partial or multiple payments against an invoice.",
        "Allow tenants to submit manual payment evidence and authorized owners or managers to approve or reject it with an auditable outcome.",
        "Create immutable receipt records after approved allocations and provide invoice/payment exports in CSV format.",
        "Implement structured complaints with category, priority, attachments, assignment, status history, and reopening where permitted.",
        "Publish targeted notices and maintain private document and attachment access through protected storage.",
        "Provide role-specific dashboards and staff task views without treating client-side navigation as the only authorization control.",
        "Enforce privacy and business rules through PostgreSQL constraints, transactional functions, and RLS policies.",
    ]
    s += [number(i + 1, item) for i, item in enumerate(objectives)]

    s += [section("4. Existing Process and Its Limitations")]
    s += [subsection("4.1 Existing process")]
    for item in [
        "Paper registers or spreadsheets for properties, occupants, rent, and payment entries.",
        "Messaging groups or direct messages for complaints, notices, and maintenance coordination.",
        "Separate image or document folders for payment proofs, identity documents, and agreements.",
        "Manual calculations for outstanding rent, occupancy, and monthly summaries.",
    ]:
        s += [bullet(item)]
    s += [subsection("4.2 Limitations")]
    for item in [
        "Duplicate entry and inconsistent versions of the same resident, room, or payment record.",
        "Weak auditability for room transfers, partial payments, approvals, and complaint status changes.",
        "No reliable organization-level privacy boundary in ordinary files and chat groups.",
        "Limited tenant self-service and repeated owner follow-up for routine status information.",
        "Difficulty enforcing rules such as non-overlapping occupancy and duplicate-free monthly invoices.",
    ]:
        s += [bullet(item)]
    s += [PageBreak()]

    s += [section("5. Proposed and Implemented System")]
    s += [P(
        "Tenantly uses an Expo application as the presentation layer and Supabase as the backend platform. Users authenticate before entering role-protected areas. Business records are stored in PostgreSQL, organization membership defines the principal data boundary, and RLS policies protect both database rows and private storage objects. High-risk multi-row operations are implemented as database functions so that financial and occupancy rules remain authoritative even when a mobile request is retried."
    )]
    s += [subsection("5.1 Architecture")]
    arch_rows = [
        [TH("Layer"), TH("Current responsibility")],
        [P("Mobile client", "small"), P("Role-aware screens, forms, local interaction, navigation, and presentation.", "small")],
        [P("Feature services", "small"), P("Typed queries, mutations, cache invalidation, validation, and user-facing error translation.", "small")],
        [P("Supabase Auth", "small"), P("Identity, session lifecycle, email verification, and password recovery.", "small")],
        [P("PostgreSQL", "small"), P("Organizations, properties, occupancy, billing, operations, communication, and audit records.", "small")],
        [P("RLS and functions", "small"), P("Authorization plus atomic invoice, payment, receipt, tenancy, and occupancy operations.", "small")],
        [P("Private Storage", "small"), P("Payment proof, complaint images, identity documents, agreements, and expense receipts.", "small")],
    ]
    s += [table(arch_rows, [39 * mm, 105 * mm], font_size=8.0)]
    s += [subsection("5.2 Security and data integrity")]
    for item in [
        "Organization and property membership are checked in the database; hidden routes alone are not considered access control.",
        "The mobile app uses a publishable Supabase key. A service-role key is not placed in public Expo configuration.",
        "Money is stored as integer paise, reducing floating-point ambiguity.",
        "Invoice generation is idempotent; occupancy conflicts are rejected; payment allocation and receipts preserve an audit trail.",
        "Private files are accessed through authenticated requests or time-limited signed URLs, subject to storage policies.",
    ]:
        s += [bullet(item)]
    s += [PageBreak()]

    s += [section("6. System Functionalities")]
    functionality = [
        ("Identity and membership", "Registration, email verification, sign-in, password reset, organization setup, invitations, membership selection, and protected routes."),
        ("Properties and occupancy", "Properties, rooms, optional beds, residents, tenancy terms, room/bed assignment, transfers, vacancy, and historical occupancy."),
        ("Billing and payments", "Monthly invoice generation, line items, partial payments, manual cash records, tenant payment-proof submission, approval/rejection, allocations, and immutable receipts."),
        ("Complaints", "Tenant submission with category, priority, description, optional images, assignment, event history, status transitions, and reopening where allowed."),
        ("Notices", "Organization/property/resident targeting, pinned notices, recipient feeds, and read state."),
        ("Documents", "Private resident documents, agreements, payment evidence, complaint attachments, and controlled file access."),
        ("Operations", "Maintenance staff task views, versioned agreements, property-scoped expense records, and optional expense receipts."),
        ("Dashboards and reports", "Owner and tenant summaries for occupancy, rent, payments, complaints, and notices; invoice and payment CSV export."),
        ("Notifications", "Persistent in-app notifications and optional Expo push-device registration when the EAS project identifier is configured."),
    ]
    rows = [[TH("Module"), TH("Implemented scope")]] + [
        [P(f"<b>{name}</b>", "small"), P(desc, "small")] for name, desc in functionality
    ]
    s += [table(rows, [42 * mm, 102 * mm], font_size=7.85)]
    s += [Spacer(1, 3 * mm), P(
        "The application is a private operational tool. It is not a public property marketplace, booking portal, or automated payment processor.",
        "callout",
    )]
    s += [PageBreak()]

    s += [section("7. Tools and Technologies")]
    tech = [
        ("Expo SDK 56", "Cross-platform application runtime, build tooling, routing-compatible modules, notifications, file handling, and platform services."),
        ("React Native 0.85 / React 19.2", "Shared Android, iOS, and web user-interface implementation."),
        ("TypeScript 6", "Strictly typed client, services, validation, and generated database types."),
        ("Expo Router", "File-based routing and role-segregated route groups."),
        ("HeroUI Native + Uniwind", "Current component and styling approach, with Tailwind CSS v4 semantic utilities."),
        ("TanStack Query", "Remote server-state fetching, caching, invalidation, and mutation state."),
        ("Zustand", "Limited local interface context and dialog state."),
        ("React Hook Form + Zod", "Form state and input validation."),
        ("Supabase Auth + PostgreSQL", "Authentication, relational persistence, functions, constraints, and RLS."),
        ("Supabase Storage", "Private documents and image evidence with policy-controlled access."),
        ("Expo Notifications", "Push-token registration and notification integration; delivery depends on deployment configuration."),
        ("Jest / ESLint / TypeScript", "Unit/component testing and static verification."),
        ("Git", "Version control and implementation history."),
    ]
    rows = [[TH("Technology"), TH("Purpose in the current system")]] + [
        [P(f"<b>{name}</b>", "small"), P(desc, "small")] for name, desc in tech
    ]
    s += [table(rows, [47 * mm, 97 * mm], font_size=7.7)]
    s += [PageBreak()]

    s += [section("8. Expected Outcomes and Evaluation Criteria")]
    s += [P(
        "The project is expected to improve operational clarity rather than promise unsupported numerical business gains. Evaluation should compare the implemented workflows against the following observable outcomes:"
    )]
    for item in [
        "A single current view of properties, rooms, beds, residents, tenancies, and vacancy.",
        "Traceable monthly invoices, payment submissions, decisions, allocations, and receipts.",
        "A structured complaint history instead of status being scattered across message threads.",
        "Tenant self-service for dues, payments, notices, and requests.",
        "Organization-scoped privacy enforced by database and storage policies.",
        "Repeatable invoice and occupancy operations that reject duplicate or conflicting states.",
        "Exportable financial records suitable for reconciliation outside the application.",
    ]:
        s += [bullet(item)]
    s += [subsection("8.1 Verification snapshot - 22 August 2026")]
    verify_rows = [
        [TH("Check"), TH("Observed result"), TH("Status")],
        [P("Jest", "small"), P("17 suites; 45 tests passed", "small"), P("PASS", "small")],
        [P("TypeScript", "small"), P("tsc --noEmit completed", "small"), P("PASS", "small")],
        [P("ESLint", "small"), P("1 error and 2 warnings in the current worktree", "small"), P("OPEN", "small")],
        [P("Database pgTAP", "small"), P("Test files exist; no fresh local run was claimed in this audit", "small"), P("NOT RE-RUN", "small")],
    ]
    vt = table(verify_rows, [35 * mm, 77 * mm, 32 * mm], font_size=8.0)
    vt.setStyle(TableStyle([
        ("TEXTCOLOR", (2, 1), (2, 2), GREEN),
        ("FONTNAME", (2, 1), (2, -1), BOLD),
        ("TEXTCOLOR", (2, 3), (2, -1), AMBER),
    ]))
    s += [vt]
    s += [Spacer(1, 3 * mm), P(
        "This snapshot avoids converting repository artefacts into stronger claims than the available evidence supports.",
        "callout",
    )]
    s += [PageBreak()]

    s += [section("9. Current Limitations and Future Scope")]
    s += [subsection("9.1 Current limitations")]
    for item in [
        "No integrated online payment gateway; the current workflow records cash/manual payments and verifies UPI or bank-transfer evidence.",
        "No WhatsApp or SMS integration and no claim of automated WhatsApp rent reminders.",
        "No public property discovery, booking marketplace, subscription billing, or platform-admin console.",
        "No tenant rating feature for complaint resolution.",
        "Reports are currently dashboard summaries and CSV exports; automated owner-report PDFs are not current implemented scope.",
        "Push delivery requires valid EAS and platform notification configuration; an in-app notification record alone does not prove external delivery.",
        "The current audit found an unresolved lint error and two warnings in ongoing worktree changes; database tests were not re-run without a local Supabase stack.",
    ]:
        s += [bullet(item)]
    s += [subsection("9.2 Future scope")]
    for item in [
        "Scheduled invoice creation and overdue reminders after production-safe job configuration.",
        "Payment-gateway integration with signed webhook verification and reconciliation.",
        "Optional WhatsApp/SMS messaging implemented through approved templates and user consent.",
        "Richer analytics, downloadable owner PDF reports, and expense/profit summaries.",
        "Persistent offline mutation queues for safe non-financial drafts.",
        "Agreement renewal automation, QR onboarding, and broader operational tools after the core release is stable.",
    ]:
        s += [bullet(item)]

    s += [section("10. Conclusion")]
    s += [P(
        "Tenantly provides a focused, mobile-first foundation for managing small rental properties and tenant-facing workflows. Its main contribution is not the replacement of every communication or payment channel, but the creation of a consistent operational record with role-aware access, auditable finance and occupancy actions, structured complaints, targeted notices, and private documents."
    )]
    s += [P(
        "The revised scope matches the repository as audited on 22 August 2026. Implemented capabilities are distinguished from deployment-dependent behavior and future enhancements, making the synopsis suitable as an accurate project summary rather than a speculative feature list."
    )]
    s += [PageBreak()]

    s += [section("11. References")]
    refs = [
        "1. Tenantly project repository. <i>README, product requirements, package manifest, application source, Supabase migrations, and tests.</i> Repository audit dated 22 August 2026.",
        "2. Expo. <i>Expo SDK 56 Reference.</i> https://docs.expo.dev/versions/v56.0.0/ (accessed 22 August 2026).",
        "3. React Native. <i>Introduction - React Native 0.85.</i> https://reactnative.dev/docs/0.85/getting-started (accessed 22 August 2026).",
        "4. Supabase. <i>Database Overview.</i> https://supabase.com/docs/guides/database/overview (accessed 22 August 2026).",
        "5. Supabase. <i>Row Level Security.</i> https://supabase.com/docs/guides/database/postgres/row-level-security (accessed 22 August 2026).",
        "6. Supabase. <i>Storage Buckets.</i> https://supabase.com/docs/guides/storage/buckets/fundamentals (accessed 22 August 2026).",
        "7. Supabase. <i>Storage Access Control.</i> https://supabase.com/docs/guides/storage/security/access-control (accessed 22 August 2026).",
        "8. TypeScript. <i>The TypeScript Handbook.</i> https://www.typescriptlang.org/docs/handbook/intro.html (accessed 22 August 2026).",
        "9. TanStack. <i>TanStack Query Documentation.</i> https://tanstack.com/query/latest (accessed 22 August 2026).",
        "10. Jest. <i>Jest Documentation.</i> https://jestjs.io/docs/getting-started (accessed 22 August 2026).",
    ]
    s += [P(ref, "ref") for ref in refs]
    s += [Spacer(1, 5 * mm), P(
        "Revision note: the unsupported complaint statistic and unrelated generic references from the earlier synopsis were removed because they did not provide verifiable evidence for Tenantly's implemented scope.",
        "callout",
    )]
    return s


def ensure_reference_logo():
    if LOGO_PATH.exists() or not REFERENCE_PDF.exists():
        return
    from pypdf import PdfReader

    images = PdfReader(str(REFERENCE_PDF)).pages[0].images
    if images:
        LOGO_PATH.parent.mkdir(parents=True, exist_ok=True)
        LOGO_PATH.write_bytes(images[0].data)


def main():
    ensure_reference_logo()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SynopsisDocTemplate(str(OUTPUT))
    doc.build(build_story())
    print(OUTPUT)


if __name__ == "__main__":
    main()
