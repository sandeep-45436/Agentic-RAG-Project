import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def create_pdfs():
    output_dir = os.path.join(os.getcwd(), "sample_documents")
    os.makedirs(output_dir, exist_ok=True)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E3A8A'),
        spaceAfter=12
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#2563EB'),
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=8
    )

    # 1. Academic Regulations PDF
    pdf1_path = os.path.join(output_dir, "Smart_University_Academic_Regulations_2026.pdf")
    doc1 = SimpleDocTemplate(pdf1_path, pagesize=letter, pageCompression=0)
    story1 = []
    
    story1.append(Paragraph("Smart University - Academic Regulations 2026", title_style))
    story1.append(Paragraph("Document Code: REG-2026-V1 | Effective Date: August 1, 2026", subtitle_style))
    story1.append(Spacer(1, 10))
    
    story1.append(Paragraph("1. Attendance & Eligibility Policy", subtitle_style))
    story1.append(Paragraph(
        "Students are required to maintain a minimum of 75% attendance in all registered lecture and laboratory courses. "
        "Students with attendance between 65% and 74% due to verified medical emergencies may request condonation upon paying the condonation fee of $50 per subject. "
        "Attendance below 65% results in automatic course debarment (Grade 'F-ATT').", body_style
    ))
    story1.append(Spacer(1, 10))

    story1.append(Paragraph("2. Grading Scale & CGPA System", subtitle_style))
    grading_data = [
        ["Grade", "Marks Range", "Grade Points", "Performance Description"],
        ["O", "90% - 100%", "10.0", "Outstanding"],
        ["A+", "80% - 89%", "9.0", "Excellent"],
        ["A", "70% - 79%", "8.0", "Very Good"],
        ["B+", "60% - 69%", "7.0", "Good"],
        ["B", "50% - 59%", "6.0", "Above Average"],
        ["C", "40% - 49%", "5.0", "Pass"],
        ["F", "< 40%", "0.0", "Fail"]
    ]
    t1 = Table(grading_data, colWidths=[60, 100, 100, 200])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F3F4F6')),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#D1D5DB'))
    ]))
    story1.append(t1)
    story1.append(Spacer(1, 15))

    story1.append(Paragraph("3. Re-evaluation & Answer Script Verification", subtitle_style))
    story1.append(Paragraph(
        "A student seeking re-evaluation of end-semester examination answer scripts must apply within 14 calendar days "
        "of result declaration via the Smart Student Portal. The fee for re-evaluation is $30 per course. "
        "If the mark revision exceeds 10% of total course marks, the full re-evaluation fee is refunded.", body_style
    ))
    doc1.build(story1)

    # 2. CS401 Syllabus & Exam Schedule PDF
    pdf2_path = os.path.join(output_dir, "CS401_Algorithms_Syllabus_Exam_Schedule.pdf")
    doc2 = SimpleDocTemplate(pdf2_path, pagesize=letter, pageCompression=0)
    story2 = []

    story2.append(Paragraph("Department of Computer Science - Course Syllabus", title_style))
    story2.append(Paragraph("CS401: Advanced Algorithms & Data Structures | 4 Credits", subtitle_style))
    story2.append(Spacer(1, 10))

    story2.append(Paragraph("Course Overview & Prerequisites", subtitle_style))
    story2.append(Paragraph(
        "CS401 covers dynamic programming, amortized analysis, graph algorithms (Dijkstra, Bellman-Ford, Tarjan's SCC), "
        "network flows, and NP-completeness. Prerequisites: CS201 (Basic Data Structures) and MATH301 (Linear Algebra).", body_style
    ))
    story2.append(Spacer(1, 10))

    story2.append(Paragraph("Examination Schedule & Weightage", subtitle_style))
    exam_data = [
        ["Assessment", "Date & Time", "Location", "Weightage"],
        ["Quiz 1", "Sept 15, 2026 | 10:00 AM", "Hall 201", "10%"],
        ["Mid-Term Exam", "Oct 20, 2026 | 09:00 AM", "Tech Auditorium", "30%"],
        ["Lab Assignments", "Weekly Submissions", "Online Portal", "20%"],
        ["Final End-Sem Exam", "Dec 10, 2026 | 02:00 PM", "Tech Auditorium", "40%"]
    ]
    t2 = Table(exam_data, colWidths=[120, 150, 110, 80])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#047857')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#ECFDF5')),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#A7F3D0'))
    ]))
    story2.append(t2)
    doc2.build(story2)

    # 3. Faculty Research & Workload Policy PDF
    pdf3_path = os.path.join(output_dir, "Faculty_Research_and_Workload_Policy.pdf")
    doc3 = SimpleDocTemplate(pdf3_path, pagesize=letter, pageCompression=0)
    story3 = []

    story3.append(Paragraph("Smart University - Faculty Operations & Workload Policy", title_style))
    story3.append(Paragraph("Document Code: FAC-WORKLOAD-2026", subtitle_style))
    story3.append(Spacer(1, 10))

    story3.append(Paragraph("Teaching & Office Hours Mandate", subtitle_style))
    story3.append(Paragraph(
        "Full-time Professors must hold at least 4 office hours per week for student consultation. "
        "Tenured faculty workload allocation is structured as 40% Teaching, 40% Research, and 20% Administrative Service. "
        "Tenure-track faculty receive a reduced teaching load of 2 courses per academic year.", body_style
    ))
    story3.append(Spacer(1, 10))

    story3.append(Paragraph("Annual Department Research Budget Allocation", subtitle_style))
    budget_data = [
        ["Department", "Annual Budget", "Lab Allocation", "Travel Grant / Faculty"],
        ["Computer Science", "$1,500,000", "AI & Robotics Lab", "$3,500"],
        ["Electrical Engineering", "$1,200,000", "VLSI & Signals Lab", "$3,000"],
        ["Mathematics", "$900,000", "Computational Math Lab", "$2,500"]
    ]
    t3 = Table(budget_data, colWidths=[120, 100, 140, 100])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#6B21A8')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F3E8FF')),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#E9D5FF'))
    ]))
    story3.append(t3)
    doc3.build(story3)

    print("[SUCCESS] All 3 sample PDFs generated successfully in 'sample_documents/' directory!")

if __name__ == "__main__":
    create_pdfs()
