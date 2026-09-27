from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"C:\tenantly")
OUT = ROOT / "deliverables"
ASSETS = ROOT / "report_assets"
OUT.mkdir(exist_ok=True)
ASSETS.mkdir(exist_ok=True)
DOCX = OUT / "Tenantly_Final_Project_Report.docx"

NAVY = "#18181B"; PINK = "#EC4899"; GRAY = "#52525B"; LIGHT = "#F4F4F5"; PALE = "#FCE7F3"; LINE = "#D4D4D8"

def font(size=24, bold=False):
    candidates = ["C:/Windows/Fonts/timesbd.ttf" if bold else "C:/Windows/Fonts/times.ttf", "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"]
    for candidate in candidates:
        if Path(candidate).exists(): return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()

def box(draw, xy, title, subtitle="", fill=LIGHT, accent=PINK):
    x1,y1,x2,y2 = xy
    draw.rounded_rectangle(xy, radius=20, fill=fill, outline=LINE, width=3)
    draw.rounded_rectangle((x1,y1,x1+12,y2), radius=6, fill=accent)
    draw.multiline_text((x1+28,y1+30), title, font=font(28, True), fill=NAVY, spacing=8)
    if subtitle: draw.multiline_text((x1+28,y1+82), subtitle, font=font(20), fill=GRAY, spacing=6)

def arrow(draw, start, end, label=""):
    draw.line([start,end], fill=GRAY, width=4)
    x,y=end; draw.polygon([(x,y),(x-14,y-8),(x-14,y+8)], fill=GRAY)
    if label:
        mx=(start[0]+end[0])//2; my=(start[1]+end[1])//2
        draw.text((mx-35,my-28), label, font=font(18), fill=GRAY)

def save_diagram(name, title, boxes, arrows):
    image=Image.new("RGB",(1600,900),"white"); draw=ImageDraw.Draw(image)
    draw.text((60,35), title, font=font(38, True), fill=NAVY)
    for b in boxes: box(draw,*b)
    for a in arrows: arrow(draw,*a)
    image.save(ASSETS/name)

def create_assets():
    save_diagram("architecture.png","Tenantly system architecture",[
        ((80,250,420,430),"Expo / React Native App","Owner, tenant and staff workflows",PALE,PINK),
        ((570,130,960,300),"Supabase Auth","Secure session and role-aware access",LIGHT,PINK),
        ((570,370,960,540),"PostgreSQL + RLS","Tenant isolation, constraints and RPCs",LIGHT,PINK),
        ((1120,130,1510,300),"Private Storage","Documents, payment proof and media",LIGHT,PINK),
        ((1120,370,1510,540),"Notifications","In-app and push delivery",LIGHT,PINK)],
        [((420,300),(570,215),"sign-in"),((420,380),(570,455),"queries / RPCs"),((960,215),(1120,215),"signed URLs"),((960,455),(1120,455),"events")])
    save_diagram("use_cases.png","Role-aware use-case model",[
        ((80,150,380,300),"Owner / Manager","Configure properties and residents\nGenerate invoices\nApprove payments",PALE,PINK),
        ((80,500,380,650),"Tenant","View invoices and notices\nSubmit payment proof\nCreate complaints",PALE,PINK),
        ((80,720,380,850),"Maintenance staff","View assigned requests\nUpdate task status",PALE,PINK),
        ((650,260,1050,620),"Tenantly platform","Property & occupancy\nBilling & receipts\nComplaints & notices\nDocuments & reports",LIGHT,PINK),
        ((1220,360,1510,530),"Supabase services","Authentication\nDatabase\nStorage\nNotifications",LIGHT,PINK)],
        [((380,225),(650,330),""),((380,575),(650,445),""),((380,785),(650,545),""),((1050,445),(1220,445),"")])
    save_diagram("erd.png","Core data model",[
        ((70,160,360,290),"Organizations","organization_id",PALE,PINK),((70,480,360,610),"Members & Profiles","roles and active context",LIGHT,PINK),
        ((500,110,820,250),"Properties / Rooms / Beds","property_id · room_id · bed_id",LIGHT,PINK),((500,380,820,520),"Residents & Tenancies","occupancy history",LIGHT,PINK),
        ((1000,110,1320,250),"Invoices & Payments","allocations and receipts",LIGHT,PINK),((1000,380,1320,520),"Complaints & Notices","events and target reads",LIGHT,PINK),
        ((1000,650,1320,780),"Documents & Attachments","private storage paths",LIGHT,PINK)],
        [((360,225),(500,180),"1:N"),((360,545),(500,450),"1:N"),((820,180),(1000,180),"1:N"),((820,450),(1000,450),"1:N"),((820,450),(1000,715),"1:N")])
    save_diagram("payment_flow.png","Monthly invoice and payment workflow",[
        ((70,310,310,450),"Active tenancy","Rent terms and due day",PALE,PINK),((410,310,650,450),"Invoice generation","Idempotent monthly RPC",LIGHT,PINK),
        ((750,310,990,450),"Payment proof","Tenant submits amount and reference",LIGHT,PINK),((1090,310,1330,450),"Owner decision","Approve or reject",LIGHT,PINK),((1390,310,1580,450),"Receipt","Immutable record",PALE,PINK)],
        [((310,380),(410,380),""),((650,380),(750,380),""),((990,380),(1090,380),""),((1330,380),(1390,380),"")])
    save_diagram("complaint_flow.png","Complaint resolution workflow",[
        ((80,310,340,450),"Open complaint","Tenant creates request",PALE,PINK),((460,310,720,450),"Triage & assignment","Owner assigns or updates",LIGHT,PINK),
        ((840,310,1100,450),"Work in progress","Status events are recorded",LIGHT,PINK),((1220,310,1480,450),"Resolved / reopened","Tenant views history",PALE,PINK)],
        [((340,380),(460,380),""),((720,380),(840,380),""),((1100,380),(1220,380),"")])
    save_diagram("navigation.png","Role-aware navigation",[
        ((110,320,390,460),"Shared entry","Authentication\nInvitation acceptance",PALE,PINK),((570,150,900,310),"Owner routes","Home · Properties · Rent\nComplaints · Reports",LIGHT,PINK),
        ((570,390,900,550),"Tenant routes","Home · Payments · Requests\nNotices · More",LIGHT,PINK),((570,630,900,790),"Staff routes","Tasks · Home · More",LIGHT,PINK),
        ((1100,320,1490,460),"Protected route guard","Membership and role checks",LIGHT,PINK)],
        [((390,390),(570,230),""),((390,390),(570,470),""),((390,390),(570,710),""),((900,230),(1100,390),""),((900,470),(1100,390),""),((900,710),(1100,390),"")])
    # screenshot slots are intentionally neutral and user-replaceable
    slots=[("login","Login and registration"),("org_setup","Organization setup"),("owner_home","Owner dashboard"),("property","Property and room management"),("resident","Resident and tenancy setup"),("occupancy","Occupancy management"),("rent","Invoice and rent management"),("payment","Payment approval"),("complaint","Complaint management"),("tenant_home","Tenant dashboard"),("notice","Notice feed"),("operations","Operations and reports"),("invite","Invitation acceptance"),("invoice","Invoice detail"),("receipt","Receipt detail"),("staff_tasks","Maintenance staff tasks")]
    for i,(key,label) in enumerate(slots,1):
        image=Image.new("RGB",(1400,900),"white"); draw=ImageDraw.Draw(image)
        draw.rounded_rectangle((90,50,1310,850),radius=26,outline=LINE,width=5,fill="#FAFAFA")
        draw.rectangle((90,50,1310,135),fill=NAVY)
        draw.text((130,76),"TENANTLY",font=font(27,True),fill="white")
        draw.rounded_rectangle((175,205,1225,690),radius=18,outline="#A1A1AA",width=3,fill="#F4F4F5")
        draw.text((350,370),"INSERT LIVE APPLICATION SCREENSHOT",font=font(31,True),fill=GRAY)
        draw.text((430,425),label,font=font(26),fill=GRAY)
        draw.text((300,755),"Replace this figure area with a clean screenshot from the final build.",font=font(19),fill=GRAY)
        image.save(ASSETS/f"slot_{i:02d}_{key}.png")

def set_cell_shading(cell, fill):
    tcPr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),fill); tcPr.append(shd)

def set_cell_margins(cell, top=90, start=120, bottom=90, end=120):
    tc=cell._tc; tcPr=tc.get_or_add_tcPr(); tcMar=tcPr.first_child_found_in('w:tcMar')
    if tcMar is None: tcMar=OxmlElement('w:tcMar'); tcPr.append(tcMar)
    for m,v in [('top',top),('start',start),('bottom',bottom),('end',end)]:
        node=tcMar.find(qn('w:'+m))
        if node is None: node=OxmlElement('w:'+m); tcMar.append(node)
        node.set(qn('w:w'),str(v)); node.set(qn('w:type'),'dxa')

def field(paragraph, instruction):
    run=paragraph.add_run(); fldChar1=OxmlElement('w:fldChar'); fldChar1.set(qn('w:fldCharType'),'begin'); instr=OxmlElement('w:instrText'); instr.set(qn('xml:space'),'preserve'); instr.text=instruction; fldChar2=OxmlElement('w:fldChar'); fldChar2.set(qn('w:fldCharType'),'separate'); text=OxmlElement('w:t'); text.text='Update fields in Word'; fldChar3=OxmlElement('w:fldChar'); fldChar3.set(qn('w:fldCharType'),'end'); run._r.extend([fldChar1,instr,fldChar2,text,fldChar3])

def set_page_number(section, fmt='decimal', start=1):
    sectPr=section._sectPr; pg=sectPr.find(qn('w:pgNumType'))
    if pg is None: pg=OxmlElement('w:pgNumType'); sectPr.append(pg)
    pg.set(qn('w:fmt'),fmt); pg.set(qn('w:start'),str(start))

def setup_section(section, roman=False):
    section.page_width=Inches(8.27); section.page_height=Inches(11.69)
    section.left_margin=Inches(1.5); section.right_margin=Inches(1); section.top_margin=Inches(1); section.bottom_margin=Inches(1)
    section.header_distance=Inches(.45); section.footer_distance=Inches(.45)
    set_page_number(section,'lowerRoman' if roman else 'decimal',1)
    footer=section.footer
    p=footer.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=p.add_run('Page '); r.font.name='Times New Roman'; r.font.size=Pt(10)
    field(p,' PAGE ')

def set_font(run, size=12, bold=False, italic=False, color=None):
    run.font.name='Times New Roman'; run._element.rPr.rFonts.set(qn('w:ascii'),'Times New Roman'); run._element.rPr.rFonts.set(qn('w:hAnsi'),'Times New Roman')
    run.font.size=Pt(size); run.bold=bold; run.italic=italic
    if color: run.font.color.rgb=RGBColor.from_string(color)

def add_para(doc,text='',style=None,align=None,after=6,before=0,first=True):
    p=doc.add_paragraph(style=style) if style else doc.add_paragraph()
    if align is not None: p.alignment=align
    pf=p.paragraph_format; pf.space_before=Pt(before); pf.space_after=Pt(after); pf.line_spacing=1.5
    if first and style is None: pf.first_line_indent=Inches(.5)
    r=p.add_run(text); set_font(r)
    return p

def add_heading(doc,text,level=1):
    p=doc.add_paragraph(style=f'Heading {level}')
    p.paragraph_format.space_before=Pt(16 if level==1 else 10); p.paragraph_format.space_after=Pt(7); p.paragraph_format.keep_with_next=True
    r=p.add_run(text); set_font(r,14 if level==1 else 12,True)
    return p

def add_table(doc, headers, rows, widths=None):
    table=doc.add_table(rows=1, cols=len(headers)); table.alignment=WD_TABLE_ALIGNMENT.CENTER; table.style='Table Grid'; table.autofit=False
    for j,h in enumerate(headers):
        c=table.rows[0].cells[j]; c.text=''; set_cell_shading(c,'E4E4E7'); set_cell_margins(c); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        r=c.paragraphs[0].add_run(h); set_font(r,10,True); c.paragraphs[0].alignment=WD_ALIGN_PARAGRAPH.CENTER
        if widths: c.width=Inches(widths[j])
    for row in rows:
        cells=table.add_row().cells
        for j,value in enumerate(row):
            cells[j].text=''; set_cell_margins(cells[j]); cells[j].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p=cells[j].paragraphs[0]; p.paragraph_format.space_after=Pt(0); p.paragraph_format.line_spacing=1.12
            r=p.add_run(str(value)); set_font(r,9.5)
            if widths: cells[j].width=Inches(widths[j])
    doc.add_paragraph().paragraph_format.space_after=Pt(4)
    return table

def add_figure(doc, path, caption, width=6.1, new_page=False):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(4); p.paragraph_format.space_after=Pt(3)
    if new_page: p.paragraph_format.page_break_before=True
    p.add_run().add_picture(str(path),width=Inches(width))
    cp=doc.add_paragraph(); cp.alignment=WD_ALIGN_PARAGRAPH.CENTER; cp.paragraph_format.space_after=Pt(9); cp.paragraph_format.keep_with_next=True
    r=cp.add_run(caption); set_font(r,10,italic=True)

def add_screenshot_box(doc, label, caption, new_page=False):
    if new_page:
        p=doc.add_paragraph(); p.paragraph_format.page_break_before=True
    table=doc.add_table(rows=1, cols=1); table.alignment=WD_TABLE_ALIGNMENT.CENTER; table.style='Table Grid'; table.autofit=False
    cell=table.cell(0,0); cell.width=Inches(6.0); set_cell_shading(cell,'F4F4F5'); set_cell_margins(cell,top=180,start=180,bottom=180,end=180); cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
    p=cell.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(24)
    r=p.add_run('TENANTLY'); set_font(r,12,True)
    p=cell.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(45); p.paragraph_format.space_after=Pt(45)
    r=p.add_run('INSERT LIVE APPLICATION SCREENSHOT'); set_font(r,15,True)
    p=cell.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(45)
    r=p.add_run(label); set_font(r,11)
    p=cell.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(20); p.paragraph_format.space_after=Pt(20)
    r=p.add_run('Replace this figure area with a clean screenshot from the final build.'); set_font(r,9,italic=True)
    cp=doc.add_paragraph(); cp.alignment=WD_ALIGN_PARAGRAPH.CENTER; cp.paragraph_format.space_after=Pt(9)
    r=cp.add_run(caption); set_font(r,10,italic=True)

def add_text_screenshot_slot(doc, label, caption):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.page_break_before=True; p.paragraph_format.space_after=Pt(12)
    r=p.add_run('SCREENSHOT SPACE: ' + label.upper()); set_font(r,13,True)
    for _ in range(12):
        p=doc.add_paragraph(); p.paragraph_format.space_after=Pt(16)
    cp=doc.add_paragraph(); cp.alignment=WD_ALIGN_PARAGRAPH.CENTER; cp.paragraph_format.space_after=Pt(9)
    r=cp.add_run(caption); set_font(r,10,italic=True)

def add_bullets(doc, items):
    for item in items:
        p=doc.add_paragraph(style='List Bullet'); p.paragraph_format.space_after=Pt(3); p.paragraph_format.line_spacing=1.25
        r=p.add_run(item); set_font(r,11)

def chapter(doc, n, title):
    doc.add_page_break(); add_heading(doc,f'CHAPTER {n}',1); p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(18)
    r=p.add_run(title.upper()); set_font(r,15,True)

def make_document():
    create_assets()
    doc=Document(); setup_section(doc.sections[0],roman=True)
    styles=doc.styles
    normal=styles['Normal']; normal.font.name='Times New Roman'; normal._element.rPr.rFonts.set(qn('w:ascii'),'Times New Roman'); normal._element.rPr.rFonts.set(qn('w:hAnsi'),'Times New Roman'); normal.font.size=Pt(12); normal.paragraph_format.line_spacing=1.5; normal.paragraph_format.space_after=Pt(6)
    for n in ['Heading 1','Heading 2','Heading 3']:
        styles[n].font.name='Times New Roman'; styles[n]._element.rPr.rFonts.set(qn('w:ascii'),'Times New Roman'); styles[n]._element.rPr.rFonts.set(qn('w:hAnsi'),'Times New Roman'); styles[n].font.color.rgb=RGBColor(0,0,0)
    # cover
    for _ in range(7): doc.add_paragraph()
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run('TENANTLY'); set_font(r,25,True)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run('A Mobile Property Management System for Small Landlords and Tenants'); set_font(r,16,True)
    doc.add_paragraph(); p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run('PROJECT REPORT'); set_font(r,14,True)
    for _ in range(4): doc.add_paragraph()
    for t in ['Submitted by: [STUDENT NAME]','Register Number: [REGISTER NUMBER]','Under the Guidance of: [GUIDE NAME]','Department of Computer Science','[UNIVERSITY NAME]','August 2026']:
        p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run(t); set_font(r,12,True if ':' in t else False)
    # certificate / declaration / ai / ack / abstract
    for heading, paras in [
        ('CERTIFICATE',["This is to certify that the project report entitled ‘Tenantly: A Mobile Property Management System for Small Landlords and Tenants’ is a record of work carried out by [STUDENT NAME] under the guidance of [GUIDE NAME] in partial fulfilment of the requirements for the award of [DEGREE NAME].","The work presented in this report has not been submitted, either in full or in part, for any other academic award.","Project Guide: ____________________     Head of Department: ____________________"]),
        ('DECLARATION',["I hereby declare that this project report is my original work and that all sources of information used in its preparation have been acknowledged in the reference section. The Tenantly application and accompanying documentation were prepared for academic evaluation.","Signature of Student: ____________________     Date: ____________________"]),
        ('AI USAGE DECLARATION',["Artificial intelligence tools were used as writing and formatting assistance during the preparation of this report. The project design, repository analysis, technical claims, test results and implementation descriptions were reviewed against the Tenantly source code, migrations and verification output. No AI-generated statement has been used as evidence in place of project artefacts or actual test results."]),
        ('ACKNOWLEDGEMENTS',["I express my sincere gratitude to [GUIDE NAME] for continuous guidance, timely feedback and encouragement throughout the project. I thank the faculty members of the Department of Computer Science, [UNIVERSITY NAME], for creating the academic environment that made this work possible.","I am grateful to my classmates, friends and family members for their support during the analysis, development, testing and documentation of Tenantly. Finally, I acknowledge everyone who directly or indirectly contributed to the completion of this project."])
    ]:
        doc.add_page_break(); p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;r=p.add_run(heading);set_font(r,16,True)
        for para in paras:add_para(doc,para,align=WD_ALIGN_PARAGRAPH.JUSTIFY,before=10)
    doc.add_page_break(); p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;r=p.add_run('ABSTRACT');set_font(r,16,True)
    abstract=("Tenantly was developed as a cross-platform mobile property-management system for small landlords, paying guests, hostel operators and tenants in India. The project addressed the operational fragmentation created by spreadsheets, handwritten registers and disconnected messaging channels. The implemented application consolidated property inventory, residents, tenancy assignments, invoices, manual payment verification, receipts, complaints, notices, documents and operational reporting into role-aware workflows. The client application was built with Expo, React Native and TypeScript, while Supabase provided authentication, PostgreSQL persistence, Row Level Security, private storage and database functions. The design deliberately treats organization membership as an authorization boundary and places financial and occupancy mutations inside transactional database operations. This reduces the risk of duplicate invoices, overlapping occupancy assignments and unauthorized payment decisions. The project was verified through TypeScript compilation, linting and a Jest suite comprising forty passing tests across sixteen suites. The report documents the requirements, architecture, schema, implementation approach, security model and test evidence. Tenantly demonstrates that a mobile-first system can give small property operators a clearer operational view while preserving tenant privacy and auditable financial records.")
    add_para(doc,abstract,align=WD_ALIGN_PARAGRAPH.JUSTIFY,before=12)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY; r=p.add_run('Keywords: '); set_font(r,12,True); r=p.add_run('property management, React Native, Expo, Supabase, Row Level Security, tenancy, invoices, mobile application.');set_font(r)
    # toc / lists
    doc.add_page_break(); p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;r=p.add_run('TABLE OF CONTENTS');set_font(r,16,True); p=doc.add_paragraph(); field(p,' TOC \\o "1-3" \\h \\z \\u ')
    doc.add_page_break(); p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;r=p.add_run('LIST OF FIGURES');set_font(r,16,True)
    for i,name in enumerate(['Tenantly system architecture','Role-aware use-case model','Core data model','Monthly invoice and payment workflow','Complaint resolution workflow','Role-aware navigation','Application interface screenshots: Figures 4.1-4.16'],1): add_para(doc,f'Figure {i}. {name}',first=False,after=3)
    p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;r=p.add_run('LIST OF TABLES');set_font(r,16,True)
    for i,name in enumerate(['Functional requirements','Non-functional requirements','Technology stack','Core data entities','Test execution summary','Representative test cases'],1): add_para(doc,f'Table {i}. {name}',first=False,after=3)
    doc.add_page_break(); p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;r=p.add_run('LIST OF ABBREVIATIONS');set_font(r,16,True)
    add_table(doc,['Abbreviation','Meaning'],[['API','Application Programming Interface'],['CSV','Comma-Separated Values'],['RLS','Row Level Security'],['RPC','Remote Procedure Call'],['SDK','Software Development Kit'],['UI','User Interface'],['UUID','Universally Unique Identifier']],[1.4,4.8])
    # main section decimal
    sec=doc.add_section(WD_SECTION.NEW_PAGE); sec.header.is_linked_to_previous=False;sec.footer.is_linked_to_previous=False;setup_section(sec,roman=False)
    chapter(doc,1,'INTRODUCTION')
    sections=[
    ('1.1 Overview of Tenantly',"Tenantly is a mobile property-management application designed for small landlords, paying-guest owners, hostel managers, tenants and maintenance staff. It was implemented as a private operational system rather than a public rental marketplace. The application organizes the recurring activities of property inventory, resident onboarding, tenancy terms, occupancy, billing, payment verification, complaints, notices and documents within a single role-aware environment."),
    ('1.2 Background and Motivation',"Small property operators frequently manage rent, occupancy and maintenance through paper registers, spreadsheet files and messaging applications. These methods are flexible at a very small scale but become difficult to audit when a property contains multiple rooms, beds, residents and billing periods. Tenantly was motivated by the need for an accessible mobile workflow that reduces duplicate entries, makes current occupancy visible and preserves a traceable record of financial and operational decisions."),
    ('1.3 Problem Statement',"The core problem was the absence of a simple mobile system that combines property operations with tenant-facing self-service while enforcing privacy between organizations. Manual records do not reliably represent room transfers, partial payments, payment approvals or complaint histories. A system was required to provide an authoritative view of each entity without exposing another organization’s information."),
    ('1.4 Objectives',"The project objectives were to implement secure sign-in and organization membership; manage properties, rooms, beds, residents and tenancies; preserve occupancy history; generate monthly invoices idempotently; collect and approve manual payment evidence; issue immutable receipts; manage complaints, notices and private documents; and provide role-specific dashboards and exports."),
    ('1.5 Scope and Applicability',"The implemented MVP is applicable to small residential properties, PG accommodation and hostel-like operations. The initial release prioritizes trustworthy manual payment recording over payment-gateway integration. It supports owner, manager, tenant and maintenance-staff workflows within an organization. Public property discovery, online payment gateways and broad marketplace features were intentionally kept outside the implemented scope."),
    ('1.6 Intended Users',"Owners and managers use Tenantly to configure operations, review finance and handle resident requests. Tenants use the application to view invoices, submit payment proof, access notices and create complaints. Maintenance staff receive and update assigned work. This separation makes the user interface focused while the database maintains the authorization boundary."),
    ('1.7 Organization of the Report',"The remaining chapters describe system analysis and requirements, the proposed architecture and database design, the implementation of the application and its security controls, verification evidence, and a conclusion with clearly separated future enhancements.")]
    for h,t in sections: add_heading(doc,h,2); add_para(doc,t,align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    chapter(doc,2,'SYSTEM ANALYSIS AND REQUIREMENTS')
    for h,t in [
    ('2.1 Existing Property-Management Practices',"The existing process generally distributes information across spreadsheets, paper documents and message threads. A room may be available in one register while a separate chat records an informal booking. Rent entries can be updated independently of occupancy changes, which makes reconciliation difficult. The process also provides limited tenant self-service because residents must contact an owner for routine information such as outstanding rent or the latest notice."),
    ('2.2 Limitations of the Existing Process',"Manual and disconnected approaches create duplicate data entry, unclear ownership of records, delayed communication and weak auditability. They do not reliably enforce exclusivity when assigning beds, provide no consistent workflow for payment approval, and rarely isolate information by property organization. Tenantly addresses these gaps through a single backend model, transaction-oriented operations and role-based navigation."),
    ('2.3 Literature Review',"The design draws on established information-system principles: normalized relational data for operational consistency, role-based access for controlled data sharing, mobile interaction patterns for field use, and transactional updates for financial records. The selected implementation also follows platform guidance that database authorization should be enforced through Row Level Security rather than only through client-side navigation. Official documentation for Expo, React Native, Supabase and PostgreSQL was used to validate the selected technology approach."),
    ('2.4 Proposed System',"The proposed system is a cross-platform client application backed by Supabase. Users authenticate before accessing role-protected routes. Properties, occupancy and finance are managed in PostgreSQL. Private document paths are stored in the database and accessed through protected storage policies. Sensitive multi-row actions, such as creating a tenancy with an assignment or deciding a payment, are placed behind database functions so business rules remain authoritative even if a client is retried."),
    ('2.5 Benefits of Tenantly',"The system centralizes operational data, reduces repeated manual calculations, enables tenant self-service, captures approval history and improves visibility of vacancies and outstanding rent. The use of organization-scoped records and RLS policies supports privacy across property operators. The mobile-first experience also makes routine updates practical during on-site property work.")]: add_heading(doc,h,2);add_para(doc,t,align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_heading(doc,'2.6 Functional Requirements',2)
    add_table(doc,['ID','Requirement','Implemented evidence'],[['FR-01','Users can register, sign in, reset credentials and use protected routes.','Auth route group and session-aware root layout.'],['FR-02','Owners can create organizations, properties, rooms, beds and residents.','Organization, property, room and resident setup routes.'],['FR-03','Tenancies preserve assignment history and prevent conflicting active occupancy.','Transactional tenancy and transfer functions.'],['FR-04','Owners can generate invoices and manage manual payments.','Billing services, invoice routes and payment functions.'],['FR-05','Tenants can submit proof; authorized users decide the payment.','Payment detail routes and RLS-protected decision function.'],['FR-06','Users can create, view and transition complaints.','Complaint routes, events and transition function.'],['FR-07','Owners publish targeted notices; recipients maintain read state.','Notice services, targets and read records.'],['FR-08','Users access role-specific dashboards and reports.','Owner, tenant and staff route groups; CSV export.']],[.55,3.15,2.1])
    add_heading(doc,'2.7 Non-Functional Requirements',2)
    add_table(doc,['Category','Requirement','Design response'],[['Security','Organizations must not access one another’s records.','RLS policies and organization IDs on business records.'],['Integrity','Financial and occupancy operations must be auditable.','Database functions, constraints, allocations and receipt immutability.'],['Usability','First-time owners should complete setup without training.','Dedicated setup screens and focused navigation.'],['Reliability','Repeated mobile requests must not create duplicate results.','Idempotent invoice generation and transaction-oriented mutations.'],['Accessibility','The interface must support clear labels and usable targets.','Shared component system and platform-aware controls.'],['Maintainability','The system should separate domain logic from routes.','Feature-oriented services, shared utilities and generated database types.']],[1.05,2.4,2.35])
    add_heading(doc,'2.8 Software and Hardware Requirements',2); add_table(doc,['Component','Requirement'],[['Development environment','Node.js, npm, Expo CLI and Supabase CLI'],['Mobile client','Android 7+ or iOS 16.4+ baseline'],['Backend','Supabase Auth, PostgreSQL, Storage and Edge/database services'],['Recommended workstation','Modern dual-core CPU, 8 GB RAM, broadband internet'],['Testing','Jest, TypeScript compiler, ESLint and Supabase pgTAP suite']],[2.0,4.0])
    add_heading(doc,'2.9 Feasibility Analysis',2); add_para(doc,"Tenantly was technically feasible because the selected stack supports a shared JavaScript and TypeScript codebase for Android, iOS and web. Operational feasibility was supported by simple task-oriented screens and by retaining manual payment verification, which matches common small-property practice. Economic feasibility was improved by managed backend services and a single client codebase. The project’s main dependencies are internet availability and the correct operational configuration of Supabase policies and storage.",align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    chapter(doc,3,'SYSTEM DESIGN')
    add_heading(doc,'3.1 Overall Architecture',2);add_para(doc,"Tenantly uses a layered architecture. The Expo application presents role-aware workflows and uses shared feature services for data access. Supabase Auth provides authenticated identity, while PostgreSQL stores operational records. Row Level Security applies row-level authorization, private storage holds evidence and documents, and database functions handle operations that must be atomic.",align=WD_ALIGN_PARAGRAPH.JUSTIFY);add_figure(doc,ASSETS/'architecture.png','Figure 3.1. Tenantly system architecture.')
    add_heading(doc,'3.2 Role and Use-Case Design',2);add_para(doc,"The model separates interface access by role while keeping membership data in the backend. An owner or manager has operational control within an authorized organization. A tenant can access only records connected to their own tenancy. Maintenance staff have narrowly scoped task access.",align=WD_ALIGN_PARAGRAPH.JUSTIFY);add_figure(doc,ASSETS/'use_cases.png','Figure 3.2. Role-aware use-case model.')
    add_heading(doc,'3.3 Module Design',2);add_para(doc,"The application is divided into authentication, organizations, properties, residents, billing, complaints, notices, operations, notifications and shared infrastructure. This feature-oriented structure keeps query logic and domain rules close to the screens that use them while centralizing cross-cutting concerns such as error translation, query keys, money formatting and session state.",align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_heading(doc,'3.4 Data-Flow Design',2);add_para(doc,"For a protected action, the client submits an authenticated request to an approved database operation. The operation validates organization membership, domain state and supplied values before committing changes. The client then invalidates or refreshes only the affected query data. This design ensures that route visibility does not become the only access-control mechanism.",align=WD_ALIGN_PARAGRAPH.JUSTIFY);add_figure(doc,ASSETS/'payment_flow.png','Figure 3.3. Monthly invoice and payment workflow.')
    add_heading(doc,'3.5 Entity-Relationship Design',2);add_para(doc,"Each business entity carries an organization identifier so that ownership and filtering remain explicit. A resident can have a tenancy, and a tenancy produces an occupancy-assignment history. Invoices capture a billing period and may receive multiple payment allocations. Complaints preserve an event history. Documents and attachments store protected object paths instead of permanent public URLs.",align=WD_ALIGN_PARAGRAPH.JUSTIFY);add_figure(doc,ASSETS/'erd.png','Figure 3.4. Core data model.')
    add_heading(doc,'3.6 Core Database Entities',2);add_table(doc,['Entity group','Purpose'],[['Identity and membership','Profiles, organizations, organization memberships, property memberships and invitations.'],['Property and occupancy','Properties, rooms, beds, residents, tenancies and occupancy assignments.'],['Billing','Invoices, invoice items, payments, payment allocations and receipts.'],['Operations','Complaints, complaint events, notices, notice targets, documents and notifications.'],['Audit and storage','Audit logs, attachment metadata, push devices and private object paths.']],[2.0,4.0])
    add_heading(doc,'3.7 Authorization and Security Design',2);add_para(doc,"Authorization is enforced through PostgreSQL Row Level Security and specific database functions. Membership and property scope are checked in policies rather than inferred solely from the current screen. The mobile bundle uses only the Supabase project URL and publishable key; privileged keys are excluded. Sensitive files use private buckets and access policies. The design also uses unique constraints, foreign keys and guarded state transitions to preserve data integrity.",align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_heading(doc,'3.8 Workflow and Navigation Design',2);add_figure(doc,ASSETS/'complaint_flow.png','Figure 3.5. Complaint resolution workflow.');add_figure(doc,ASSETS/'navigation.png','Figure 3.6. Role-aware navigation model.')
    chapter(doc,4,'IMPLEMENTATION')
    impl=[('4.1 Development Methodology',"Tenantly was implemented iteratively. The project first established shared routing, session handling, design tokens and test tooling. It then added the database foundation and access policies before implementing property, tenancy, finance and operational features. This order reduced the risk that later screens would depend on unprotected or unstable data models."),('4.2 Technology Stack',"The client uses Expo SDK 56, React Native, TypeScript, Expo Router, TanStack Query, React Hook Form, Zod, Uniwind and HeroUI Native. Supabase provides authentication, PostgreSQL, private storage and policy enforcement. Jest supports unit and component testing, and the Supabase test suite is configured for database and RLS verification."),('4.3 Authentication and Protected Navigation',"The root layout restores the authenticated session and directs a user into public authentication routes, organization setup, invitation acceptance or an authorized application area. Route groups separate owner, tenant and staff navigation. This improves usability, but the backend remains the authority for access decisions."),('4.4 Organization, Property and Occupancy Management',"Owners create an organization before configuring properties, rooms and optional beds. Resident records can exist before an invite is accepted. Tenancy creation and occupancy assignment are performed through database operations that preserve history. Transfers and move-outs update active occupancy without deleting past assignments."),('4.5 Billing, Payments and Receipts',"Billing supports invoice line items, bulk monthly generation, manual payments and payment-proof submission. The payment-decision workflow is server-side and produces allocations without exceeding an approved amount. Receipt creation is designed as an immutable financial record, improving traceability for both operator and resident."),('4.6 Complaints, Notices, Documents and Operations',"Residents can create complaints and follow status history. Operators can triage, assign and transition requests; maintenance staff receive scoped task views. Notices can be published to defined audiences and read state is maintained per recipient. Private documents, payment evidence and complaint attachments are stored through protected paths. The operational extension includes expenses, agreement renewal and a monthly profit report."),('4.7 Dashboards, Reports and Shared Components',"Role-specific dashboards surface information relevant to the user. The owner dashboard focuses on occupancy, collection, pending decisions and open complaints. Tenant views focus on current due amounts, active requests and notices. Shared utilities centralize money, date and CSV behavior, while shared components provide status, navigation and consistent loading, empty and error states."),('4.8 Database Migrations and RLS',"The repository uses timestamped SQL migrations for foundation, P0, readiness and operational updates. These migrations define tables, policies, database functions and grants together. This ensures that the client release has a versioned backend contract and that authorization is not an undocumented manual configuration."),('4.9 Validation, Errors and Reliability',"Client forms use typed validation and the database retains authoritative constraints. User-facing errors are normalized so a screen can explain the failure and provide a recovery path. Query keys include relevant organization scope, and high-risk financial operations avoid optimistic updates. The implementation uses idempotency and transaction boundaries where duplicate mobile requests would otherwise create inconsistent records.")]
    for h,t in impl: add_heading(doc,h,2);add_para(doc,t,align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_heading(doc,'4.10 Application Interface Screens',2);add_para(doc,"The following reserved figure areas are intentionally sized for clean screenshots captured from the final live build. Replace each area without changing its caption number or explanatory text.",align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    slot_notes=[('4.1','Authentication entry screen','The authentication flow provides sign-in, registration, verification and recovery entry points.'),('4.2','Organization setup screen','The first-time owner workflow creates an organization and establishes the initial membership.'),('4.3','Owner dashboard','The owner dashboard aggregates occupancy, collections, outstanding rent, approvals and complaints.'),('4.4','Property and room management','Property screens allow rooms and optional beds to be configured as operational inventory.'),('4.5','Resident and tenancy setup','Resident records and tenancy terms are recorded before occupancy is established.'),('4.6','Occupancy management','The occupancy screen supports active assignment, transfer history and vacancy derivation.'),('4.7','Rent and invoice management','The rent workflow shows the invoice ledger and monthly generation actions.'),('4.8','Payment approval','An authorized operator reviews payment evidence and makes an auditable approval or rejection.'),('4.9','Complaint management','Requests show priority, state, assigned staff and an event history.'),('4.10','Tenant dashboard','The tenant view provides direct access to dues, requests and notices.'),('4.11','Notice feed','Targeted notices and individual read state are visible to recipients.'),('4.12','Operations and reports','Operational screens present expenses, agreements and summarized reporting.'),('4.13','Invitation acceptance','The invitation path joins an authorized tenant or staff user to the intended organization.'),('4.14','Invoice detail','The invoice detail view presents billed line items, due state and payment history.'),('4.15','Receipt detail','A completed payment is represented by an immutable receipt record.'),('4.16','Maintenance staff task list','Staff members see only assigned work and update its recorded operational status.')]
    for idx,(num,label,note) in enumerate(slot_notes,1):
        if idx == 12:
            add_text_screenshot_slot(doc,label,f'Figure {num}. {label}.')
        elif idx in (8,16):
            add_screenshot_box(doc,label,f'Figure {num}. {label}.',new_page=True)
        else:
            add_figure(doc,ASSETS/f"slot_{idx:02d}_{['login','org_setup','owner_home','property','resident','occupancy','rent','payment','complaint','tenant_home','notice','operations','invite','invoice','receipt','staff_tasks'][idx-1]}.png",f'Figure {num}. {label}.',width=6.0,new_page=idx>1)
        add_para(doc,note,align=WD_ALIGN_PARAGRAPH.JUSTIFY,first=False)
    chapter(doc,5,'TESTING AND RESULTS')
    for h,t in [('5.1 Testing Objectives and Environment',"Testing focused on type safety, domain behavior, shared UI state, formatting utilities and database-oriented rules. The repository contains Jest tests for properties, residents, billing, complaints, operations, organization services, shared utilities and navigation components. Supabase test files are present for schema, RLS, release-readiness and demonstration operations."),('5.2 Unit and Component Testing',"The verification run completed successfully with 16 Jest test suites and 40 tests passing. The suite included money and date utilities, CSV export, query keys, error translation, organization services, billing aggregation, room handling, resident services, complaint services, operations services and common component states."),('5.3 Static Analysis',"The TypeScript typecheck completed successfully without emitting output, and the Expo lint command completed successfully with zero allowed warnings. These checks provide evidence that the checked client code is type-consistent and conforms to configured lint rules."),('5.4 Database and RLS Test Readiness',"The project configures a Supabase database test suite, including schema, RLS, P0 and release-readiness files. During the report verification run, the command reached the local-database connection step but could not connect because a local PostgreSQL/Supabase stack was not running in the environment. This is recorded as an environment limitation, not reported as a passed database execution. The SQL migrations and pgTAP files remain available for execution after local Supabase startup."),('5.5 Expo Environment Check',"Expo Doctor completed 21 of 22 checks. The remaining advisory identifies a known Hermes memory regression affecting the installed Expo SDK 56 / Hermes combination and recommends a future SDK upgrade. This advisory does not invalidate the passing type, lint or Jest checks, but it is retained as a release-risk item for the future-scope section.")]: add_heading(doc,h,2);add_para(doc,t,align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_heading(doc,'5.6 Test Execution Summary',2);add_table(doc,['Verification activity','Observed result','Status'],[['Jest unit/component suite','16 suites passed; 40 tests passed.','PASS'],['TypeScript compilation','tsc --noEmit completed successfully.','PASS'],['Lint','expo lint --max-warnings=0 completed successfully.','PASS'],['Supabase database tests','Could not connect to local PostgreSQL because local stack was not running.','ENVIRONMENT BLOCKED'],['Expo Doctor','21/22 checks passed; Hermes upgrade advisory reported.','ADVISORY']],[2.1,2.8,1.1])
    add_heading(doc,'5.7 Representative Test Cases',2);add_table(doc,['ID','Scenario','Expected result','Evidence'],[['TC-01','Money formatting','Indian currency values are formatted consistently.','Jest utility test'],['TC-02','Room behavior','Room data and related validation are processed correctly.','Property-room service tests'],['TC-03','Billing aggregates','Invoice and payment aggregate results remain correct.','Billing aggregate tests'],['TC-04','Complaint behavior','Complaint state/service behavior is validated.','Complaint service tests'],['TC-05','Operations services','Operational records are handled through tested services.','Operations service tests'],['TC-06','Navigation states','Shared screen navigation logic renders expected states.','Component tests'],['TC-07','Organization domain','Membership/organization behavior is validated.','Organization service tests'],['TC-08','Database isolation','Policies are supplied for organization- and tenant-scoped access.','Migration and pgTAP artefacts']],[.55,1.55,2.15,1.7])
    add_heading(doc,'5.8 Defect and Risk Resolution',2);add_para(doc,"The implementation addressed high-risk scenarios through data-model choices rather than relying only on interface validation. Occupancy assignment uses transactional functions to avoid conflicts; invoice generation is designed to be idempotent; payment allocation and receipt records support auditability; and RLS policies limit organization and tenant visibility. The reported Hermes advisory remains an explicit release maintenance item rather than a concealed issue.",align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    chapter(doc,6,'CONCLUSION')
    for h,t in [('6.1 Summary of Implementation',"Tenantly delivered a mobile-first property-management MVP that combines property inventory, residents, tenancy history, rent operations, payment evidence, complaints, notices, private documents and reporting. The system was implemented with an emphasis on safe operational workflows rather than only interface completeness."),('6.2 Achievement of Objectives',"The project achieved its intended foundation: role-aware application areas, organization-scoped data, structured occupancy, invoices and payments, complaint lifecycle management, targeted communication and verification coverage for core client behavior. The architecture places financial and occupancy operations in database-level functions and supplements them with RLS policies and private storage controls."),('6.3 Advantages',"Tenantly improves operational clarity by preserving one source of truth for properties, residents and money. It supports tenant self-service, lowers reliance on ad-hoc message threads, records decision history and uses consistent organization boundaries. The shared Expo codebase also supports a common workflow across Android, iOS and web."),('6.4 Current Limitations',"The MVP intentionally does not integrate an online payment gateway or marketplace search. The local database test suite requires a running local Supabase/PostgreSQL environment for execution. In addition, the installed Expo SDK 56 dependency set has a documented Hermes upgrade advisory that should be addressed before a broader production rollout."),('6.5 Future Scope',"Future work can add payment gateways, scheduled reminders, richer analytics, offline mutation queues, agreement automation, messaging integrations and public rental discovery. A near-term maintenance task is upgrading the Expo/React Native dependency baseline to incorporate the Hermes regression fix identified by Expo Doctor.")]: add_heading(doc,h,2);add_para(doc,t,align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    doc.add_page_break(); p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;r=p.add_run('REFERENCES');set_font(r,16,True)
    refs=["Expo. (2026). Core concepts. https://docs.expo.dev/core-concepts/", "Expo. (2026). Expo documentation. https://docs.expo.dev/", "Meta. (2026). React Native documentation. https://reactnative.dev/docs/getting-started", "Supabase. (2026). Database overview. https://supabase.com/docs/guides/database/overview", "Supabase. (2026). Row Level Security. https://supabase.com/docs/guides/database/postgres/row-level-security", "Supabase. (2026). Securing your API. https://supabase.com/docs/guides/api/securing-your-api", "Supabase. (2026). Production checklist. https://supabase.com/docs/guides/deployment/going-into-prod", "PostgreSQL Global Development Group. (2026). PostgreSQL documentation. https://www.postgresql.org/docs/", "TypeScript. (2026). TypeScript handbook. https://www.typescriptlang.org/docs/handbook/intro.html", "TanStack. (2026). TanStack Query documentation. https://tanstack.com/query/latest", "Zod. (2026). Zod documentation. https://zod.dev/", "Jest. (2026). Jest documentation. https://jestjs.io/docs/getting-started"]
    for ref in refs:add_para(doc,ref,first=False,after=4)
    doc.add_page_break(); p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;r=p.add_run('APPENDICES');set_font(r,16,True)
    add_heading(doc,'Appendix A: Installation and Configuration',2);add_para(doc,"Install dependencies with npm install. Copy the environment example into .env and provide the Supabase project URL and publishable key. Apply Supabase migrations in timestamp order. The mobile client must not contain a service-role key. For a local backend, start Docker Desktop, run npm run supabase:start, execute the migrations through npm run supabase:reset, and then generate matching client types with npm run supabase:types.",align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    add_heading(doc,'Configuration Checklist',3);add_bullets(doc,['Provide EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the application environment.','Keep service-role credentials in server-side Supabase secrets only.','Apply migrations in timestamp order and deploy a compatible client and database change together.','Confirm private Storage buckets, RLS policies and allowed file types before operational use.','Use separate local, staging and production projects to avoid testing against production data.'])
    doc.add_page_break();add_heading(doc,'Appendix B: Basic User Manual',2);add_heading(doc,'Owner and Manager Workflow',3);add_bullets(doc,['Register or sign in, then create or select an organization.','Create a property and configure rooms; add beds where shared occupancy is required.','Create resident records and tenancy terms, then assign a room or bed.','Generate monthly invoices for active tenancies and review the invoice ledger.','Review submitted payment proof, approve or reject it with an appropriate reason, and retain the resulting receipt.','Use complaints, notices, documents and reports to manage continuing operations.'])
    add_heading(doc,'Tenant Workflow',3);add_bullets(doc,['Sign in through the invitation-linked account and open the tenant dashboard.','Review the current invoice and past payment state.','Submit manual payment proof with payment method, date, reference, amount and attachment.','Open a complaint with category, priority and a clear description; follow the status history.','Read targeted notices and access authorized documents from the More area.'])
    add_heading(doc,'Maintenance Staff Workflow',3);add_bullets(doc,['Sign in using the assigned staff membership.','Open the task list to view only authorized requests.','Add progress notes and move a request through the allowed lifecycle.','Coordinate resolution through the recorded complaint history rather than separate message threads.'])
    doc.add_page_break();add_heading(doc,'Appendix C: Important Database Functions',2);add_table(doc,['Function','Purpose'],[['create_organization_with_owner','Creates the initial organization and owner membership.'],['create_tenancy_with_assignment','Creates tenancy and occupancy assignment in one operation.'],['transfer_occupancy','Closes prior assignment and creates a new active state.'],['generate_monthly_invoices','Creates missing invoices for eligible tenancies.'],['submit_payment / decide_payment','Submits payment evidence and performs authorized decision/allocation.'],['transition_complaint','Records validated complaint lifecycle changes.'],['create_invitation / accept_invitation','Issues and accepts controlled membership invitations.'],['publish_notice','Creates notices and their approved targets.'],['owner_dashboard / monthly_profit_report','Returns organization-scoped dashboard/report data.']],[2.25,3.75])
    add_heading(doc,'Data Integrity Controls',3);add_para(doc,"Database functions are complemented by primary keys, foreign keys, unique constraints, state checks, RLS policies and storage policies. The implementation stores money as integer paise, uses time-aware occupancy history, and relies on compensating records rather than deleting completed financial evidence. These controls support an auditable operational model.",align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    doc.add_page_break();add_heading(doc,'Appendix D: Extended Test-Case Matrix',2);add_table(doc,['ID','Test scenario','Expected outcome','Verification layer'],[['TC-09','Email login with valid credentials','Session is restored and protected routes become available.','Manual / Auth flow'],['TC-10','Password reset request','Recovery flow accepts the email and provides safe feedback.','Manual / Auth route'],['TC-11','Organization creation','Initial owner membership is created with the organization.','Database function'],['TC-12','Property creation by owner','Authorized operator can create property under the active organization.','RLS / service'],['TC-13','Room creation with beds','Room and optional bed inventory are created together.','Database function'],['TC-14','Resident created before app account','Resident record can exist without linked profile.','Schema / service'],['TC-15','Tenancy and initial assignment','Tenancy and occupancy state are created atomically.','Database function'],['TC-16','Room transfer','Prior occupancy closes and new occupancy becomes active.','Database function'],['TC-17','Overlapping bed occupancy','Conflicting active assignment is rejected.','Constraint / function'],['TC-18','Monthly invoice rerun','Existing invoice is skipped rather than duplicated.','Database function'],['TC-19','Partial payment','Allocated amount updates balance without exceeding payment.','Billing logic'],['TC-20','Unauthorized payment decision','Tenant cannot approve a submitted payment.','RLS / function'],['TC-21','Receipt protection','Immutable receipt cannot be silently modified.','Trigger / schema'],['TC-22','Tenant complaint creation','Linked tenant may create a scoped complaint.','RLS / function'],['TC-23','Invalid complaint transition','Disallowed status update is rejected.','Database function'],['TC-24','Targeted notice read','Recipient can read intended notice and update own read state.','RLS / service']],[.55,1.75,2.35,1.35])
    doc.add_page_break();add_heading(doc,'Appendix D Continued: Extended Test-Case Matrix',2);add_table(doc,['ID','Test scenario','Expected outcome','Verification layer'],[['TC-25','Private document access','Non-authorized users cannot read sensitive storage object.','Storage policy'],['TC-26','Complaint attachment','Attachment path is associated with authorized complaint record.','Storage / function'],['TC-27','CSV export','Export preserves expected invoice/payment columns.','Jest utility test'],['TC-28','Date formatting','Local date helper formats values consistently.','Jest utility test'],['TC-29','Money formatting','Paise values are rendered consistently for INR display.','Jest utility test'],['TC-30','Query-key scoping','Organization/filter scope is included in query identity.','Jest utility test'],['TC-31','Error translation','Database/application failures map to understandable user messages.','Jest unit test'],['TC-32','Loading and empty states','Shared state views render the appropriate screen state.','Component test'],['TC-33','Navigation guards','Navigation helpers choose the correct safe route.','Component test'],['TC-34','Expense recording','Authorized operational expense is persisted and reportable.','Database function'],['TC-35','Agreement renewal','Authorized renewal updates document/tenancy operational state.','Database function'],['TC-36','Monthly profit report','Organization-scoped finance summary is returned.','Database function']],[.55,1.75,2.35,1.35])
    doc.add_page_break();add_heading(doc,'Appendix E: Verification Commands',2);add_bullets(doc,['npm test - Runs the Jest unit and component suite.','npm run typecheck - Validates TypeScript without emitting files.','npm run lint - Runs configured Expo lint checks.','npm run supabase:start followed by npm run supabase:test - Starts local services and runs database tests.','npm run doctor - Runs Expo environment checks.'])
    add_heading(doc,'Appendix F: Screenshot Finalization Checklist',2);add_bullets(doc,['Replace each Figure 4.1-4.16 placeholder with a live application screenshot at the same dimensions.','Use consistent demo data and remove personal data, access tokens, URLs and debug overlays.','Capture owner, tenant and staff screens after the corresponding workflow is complete.','Retain each existing caption and explanatory paragraph so figures remain cross-referenceable.','Regenerate the Table of Contents, List of Figures and List of Tables after replacing screenshots.'])
    # update fields setting
    settings=doc.settings.element; update=OxmlElement('w:updateFields'); update.set(qn('w:val'),'true'); settings.append(update)
    doc.save(DOCX)
    print(DOCX)

if __name__ == '__main__': make_document()
