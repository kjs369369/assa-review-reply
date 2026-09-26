"""Generate the original 1200x630 typographic sharing image (optional Pillow tool)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import os
root=Path(__file__).resolve().parent.parent
font_path=os.environ.get('OG_FONT','/System/Library/Fonts/AppleSDGothicNeo.ttc')
im=Image.new('RGB',(1200,630),'#181818');d=ImageDraw.Draw(im)
def text(x,y,s,size,color='#ffffff'):
    d.text((x,y),s,font=ImageFont.truetype(font_path,size),fill=color)
d.rectangle((64,61,113,110),fill='#da291c')
text(131,62,'AICLab',34)
text(64,160,'앗싸, 답글!',91)
text(68,283,'짧은 리뷰에도',42)
text(68,341,'정성이 전해지도록.',42)
text(68,447,'답글 3종 · 80자 이내 · 무료 문장 조합',23,'#cccccc')
d.line((64,542,1136,542),fill='#424242',width=1)
text(64,567,'AI콘텐츠융합연구소  |  대표 김진수',22,'#b3b3b3')
text(904,567,'info@aiclab2020.com',18,'#b3b3b3')
d.rectangle((706,155,1136,472),fill='#ffffff')
d.rectangle((706,155,1136,162),fill='#da291c')
text(736,188,'고객의 한마디',20,'#626262')
text(736,224,'“잘 먹고 갑니다”',35,'#181818')
d.line((736,288,1106,288),fill='#d2d2d2',width=1)
text(736,316,'맛있게 드셨다니 기뻐요.',27,'#181818')
text(736,362,'짧은 한마디도',27,'#181818')
text(736,407,'감사히 읽었습니다.',27,'#181818')
im.save(root/'public/og-image.png',optimize=True)
print('Created public/og-image.png (1200x630)')
