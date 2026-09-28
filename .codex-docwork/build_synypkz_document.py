from __future__ import annotations

import shutil
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


REFERENCE = Path('/Users/ernrsahar/Downloads/gylymi_zhoba (1).docx')
OUTPUT = Path('/Users/ernrsahar/Desktop/synypkz/SynypKz_gylymi_zhoba_dokumentatsiyasy.docx')

NAVY = '1F4368'
GREEN = '2D7650'
LIGHT_GREEN = 'EAF4EE'
LIGHT_BLUE = 'EAF1F8'
PALE_BLUE = 'F4F7FA'
GRAY = 'D9D9D9'
TEXT = '111111'


def set_cell_shading(cell, fill: str):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn('w:shd'))
    if shd is None:
        shd = OxmlElement('w:shd')
        tc_pr.append(shd)
    shd.set(qn('w:fill'), fill)


def set_cell_border(cell, color=GRAY, size='6'):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in('w:tcBorders')
    if borders is None:
        borders = OxmlElement('w:tcBorders')
        tc_pr.append(borders)
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        tag = f'w:{edge}'
        el = borders.find(qn(tag))
        if el is None:
            el = OxmlElement(tag)
            borders.append(el)
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), size)
        el.set(qn('w:color'), color)


def set_cell_margins(cell, top=110, start=120, bottom=110, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in('w:tcMar')
    if tc_mar is None:
        tc_mar = OxmlElement('w:tcMar')
        tc_pr.append(tc_mar)
    for m, v in [('top', top), ('start', start), ('bottom', bottom), ('end', end)]:
        node = tc_mar.find(qn(f'w:{m}'))
        if node is None:
            node = OxmlElement(f'w:{m}')
            tc_mar.append(node)
        node.set(qn('w:w'), str(v))
        node.set(qn('w:type'), 'dxa')


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement('w:tblHeader')
    tbl_header.set(qn('w:val'), 'true')
    tr_pr.append(tbl_header)


def set_row_cant_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement('w:cantSplit')
    cant_split.set(qn('w:val'), 'true')
    tr_pr.append(cant_split)


def set_table_widths(table, widths_cm):
    table.autofit = False
    for row in table.rows:
        for i, width in enumerate(widths_cm):
            row.cells[i].width = Cm(width)


def set_run_font(run, size=12, bold=False, color=TEXT, italic=False):
    run.font.name = 'Times New Roman'
    run._element.get_or_add_rPr().rFonts.set(qn('w:ascii'), 'Times New Roman')
    run._element.get_or_add_rPr().rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    run._element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = RGBColor.from_string(color)


def configure_styles(doc):
    normal = doc.styles['Normal']
    normal.font.name = 'Times New Roman'
    normal._element.rPr.rFonts.set(qn('w:ascii'), 'Times New Roman')
    normal._element.rPr.rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    normal.font.size = Pt(12)
    normal.font.color.rgb = RGBColor.from_string(TEXT)
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    normal.paragraph_format.line_spacing = 1.35
    normal.paragraph_format.space_after = Pt(6)

    title = doc.styles['Title']
    title.font.name = 'Times New Roman'
    title._element.rPr.rFonts.set(qn('w:ascii'), 'Times New Roman')
    title._element.rPr.rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    title.font.size = Pt(23)
    title.font.bold = True
    title.font.color.rgb = RGBColor.from_string(NAVY)
    title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_after = Pt(8)

    h1 = doc.styles['Heading 1']
    h1.font.name = 'Times New Roman'
    h1._element.rPr.rFonts.set(qn('w:ascii'), 'Times New Roman')
    h1._element.rPr.rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    h1.font.size = Pt(17)
    h1.font.bold = True
    h1.font.color.rgb = RGBColor.from_string(NAVY)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(10)
    h1.paragraph_format.keep_with_next = True

    h2 = doc.styles['Heading 2']
    h2.font.name = 'Times New Roman'
    h2._element.rPr.rFonts.set(qn('w:ascii'), 'Times New Roman')
    h2._element.rPr.rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    h2.font.size = Pt(14.5)
    h2.font.bold = True
    h2.font.color.rgb = RGBColor.from_string(GREEN)
    h2.paragraph_format.space_before = Pt(11)
    h2.paragraph_format.space_after = Pt(6)
    h2.paragraph_format.keep_with_next = True

    for name in ('List Paragraph', 'List Bullet', 'List Number'):
        if name in doc.styles:
            st = doc.styles[name]
            st.font.name = 'Times New Roman'
            st._element.rPr.rFonts.set(qn('w:ascii'), 'Times New Roman')
            st._element.rPr.rFonts.set(qn('w:hAnsi'), 'Times New Roman')
            st.font.size = Pt(12)
            st.paragraph_format.space_after = Pt(3)
            st.paragraph_format.line_spacing = 1.2


def clear_body_keep_section(doc):
    body = doc._element.body
    for child in list(body):
        if child.tag != qn('w:sectPr'):
            body.remove(child)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld_char1 = OxmlElement('w:fldChar')
    fld_char1.set(qn('w:fldCharType'), 'begin')
    instr = OxmlElement('w:instrText')
    instr.set(qn('xml:space'), 'preserve')
    instr.text = ' PAGE '
    fld_char2 = OxmlElement('w:fldChar')
    fld_char2.set(qn('w:fldCharType'), 'end')
    run._r.append(fld_char1)
    run._r.append(instr)
    run._r.append(fld_char2)
    set_run_font(run, 10, color='666666')


def configure_header_footer(doc):
    section = doc.sections[0]
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.25)
    section.right_margin = Inches(1.0)
    section.header_distance = Cm(0.65)
    section.footer_distance = Cm(0.65)

    header = section.header
    hp = header.paragraphs[0]
    hp.text = ''
    hp.paragraph_format.space_after = Pt(0)
    p_pr = hp._p.get_or_add_pPr()
    p_bdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '8')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), GREEN)
    p_bdr.append(bottom)
    p_pr.append(p_bdr)

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.clear()
    fp.paragraph_format.space_before = Pt(3)
    fp.paragraph_format.tab_stops.add_tab_stop(Inches(5.8))
    p_pr = fp._p.get_or_add_pPr()
    p_bdr = OxmlElement('w:pBdr')
    top = OxmlElement('w:top')
    top.set(qn('w:val'), 'single')
    top.set(qn('w:sz'), '8')
    top.set(qn('w:space'), '4')
    top.set(qn('w:color'), GREEN)
    p_bdr.append(top)
    p_pr.append(p_bdr)
    r = fp.add_run('Қызылорда, 2026 жыл')
    set_run_font(r, 10, color='666666')
    r = fp.add_run('\t')
    set_run_font(r, 10, color='666666')
    add_page_number(fp)


def add_para(doc, text='', bold_lead=None, align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=True,
             keep=False, space_after=6):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.line_spacing = 1.35
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.keep_together = keep
    if indent and align == WD_ALIGN_PARAGRAPH.JUSTIFY:
        p.paragraph_format.first_line_indent = Cm(1.0)
    if bold_lead and text.startswith(bold_lead):
        r1 = p.add_run(bold_lead)
        set_run_font(r1, 12, bold=True)
        r2 = p.add_run(text[len(bold_lead):])
        set_run_font(r2, 12)
    else:
        r = p.add_run(text)
        set_run_font(r, 12)
    return p


def add_bullets(doc, items, numbered=False):
    style = 'List Paragraph' if 'List Paragraph' in doc.styles else 'Normal'
    for index, item in enumerate(items, 1):
        p = doc.add_paragraph(style=style)
        p.paragraph_format.left_indent = Cm(1.25)
        p.paragraph_format.first_line_indent = Cm(-0.55)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.2
        marker = f'{index}.  ' if numbered else '•  '
        r = p.add_run(marker + item)
        set_run_font(r, 12)


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(text, style=f'Heading {level}')
    return p


def add_table(doc, headers, rows, widths, header_fill=NAVY, alignments=None, font_size=10.5):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    hdr = table.rows[0]
    set_repeat_table_header(hdr)
    set_row_cant_split(hdr)
    for i, text in enumerate(headers):
        cell = hdr.cells[i]
        cell.text = ''
        set_cell_shading(cell, header_fill)
        set_cell_border(cell)
        set_cell_margins(cell, top=120, bottom=120, start=125, end=125)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(str(text))
        set_run_font(r, font_size, bold=True, color='FFFFFF')
    for ri, row in enumerate(rows):
        added_row = table.add_row()
        set_row_cant_split(added_row)
        cells = added_row.cells
        for i, value in enumerate(row):
            cell = cells[i]
            cell.text = ''
            set_cell_shading(cell, 'FFFFFF' if ri % 2 == 0 else PALE_BLUE)
            set_cell_border(cell)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.alignment = (alignments[i] if alignments else WD_ALIGN_PARAGRAPH.LEFT)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.08
            r = p.add_run(str(value))
            set_run_font(r, font_size)
    set_table_widths(table, widths)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(1)
    return table


def page_break(doc):
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)


def build():
    shutil.copy2(REFERENCE, OUTPUT)
    doc = Document(OUTPUT)
    clear_body_keep_section(doc)
    configure_styles(doc)
    configure_header_footer(doc)

    # Мұқаба
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(18)
    for text, size, bold, color in [
        ('П.Д. Осипенко атындағы №8 орта мектебі', 14, False, '555555'),
        ('«Педагогикалық идеялар фестивалі» республикалық байқауының қалалық кезеңі', 13, False, '555555'),
    ]:
        r = p.add_run(text)
        set_run_font(r, size, bold=bold, color=color)
        r.add_break()

    p = doc.add_paragraph('ҒЫЛЫМИ ЖОБА')
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(28)
    p.paragraph_format.space_after = Pt(10)
    set_run_font(p.runs[0], 20, bold=True, color=NAVY)

    p = doc.add_paragraph('ЦИФРЛІК СЫНЫП ЖЕТЕКШІСІ', style='Title')
    p.paragraph_format.space_after = Pt(4)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(22)
    r = p.add_run('ЖИ-ассистент көмегімен интерактивті тәрбие сағаттары мен ситуациялық кейстерді модельдеу')
    set_run_font(r, 15, bold=True, italic=True, color=NAVY)

    meta = [
        ('Фестиваль бағыты', '«Сабақ аяқталған соң...»  сынып жетекшісі'),
        ('Білім беру ұйымы', 'П.Д. Осипенко атындағы №8 орта мектебі'),
        ('Жоба авторы', 'Жармаханова Нұрсұлу Нұрмановна'),
        ('Қызметі және пәні', 'Қазақ тілі мен әдебиеті пәні мұғалімі'),
        ('Жобаның тілі', 'Қазақ тілі'),
        ('Байланыс телефоны', '8 778 190 81 83'),
        ('Электрондық пошта', 'nurmankyzy83@mail.ru'),
        ('Жыл', 'Қызылорда қаласы, 2026 жыл'),
    ]
    table = doc.add_table(rows=len(meta), cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    for ri, (label, value) in enumerate(meta):
        for ci, text in enumerate((label, value)):
            cell = table.rows[ri].cells[ci]
            cell.text = ''
            set_cell_shading(cell, LIGHT_GREEN if ci == 0 else 'FFFFFF')
            set_cell_border(cell)
            set_cell_margins(cell, top=115, bottom=115, start=150, end=150)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            set_run_font(r, 11, bold=(ci == 0))
    set_table_widths(table, [5.2, 10.0])

    page_break(doc)

    # I бөлім
    add_heading(doc, 'I КІРІСПЕ', 1)
    add_heading(doc, '1.1 Жобаның өзектілігі', 2)
    add_para(doc, 'Қазіргі мектептегі сынып жетекшісінің жұмысы тек тәрбие сағатын өткізу немесе хабарлама тарату міндетімен шектелмейді. Ол оқушы, ата-ана және пән мұғалімі арасындағы ақпаратты реттейді, қауіпсіз әрі қолдаушы орта қалыптастырады, баланың жетістігін көрсетеді және күнделікті мектеп өмірін ұйымдастырады. Бұл жұмыстар әртүрлі чаттарда, қағаз кестелерде және бөлек файлдарда жүргізілгенде ақпараттың жоғалуы, қайталануы және кеш жетуі байқалады.')
    add_para(doc, 'Оқушылардың цифрлық ортада белсенді болуы тәрбие жұмысын да сол ортаға көшіруді талап етеді. Алайда цифрландырудың өзі жеткіліксіз: жүйе жас ерекшелігіне сай, рөлдер бойынша қауіпсіз, қазақ тілінде түсінікті және педагогтің нақты жұмыс тәртібіне бейім болуы керек. Жасанды интеллектіні қолдану да бақылаусыз жауап беретін әмбебап чат емес, оқу мен мектеп тақырыбына шектелген көмекші түрінде ұйымдастырылғанда ғана тәрбиелік мақсатқа қызмет етеді.')
    add_para(doc, 'Осы қажеттіліктен 8 «А» сыныбына арналған SynypKz цифрлық порталы әзірленді. Портал сабақ кестесін, тәрбие сағатының жылдық жоспарын, сынып хабарламаларын, жетістіктерді, ата-анамен байланысты, сергіту жаттығуларын және оқу сұрақтарына жауап беретін ЖИ-көмекшіні бір ортаға біріктіреді.')

    add_heading(doc, '1.2 Зерттеу мәселесі және гипотеза', 2)
    add_para(doc, 'Зерттеу мәселесі: сынып жетекшісінің ақпараттық, ұйымдастырушылық және тәрбиелік қызметтерін бір цифрлық ортаға біріктіріп, әр пайдаланушыға өз рөліне сәйкес қауіпсіз әрі түсінікті құрал ұсыну.')
    add_para(doc, 'Гипотеза: егер сабақ кестесі, тәрбие сағаты, байланыс, жетістік, ата-ана чаты және тақырыптық ЖИ-көмекші бір рөлдік веб-порталда біріктірілсе, онда сыныптағы ақпарат алмасу жүйеленіп, оқушының өздігінен оқуына, ата-ананың мектеппен тұрақты байланысына және сынып жетекшісінің тәрбие жұмысын жоспарлауына қолайлы орта қалыптасады.')

    add_heading(doc, '1.3 Мақсат пен міндеттер', 2)
    add_para(doc, 'Жобаның негізгі мақсаты: 8 «А» сыныбының күнделікті оқу және тәрбие үдерісін бір жерден басқаруға мүмкіндік беретін, рөлдік қолжетімділігі бар, қазақ тіліндегі цифрлық сынып порталын құру және оның функцияларын педагогикалық мақсатқа бейімдеу.', bold_lead='Жобаның негізгі мақсаты:')
    page_break(doc)
    add_para(doc, 'Міндеттер:', bold_lead='Міндеттер:', indent=False, keep=True)
    add_bullets(doc, [
        'сынып порталының пайдаланушыларын және олардың қажеттіліктерін анықтау;',
        'апталық сабақ кестесін пән, мұғалім, кабинет және уақытпен бір бетте көрсету;',
        '2026–2027 оқу жылына арналған тәрбие сағаты тақырыптарын ай және апта бойынша жүйелеу;',
        'сынып жетекшісіне қосымша тәрбие тақырыбын қосу, өзгерту және өшіру мүмкіндігін беру;',
        'мұғалім хабарламаларын және сыныптық сұрақ-жауап чатын нақты уақытта ұйымдастыру;',
        'ата-ана мен мұғалімге бөлек байланыс арнасын қалыптастыру;',
        'оқу және мектеп тақырыбымен шектелген онлайн және офлайн ЖИ-көмекші әзірлеу;',
        'жетістіктерді көрнекі портфолио түрінде жариялау және сергіту жаттығуларын таймермен беру;',
        'Firebase Authentication және Firestore Security Rules арқылы рөлдік қауіпсіздікті іске асыру;',
        'жобаның өндірістік жинақталуын және негізгі маршруттарының жұмысын тексеру.'
    ])

    add_heading(doc, '1.4 Зерттеу нысаны, пәні және әдістері', 2)
    add_table(doc, ['Компонент', 'Сипаттама'], [
        ('Зерттеу нысаны', '8 «А» сыныбындағы оқу, тәрбие және байланыс үдерісі.'),
        ('Зерттеу пәні', 'Сынып жетекшісінің жұмысын цифрлық портал және ЖИ-көмекші арқылы ұйымдастыру тәсілдері.'),
        ('Әдістер', 'Қажеттілікті талдау, функционалдық модельдеу, интерфейс жобалау, бағдарламалау, рөлдік сценарийлерді тексеру, өндірістік жинақтау.'),
        ('Нәтиже өнімі', 'SynypKz толыққанды веб-порталы және осы ғылыми-техникалық құжаттама.'),
    ], [4.0, 11.2], header_fill=GREEN, font_size=10.5)

    add_heading(doc, '1.5 Жаңашылдығы мен практикалық маңызы', 2)
    add_para(doc, 'Жобаның жаңашылдығы — сынып жетекшісінің бірнеше бөлек жұмысын бір қазақтілді интерфейсте біріктіру және ЖИ-көмекшіні нақты сынып деректерімен байланыстыру. Көмекші сабақ кестесін, мұғалімдер мен кабинеттерді, тәрбие сағаты жоспарын біледі; оқу шеңберінен тыс тақырыптарды шектейді; қауіпсіздікке қатысты жағдайда ересекке жүгінуге және 111 сенім телефонына хабарласуға бағыттайды.')
    add_para(doc, 'Практикалық маңызы — портал күн сайын қолдануға дайын: мұғалім хабарлама жариялайды, сынып жетекшісі тәрбие тақырыбын басқарады, оқушы кесте мен жетістіктерді көреді және сұрақ қояды, ата-ана мұғаліммен бөлек чатта байланысады. Мобильді және компьютерлік экранға бейімделген интерфейс жүйені мектеп жағдайында қолдануға мүмкіндік береді.')

    # II бөлім
    add_heading(doc, 'II ТЕОРИЯЛЫҚ БӨЛІМ ЦИФРЛІК СЫНЫП ЖЕТЕКШІЛІГІ', 1)
    add_heading(doc, '2.1 Цифрлық тәрбие ортасының моделі', 2)
    add_para(doc, 'Цифрлық сынып ортасы төрт өзара байланысты міндетті атқарады: ақпаратты көрсету, қатысушыларды байланыстыру, тәрбие мазмұнын жоспарлау және оқушыға жедел қолдау беру. Ақпараттық қабатқа сабақ кестесі, хабарламалар мен жетістіктер кіреді. Коммуникациялық қабат сынып чаты мен ата-ана арнасынан тұрады. Тәрбиелік қабат айлық-апталық жоспарды, бағыттарды және ситуациялық талқылау сұрақтарын қамтиды. Қолдау қабатында ЖИ-көмекші мен сергіту жаттығулары орналасқан.')
    add_table(doc, ['Қабат', 'Педагогикалық міндет', 'SynypKz құралы'], [
        ('Ақпараттық', 'Күнделікті мәліметті бірізді және жедел ұсыну', 'Басты бет, апталық кесте, хабарламалар, жетістіктер'),
        ('Коммуникациялық', 'Оқушы–мұғалім және ата-ана–мұғалім байланысын реттеу', 'Сұрақ-жауап чаты, ата-ана чаты'),
        ('Тәрбиелік', 'Тақырыптарды жоспарлау, негізгі ойлар мен талқылау сұрақтарын ашу', 'Тәрбие сағатының айлық және апталық жоспары'),
        ('Қолдау', 'Оқу сұрағына жауап беру, қауіпсіздікке бағыттау, үзілісте сергіту', 'ЖИ-көмекші, көңілді үзіліс таймері'),
    ], [3.2, 6.2, 5.8], header_fill=NAVY, font_size=10)

    add_heading(doc, '2.2 ЖИ-ассистентті педагогикалық қолдану қағидалары', 2)
    add_para(doc, 'ЖИ-көмекші оқушының орнына дайын жұмысты орындаушы емес, түсіндіруші және бағыттаушы ретінде жобаланған. Ол есептің шешу жолын қадамға бөледі, ұқсас мысал ұсынады, формулаларды 8-сынып оқушысына түсінікті жазумен береді және қорытынды жауапты тексеруге көмектеседі. Жауап тілі пайдаланушының тіліне бейімделеді, ал әдепкі тіл — қазақ тілі.')
    add_bullets(doc, [
        'контекстілік қағида: жауап сыныптың нақты кестесі мен тәрбие жоспарына сүйенеді;',
        'шектеу қағидасы: тек мектеп, оқу, білім, мамандық және қауіпсіз мінез-құлық тақырыптарына жауап береді;',
        'қадамдық оқыту қағидасы: дайын нәтижеден бұрын түсіндіру мен ойлануға бағыттайды;',
        'қауіпсіздік қағидасы: саясат, ересектер мазмұны, зиянды әдет, құмар ойын, қару және бұзу әрекеттерін қолдамайды;',
        'тұрақтылық қағидасы: сыртқы ЖИ қызметі қолжетімсіз болса, сынып деректеріне негізделген офлайн жауапқа ауысады.'
    ])

    add_heading(doc, '2.3 Рөлдік қолжетімділік', 2)
    add_para(doc, 'Порталда үш негізгі рөл бар: оқушы, ата-ана және мұғалім. Сынып жетекшісі мұғалім рөлінің кеңейтілген түрі ретінде электрондық пошта бойынша анықталады. Қонақ ашық ақпаратты көре алады, бірақ жазу әрекеттері үшін жүйеге кіруі керек.')
    role_rows = [
        ('Басты бет және кесте', 'Көреді', 'Көреді', 'Көреді', 'Көреді'),
        ('Хабарламалар', 'Оқиды', 'Оқиды', 'Оқиды', 'Жариялайды және өшіреді'),
        ('Сынып чаты', 'Кіру сұралады', 'Жазады', 'Мәзірде жасырылған', 'Жазады'),
        ('Ата-ана чаты', 'Кіру сұралады', 'Қолжетімсіз', 'Жазады', 'Жазады'),
        ('Тәрбие жоспары', 'Көреді', 'Көреді', 'Көреді', 'Көреді'),
        ('Қосымша тәрбие тақырыбы', 'Жоқ', 'Жоқ', 'Жоқ', 'Сынып жетекшісі қосады, өзгертеді, өшіреді'),
        ('Жетістіктер және ЖИ', 'Көреді', 'Көреді', 'Көреді', 'Көреді'),
        ('Көңілді үзіліс', 'Көреді', 'Көреді', 'Мәзірде жасырылған', 'Көреді'),
    ]
    add_table(doc, ['Функция', 'Қонақ', 'Оқушы', 'Ата-ана', 'Мұғалім'], role_rows,
              [4.1, 2.2, 2.2, 2.4, 4.0], header_fill=GREEN, font_size=9.3,
              alignments=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER,
                          WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT])

    add_heading(doc, '2.4 Дербес дерек пен қауіпсіздік', 2)
    add_para(doc, 'Тіркелу Firebase Authentication арқылы e-mail/құпиясөз немесе Google көмегімен орындалады. Пайдаланушы профилінде аты-жөні, e-mail, рөлі, сынып идентификаторы және ата-ана үшін баласының аты сақталуы мүмкін. Мұғалім ретінде тіркелу арнайы кодпен тексеріледі, ал сынып жетекшісі белгіленген e-mail арқылы танылады. Құпиясөзді өзгерту алдында пайдаланушы қайта аутентификациядан өтеді.')
    add_para(doc, 'Firestore ережелері әр коллекцияға бөлек құқық береді. Мысалы, тәрбие сағатының қосымша тақырыбын тек сынып жетекшісі басқарады; чат хабарламасын автор өзі өзгертіп немесе өшіреді; мұғалім хабарлама жариялай алады. ЖИ провайдерінің кілті серверде сақталады және браузерге жіберілмейді.')

    # III бөлім
    add_heading(doc, 'III ПРАКТИКАЛЫҚ БӨЛІМ SYNYPKZ ПОРТАЛЫНЫҢ ЖАСАЛУЫ', 1)
    add_heading(doc, '3.1 Технологиялар стегі', 2)
    tech_rows = [
        ('Next.js', '14.2.35 нақты жинақ нұсқасы', 'App Router, беттер, API маршруттары, өндірістік жинақ'),
        ('React', '18.3.1', 'Интерактивті интерфейс және күйді басқару'),
        ('TypeScript', '5.x', 'Типтік қауіпсіздік және дерек модельдері'),
        ('Tailwind CSS', '3.4.16', 'Бейімделгіш дизайн, түстер, анимациялар'),
        ('Firebase', '10.14.1', 'Authentication, Cloud Firestore, нақты уақыттағы жаңарту'),
        ('Lucide React', '0.468.0', 'Интерфейс белгішелері'),
        ('LLM провайдерлері', 'OpenAI, OpenRouter, Groq, Gemini', 'Ағынды ЖИ жауабы және резервтік модельдер'),
    ]
    add_table(doc, ['Технология', 'Нұсқа немесе қызмет', 'Мақсаты'], tech_rows,
              [3.4, 4.2, 7.0], header_fill=NAVY, font_size=10)

    add_heading(doc, '3.2 Жүйенің архитектурасы', 2)
    add_para(doc, 'SynypKz Next.js App Router архитектурасымен құрылған. Пайдаланушы интерфейсі беттер мен қайта қолданылатын компоненттерден тұрады. AppProvider пайдаланушының аутентификация күйін және рөлін басқарады. useCollection hook-ы Firestore коллекцияларын нақты уақытта тыңдайды. ЖИ сұрағы алдымен клиенттік тақырып сүзгісінен, кейін серверлік сүзгіден өтеді; содан соң /api/ai маршруты қолжетімді провайдерге ағынды сұрау жібереді. Қате не кілт болмаған жағдайда офлайн жауап модулі іске қосылады.')
    add_table(doc, ['Деңгей', 'Негізгі файлдар', 'Қызмет'], [
        ('Интерфейс', 'app/*, components/*', 'Беттерді, формаларды, карточкаларды, кестелерді және чаттарды көрсету'),
        ('Қолданба күйі', 'lib/store.tsx, lib/access.ts', 'Пайдаланушы, рөл, кіру модалі, маршрут құқықтары, Firestore тыңдаушысы'),
        ('Домен деректері', 'lib/schedule-data.ts, lib/class-hour-data.ts, lib/achievements-data.ts', 'Кесте, тәрбие жоспары және жетістіктер мазмұны'),
        ('Бұлттық дерек', 'Firebase Auth, Firestore', 'Профиль, хабарлама, чат және қосымша тақырыптарды сақтау'),
        ('ЖИ қабаты', 'lib/ai-*.ts, app/api/ai/*', 'Шектеу, сынып контексті, провайдер таңдау, ағынды жауап, офлайн режим'),
        ('Қауіпсіздік', 'firestore.rules, серверлік env', 'Рөлдік құқық, дерек валидациясы, API кілтін қорғау'),
    ], [2.8, 5.0, 6.8], header_fill=GREEN, font_size=9.5)

    add_heading(doc, '3.3 Сайт беттерінің құрылымы', 2)
    routes = [
        ('/', 'Басты бет', 'Сәлемдесу, бүгінгі сабақтар, апталық сан, соңғы хабарламалар, 21 жетістік, тіркелген оқушылар мен ата-аналар, жылдам сілтемелер.'),
        ('/schedule', 'Сабақ кестесі', 'Дүйсенбі–сенбі күндері бір бетте; пән, мұғалім, кабинет, басталу және аяқталу уақыты; бүгінгі күнді ерекшелеу.'),
        ('/communication', 'Байланыс орталығы', 'Сынып хабарламалары және жалпы сұрақ-жауап чаты; жариялау, маңызды белгі, өзгерту және өшіру әрекеттері.'),
        ('/achievements', 'Жетістіктер', '21 марапат пен дипломды сурет, атау, иегер, мекеме, күн және сипаттамамен көрсету; суретті үлкейту.'),
        ('/parent-portal', 'Ата-ана чаты', 'Ата-ана мен мұғалімге арналған бөлек нақты уақыттағы арна; оқушыға жазу жабық.'),
        ('/fun-break', 'Көңілді үзіліс', 'Көз, дене және тыныс алу жаттығулары; 10 минуттық таймер, прогресс, бастау, тоқтату, қайта қосу және дыбыстық белгі.'),
        ('/class-hour', 'Тәрбие сағаты', '9 ай, 1–4 апта, 6 бағыт, 39 бекітілген тақырып; негізгі ойлар, талқылау сұрақтары; сынып жетекшісінің CRUD әрекеттері.'),
        ('/ai-assistant', 'ЖИ-көмекші', 'Мектеп және оқу сұрақтарына контекстілік жауап; ағынды мәтін, тоқтату, тазалау, формуланы оқылатын түрде көрсету, офлайн режим.'),
    ]
    add_table(doc, ['URL', 'Бет атауы', 'Негізгі мазмұны және функциясы'], routes,
              [3.0, 3.5, 9.1], header_fill=NAVY, font_size=9.4)

    add_heading(doc, '3.4 Басты бет пен сабақ кестесі', 2)
    add_para(doc, 'Басты бет пайдаланушының күнделікті әрекетін қысқартады. Жүйе ағымдағы күнді анықтап, сол күннің сабақтарын көрсетеді; жексенбі немесе сабақ жоқ күнде келесі оқу күнін есептейді. Апталық сабақ саны автоматты түрде кесте массивінен саналады және қазіргі конфигурацияда 32 сабаққа тең. Әр сабақ карточкасында рет саны, пән, мұғалім, кабинет және уақыт берілген.')
    add_para(doc, 'Толық кесте бетінде алты күн бір экрандық жүйеге топтастырылған. Бүгінгі күн түспен ерекшеленеді, сенбі демалыс күні ретінде көрсетіледі. Кесте Firestore-ға тәуелсіз, кодтағы WEEK_SCHEDULE құрылымында сақталады, сондықтан бекітілген оқу кестесі кездейсоқ пайдаланушы әрекетімен өзгермейді.')

    add_heading(doc, '3.5 Тәрбие сағаты және ситуациялық кейстер', 2)
    add_para(doc, 'Тәрбие сағаты модулі 2026–2027 оқу жылына арналған тоғыз айды қамтиды. Әр ай төрт аптаға бөлінеді, ал тақырыптар экология, заң және тәртіп, кәсіби бағдар, жеке қауіпсіздік, жол қозғалысы ережелері және DOSBOLLIKE бағыттарына біріктірілген. Әр карточкада тақырып туралы түсіндірме, негізгі тірек ойлар және талқылау сұрақтары ашылады. Бұл құрылым ситуациялық кейсті «жағдай — негізгі қағида — сұрақ — шешім» логикасымен талқылауға мүмкіндік береді.')
    add_para(doc, 'Сынып жетекшісі «Тақырып қосу» формасында айды, аптаны, бағытты, атауды, қысқаша мазмұнды, негізгі ойлар мен сұрақтарды енгізеді. Жаңа тақырып интерфейсте бірден көрінеді, кейін Firestore-да сақталады. Қажет болса оны өзгертуге немесе растаудан кейін өшіруге болады. Басқа рөлдер жоспарды тек көреді.')

    add_heading(doc, '3.6 Байланыс орталығы және ата-ана арнасы', 2)
    add_para(doc, 'Байланыс орталығы екі қойындыдан тұрады. «Сынып хабарламалары» бөлімінде мұғалім тақырып пен мәтін енгізіп, жазбаны маңызды деп белгілей алады. Соңғы 30 хабарлама уақыты және авторымен көрсетіледі. Мұғалімдер кез келген хабарламаны, ал автор өз хабарламасын өшіре алады.')
    add_para(doc, '«Сұрақ-жауап» арнасында тіркелген қолданушылар хабарлама жібереді. Өз хабарламасын мәтіндік редакторда өзгертуге және растаудан кейін өшіруге болады; өзгертілген жазбада белгі шығады. Ата-ана порталы сол Firestore messages коллекциясының parent арнасын қолданады. Бұл арнада оқушы тек шектеу хабарын көреді, ал ата-ана мен мұғалім жазысуға құқылы.')

    add_heading(doc, '3.7 Жетістіктер мен сергіту модулі', 2)
    add_para(doc, 'Жетістіктер бөлімі сынып пен педагог портфолиосын көпшілікке түсінікті түрде ұсынады. Қазіргі дерек қорында 21 жетістік бар. Карточка марапаттың атауын, иегерін, берген мекемені, күнін, сипаттамасын және суретін көрсетеді. Суретті басқанда толық экрандық қарау терезесі ашылады, Escape пернесі немесе жабу батырмасы арқылы қайтады.')
    add_para(doc, '«Көңілді үзіліс» бөлімі үш 10 минуттық бағдарлама ұсынады: көзге арналған жаттығу, дене сергітуі және тыныс алу жаттығуы. Таймерді бастауға, уақытша тоқтатуға және қайта орнатуға болады. Дөңгелек прогресс уақыты көрсетеді, ал аяқталғанда браузердің AudioContext мүмкіндігі арқылы дыбыстық белгі беріледі.')

    add_heading(doc, '3.8 ЖИ-көмекшінің жұмыс алгоритмі', 2)
    add_bullets(doc, [
        'Пайдаланушы сұрақты енгізеді; клиент сұрақтың оқу шеңберіне сәйкестігін тексереді.',
        'Рұқсат етілген сұрақ соңғы диалог тарихымен бірге /api/ai серверлік маршрутына жіберіледі.',
        'Сервер сүзгіні қайталайды және сыныптың кестесі мен тәрбие жоспарын жүйелік контекстке қосады.',
        'Жүйе OPENAI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY немесе GEMINI_API_KEY бойынша провайдерді таңдайды.',
        'Алдымен AI_MODEL, кейін резервтік модельдер сыналады; жауап SSE ағынымен сөзбе-сөз көрсетіледі.',
        'Кілт жоқ, жарамсыз, лимит біткен немесе желі үзілген жағдайда офлайн модуль сынып деректеріне сүйеніп жауап береді.',
        'Пайдаланушы генерацияны тоқтата алады немесе чат тарихын бір батырмамен тазартады.'
    ], numbered=True)

    add_heading(doc, '3.9 Firestore деректер моделі', 2)
    add_table(doc, ['Коллекция немесе ресурс', 'Мазмұны', 'Нақты қолданыс'], [
        ('users/{uid}', 'name, email, role, classId, studentName, isHomeroom', 'Профиль және рөлді анықтау'),
        ('announcements', 'title, content, important, authorId, createdAt', 'Мұғалім хабарламалары'),
        ('messages', 'channel, senderId, senderRole, content, editedAt', 'Жалпы және ата-ана чаты'),
        ('classHourTopics', 'month, week, direction, title, about, points, questions', 'Сынып жетекшісі қосқан тәрбие тақырыптары'),
        ('Кодтағы деректер', 'WEEK_SCHEDULE, CLASS_HOUR_PLAN, ACHIEVEMENTS', 'Бекітілген кесте, жоспар және портфолио'),
        ('/api/ai', '12 соңғы хабарлама, 4000 таңбаға дейінгі мазмұн', 'ЖИ провайдеріне қауіпсіз серверлік сұрау'),
    ], [4.0, 6.1, 5.5], header_fill=GREEN, font_size=9.5)

    # IV бөлім
    add_heading(doc, 'IV НӘТИЖЕЛЕР МЕН ТАЛДАУ', 1)
    add_heading(doc, '4.1 Функционалдық нәтижелер', 2)
    add_para(doc, 'Жоба нәтижесінде оқу, тәрбие, байланыс және қолдау құралдарын біріктіретін толық веб-портал жасалды. Төмендегі көрсеткіштер жоба кодындағы нақты конфигурация мен 2026 жылғы 28 қыркүйекте орындалған өндірістік жинақ нәтижесіне негізделген.')
    add_table(doc, ['Көрсеткіш', 'Нәтиже'], [
        ('Пайдаланушылық беттер', '8 бет'),
        ('Серверлік API маршруттары', '2 маршрут: /api/ai және /api/ai/status'),
        ('Апталық сабақтар', '32 сабақ'),
        ('Тәрбие бағыттары', '6 бағыт'),
        ('Бекітілген тәрбие тақырыптары', '39 тақырып'),
        ('Жоспар қамтитын айлар', '9 ай, әр айда 1–4 апта'),
        ('Жетістіктер портфолиосы', '21 карточка'),
        ('Үзіліс бағдарламалары', '3 бағдарлама, әрқайсысы 10 минут'),
        ('Негізгі рөлдер', 'Оқушы, ата-ана, мұғалім; сынып жетекшісіне кеңейтілген құқық'),
        ('ЖИ провайдерлері', '4 провайдер және офлайн резервтік режим'),
        ('Өндірістік жинақ', 'Next.js build сәтті аяқталды, TypeScript тексеруі өтті, 11 маршрут құрылды'),
    ], [7.2, 8.4], header_fill=NAVY, font_size=10)

    add_heading(doc, '4.2 Тексеру нәтижесі', 2)
    add_para(doc, 'Өндірістік npm run build тексеруінде жоба қатесіз компиляцияланды, типтер мен lint тексеруінен өтті, 11 статикалық және динамикалық маршрут құрылды. Браузерлік тексеруде басты бетте 32 апталық сабақ, 21 жетістік, дүйсенбінің жеті сабағы, сегіз навигациялық бөлім және тіркелмеген қолданушыға арналған кіру әрекеттері дұрыс көрінді. Сабақ кестесі мен жетістіктер беттері толық ашылды, тәрбие сағатының айлық блоктары және ЖИ-көмекшінің бастапқы интерфейсі көрсетілді.')
    add_table(doc, ['Тексеру нысаны', 'Күтілетін нәтиже', 'Нәтиже'], [
        ('Компиляция және TypeScript', 'Қате болмауы', 'Өтті'),
        ('Статикалық беттер', '8 пайдаланушылық бет ашылуы', 'Өтті'),
        ('AI API', 'Динамикалық серверлік маршруттардың құрылуы', 'Өтті'),
        ('Басты бет деректері', '32 сабақ және 21 жетістік көрсету', 'Өтті'),
        ('Рөлдік интерфейс', 'Кірусіз жазу әрекеттерін шектеу', 'Өтті'),
        ('Адаптивті навигация', 'Desktop және мобильді мәзір компоненттері', 'Код және браузер арқылы расталды'),
    ], [4.0, 7.2, 4.4], header_fill=GREEN, font_size=9.7)

    add_heading(doc, '4.3 Педагогикалық нәтиже және бағалау өлшемдері', 2)
    add_para(doc, 'Порталдың педагогикалық нәтижесі ақпараттың бір ортада жиналуынан көрінеді: оқушы күн тәртібін тез анықтайды, ата-ана мұғалімге тікелей жазады, сынып жетекшісі тәрбие жоспарын ай мен аптаға байланысты жүргізеді, жетістіктер қоғамдастыққа көрінеді, ал ЖИ-көмекші оқу сұрағына жедел түсіндіру береді. Нәтижені мектеп тәжірибесінде бағалау үшін төмендегі өлшемдер ұсынылады.')
    add_table(doc, ['Өлшем', 'Бағалау тәсілі', 'Күтілетін белгі'], [
        ('Ақпаратқа қолжетімділік', 'Кесте немесе хабарламаны табуға кеткен уақытты бақылау', 'Қажетті мәліметке қысқа жолмен жету'),
        ('Қатысу белсенділігі', 'Чаттағы мазмұнды сұрақтар мен тәрбие талқылауына қатысуды санау', 'Оқушының кері байланысы артады'),
        ('Ата-анамен байланыс', 'Арнадағы жауап уақыты мен тақырыптарды талдау', 'Сұраққа уақтылы жауап беріледі'),
        ('Өзіндік оқу', 'ЖИ көмегімен түсіндірілген тақырыптан кейінгі шағын тапсырма', 'Қадамды түсіндіруді қолдана алады'),
        ('Қауіпсіздік', 'Тақырыптан тыс және қауіп белгілері бар сұрақ сценарийлері', 'Дұрыс шектеу және 111 бағыты беріледі'),
        ('Сынып жетекшісінің жұмысы', 'Тақырып қосу мен хабарлама жариялау уақыты', 'Жоспарлау әрекеті бір ортада орындалады'),
    ], [3.6, 7.0, 5.0], header_fill=NAVY, font_size=9.5)

    add_heading(doc, '4.4 Техникалық және педагогикалық шектеулер', 2)
    add_para(doc, 'Жүйенің нақты уақыттағы чаттары мен аутентификациясы Firebase баптауына және интернетке тәуелді. ЖИ сапасы таңдалған провайдер мен модельге байланысты, сондықтан педагог маңызды жауаптарды тексеріп, оқушыға дереккөзбен жұмыс істеуді үйретуі керек. Кодта бекітілген сабақ кестесі тек әзірлеуші өзгерткенде жаңарады; бұл кездейсоқ түзетуден қорғайды, бірақ әкімшілік панель арқылы өзгерту мүмкіндігін кейін қосуды талап етеді. Портал тәрбие жұмысын қолдайды, алайда педагогикалық шешімді автоматты түрде қабылдамайды және мұғалімнің кәсіби жауапкершілігін алмастырмайды.')

    # V бөлім
    add_heading(doc, 'V ҚОРЫТЫНДЫ', 1)
    add_para(doc, '«Цифрлік сынып жетекшісі» жобасы 8 «А» сыныбының оқу және тәрбие кеңістігін бір веб-порталға біріктірді. SynypKz сабақ кестесін, хабарламаларды, сынып пен ата-ана чаттарын, 2026–2027 оқу жылына арналған тәрбие сағаты жоспарын, жетістіктерді, үзіліс жаттығуларын және қауіпсіз ЖИ-көмекшіні өзара байланысты жүйе ретінде ұсынады.')
    add_para(doc, 'Жобаның негізгі құндылығы — технология санын көбейту емес, сынып жетекшісінің нақты әрекеттерін түсінікті рөлдерге бөлу. Мұғалім ақпарат жариялайды, сынып жетекшісі тәрбие мазмұнын басқарады, оқушы оқу мен сынып өміріне қажет деректі алады, ата-ана жеке арнада байланысады. ЖИ-көмекші осы ортаны толықтырып, сабақ пен тәрбие жоспары туралы контекстілік жауап береді және қауіпсіздік шекарасын сақтайды.')
    add_para(doc, 'Техникалық тексеру порталдың өндірістік жинақтан өтетінін және негізгі беттердің браузерде ашылатынын көрсетті. Осылайша жоба мектептегі тәрбие жұмысын цифрландыруға арналған қолданбалы, кеңейтілетін және қазақ тіліндегі дайын үлгі болып табылады.')

    # VI бөлім
    add_heading(doc, 'VI ҰСЫНЫСТАР', 1)
    add_bullets(doc, [
        'порталды бір тоқсан бойы пилоттық режимде қолданып, оқушы, ата-ана және мұғалім кері байланысын жинау;',
        'тәрбие сағаттарына анонимді рефлексия, дауыс беру және ситуациялық кейс нәтижесін сақтау модулін қосу;',
        'сабақ кестесін сынып жетекшісі өзгерте алатын қорғалған әкімшілік интерфейс әзірлеу;',
        'ата-ана чатын жеке диалогтар мен хабарлама мәртебесіне бөлу;',
        'ЖИ жауаптарына пайдаланылған сынып дерегін немесе оқу дереккөзін көрсету мүмкіндігін қосу;',
        'Firestore Security Rules ережелерін эмулятор арқылы автоматты тестілеу және рөлдік сценарийлерді тұрақты тексеру;',
        'мобильді құрылғыға орнатылатын PWA нұсқасын, хабарлама push-ескертулерін және офлайн кестені енгізу;',
        'қолжетімділік аудитін өткізіп, пернетақта навигациясын, контрастты және экран оқырманы белгілерін жетілдіру;',
        'пайдаланушы деректерін сақтау мерзімі, ата-ана келісімі және мектептің дербес дерек саясаты бойынша регламент бекіту;',
        'жобаны басқа сыныптарға бейімдеу үшін мектеп, сынып, жетекші және оқу жылын баптау панеліне шығару.'
    ], numbered=True)

    # VII бөлім
    add_heading(doc, 'VII ПАЙДАЛАНЫЛҒАН ӘДЕБИЕТТЕР МЕН РЕСУРСТАР', 1)
    add_heading(doc, 'Ғылыми және педагогикалық әдебиеттер', 2)
    add_bullets(doc, [
        'Қазақстан Республикасы. «Білім туралы» Заңы. Өзекті редакциясы.',
        'Қазақстан Республикасы Оқу-ағарту министрлігі. Орта білім беру ұйымдарындағы тәрбие жұмысына арналған әдістемелік ұсынымдар.',
        'UNESCO. Guidance for generative AI in education and research. Paris: UNESCO, 2023.',
        'OECD. Digital Education Outlook 2023. Paris: OECD Publishing, 2023.',
    ], numbered=True)

    add_heading(doc, 'Техникалық ресурстар', 2)
    add_bullets(doc, [
        'Next.js 14 App Router ресми құжаттамасы. https://nextjs.org/docs/14/app',
        'React ресми құжаттамасы. https://react.dev',
        'TypeScript ресми құжаттамасы. https://www.typescriptlang.org/docs/',
        'Tailwind CSS ресми құжаттамасы. https://tailwindcss.com/docs',
        'Firebase Authentication құжаттамасы. https://firebase.google.com/docs/auth',
        'Cloud Firestore Security Rules құжаттамасы. https://firebase.google.com/docs/firestore/security/get-started',
        'OpenAI API құжаттамасы. https://platform.openai.com/docs',
        'Lucide белгішелер кітапханасы. https://lucide.dev',
    ], numbered=True)

    add_heading(doc, 'Жоба материалдары', 2)
    add_bullets(doc, [
        'SynypKz жобасының бастапқы коды: Next.js, React, TypeScript және Firebase негізіндегі жергілікті репозиторий.',
        '8 «А» сыныбының апталық сабақ кестесі және 2026–2027 оқу жылына арналған тәрбие сағаты жоспары.',
        'Жармаханова Нұрсұлу Нұрмановнаның жетістіктер портфолиосы, 21 цифрлық материал.',
    ], numbered=True)

    # Keep paragraphs and table rows printable and set document metadata.
    props = doc.core_properties
    props.title = 'Цифрлік сынып жетекшісі ғылыми жобасы'
    props.subject = 'SynypKz порталының толық ғылыми және техникалық құжаттамасы'
    props.author = 'Жармаханова Нұрсұлу Нұрмановна'
    props.keywords = 'SynypKz, сынып жетекшісі, жасанды интеллект, тәрбие сағаты, цифрлық портал'
    props.comments = 'Педагогикалық идеялар фестиваліне арналған ғылыми жоба'

    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == '__main__':
    build()
