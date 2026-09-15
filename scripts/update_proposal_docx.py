import zipfile
import xml.etree.ElementTree as ET
import os
import shutil
from PIL import Image

DOCX_PATH = 'Proposal_Persetujuan_Redesign_BMKG_Cuaca.docx'
BACKUP_PATH = 'Proposal_Persetujuan_Redesign_BMKG_Cuaca.docx.bak'
SCREENSHOTS_DIR = 'output_screenshots'
TEMP_DIR = 'temp_docx_build'

def update_docx():
    print(f'Reading backup from {BACKUP_PATH}...')
    if not os.path.exists(BACKUP_PATH):
        shutil.copyfile(DOCX_PATH, BACKUP_PATH)

    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    os.makedirs(TEMP_DIR, exist_ok=True)

    # Extract entire docx
    with zipfile.ZipFile(BACKUP_PATH, 'r') as z:
        z.extractall(TEMP_DIR)

    # 1. Replace media files
    for i in range(1, 41):
        src_img = os.path.join(SCREENSHOTS_DIR, f'image{i}.png')
        dest_img = os.path.join(TEMP_DIR, 'word', 'media', f'image{i}.png')
        if os.path.exists(src_img):
            shutil.copyfile(src_img, dest_img)
            print(f'Replaced word/media/image{i}.png')
        else:
            print(f'Warning: {src_img} not found!')

    # 2. Update cx, cy extents in word/document.xml
    doc_xml_path = os.path.join(TEMP_DIR, 'word', 'document.xml')
    rels_xml_path = os.path.join(TEMP_DIR, 'word', '_rels', 'document.xml.rels')

    rels_tree = ET.parse(rels_xml_path)
    rels_root = rels_tree.getroot()
    rid_to_target = {r.attrib['Id']: r.attrib['Target'] for r in rels_root}

    # Register XML namespaces
    ET.register_namespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
    ET.register_namespace('wp', 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing')
    ET.register_namespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main')
    ET.register_namespace('pic', 'http://schemas.openxmlformats.org/drawingml/2006/picture')
    ET.register_namespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')

    doc_tree = ET.parse(doc_xml_path)
    doc_root = doc_tree.getroot()

    ns = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }

    drawings = doc_root.findall('.//w:drawing', ns)
    print(f'Found {len(drawings)} drawings in document.xml')

    for idx, d in enumerate(drawings):
        blip = d.find('.//a:blip', ns)
        extent = d.find('.//wp:extent', ns)
        xfrm_ext = d.find('.//a:xfrm/a:ext', ns)

        if blip is not None and extent is not None:
            rid = blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
            target = rid_to_target.get(rid, '')
            # e.g. media/image1.png
            filename = os.path.basename(target)
            img_path = os.path.join(SCREENSHOTS_DIR, filename)
            if os.path.exists(img_path):
                with Image.open(img_path) as im:
                    w, h = im.size

                # Determine if desktop or mobile
                # Filename is image{i}.png
                img_num = int(filename.replace('image', '').replace('.png', ''))
                is_desktop = (img_num % 2 == 1)

                if is_desktop:
                    # Desktop: fixed cx = 3789680
                    cx = 3789680
                    cy = int(cx * (h / w))
                else:
                    # Mobile: target cy = 2286000
                    cy = 2286000
                    cx = int(cy * (w / h))
                    if cx > 1460920:
                        cx = 1460920
                        cy = int(cx * (h / w))

                extent.set('cx', str(cx))
                extent.set('cy', str(cy))
                if xfrm_ext is not None:
                    xfrm_ext.set('cx', str(cx))
                    xfrm_ext.set('cy', str(cy))

                print(f'{filename}: {w}x{h} -> cx={cx}, cy={cy}')

    doc_tree.write(doc_xml_path, xml_declaration=True, encoding='utf-8')
    print('Updated document.xml successfully.')

    # 3. Repack into DOCX
    temp_docx = 'updated_proposal.docx'
    with zipfile.ZipFile(temp_docx, 'w', zipfile.ZIP_DEFLATED) as zip_out:
        for foldername, subfolders, filenames in os.walk(TEMP_DIR):
            for filename in filenames:
                filepath = os.path.join(foldername, filename)
                arcname = os.path.relpath(filepath, TEMP_DIR)
                zip_out.write(filepath, arcname)

    # Overwrite original DOCX
    shutil.move(temp_docx, DOCX_PATH)
    shutil.rmtree(TEMP_DIR)
    print(f'Successfully updated {DOCX_PATH} with all new screenshots and dimensions!')

if __name__ == '__main__':
    update_docx()
