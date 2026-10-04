"""Validate Academy public pages, retired services, profiles and training schedule."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
from xml.etree import ElementTree
import re
import json

ROOT = Path(__file__).resolve().parents[1]
PAGES = ['index.html', 'upcoming-trainings.html', 'qa-ai-era-training.html',
         'genai-manual-testing.html', 'selenium-genai.html', 'cypress-genai.html',
         '404.html', 'career-preparation/index.html', 'career-preparation/job-market.html', 'profiles/index.html', 'practice/apps/index.html']
PAGES += ['profiles/' + item['path'] for item in json.loads((ROOT / 'profiles/profiles.json').read_text(encoding='utf-8'))['profiles']]


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.elements = []
        self.feed(text)

    def handle_starttag(self, tag, attributes):
        self.elements.append((tag, dict(attributes)))


errors = []
for name in PAGES:
    source = ROOT / name
    doc = Document(source.read_text(encoding='utf-8'))
    ids = [attrs['id'] for _, attrs in doc.elements if 'id' in attrs]
    if sum(tag == 'h1' for tag, _ in doc.elements) != 1:
        errors.append((name, 'Expected one h1'))
    if any(count > 1 for count in Counter(ids).values()):
        errors.append((name, 'Duplicate IDs'))
    for tag, attrs in doc.elements:
        if tag == 'label' and attrs.get('for') and attrs['for'] not in ids:
            errors.append((name, 'Missing label target', attrs['for']))
        reference = attrs.get('href') if tag == 'a' or (tag == 'link' and attrs.get('rel') == 'stylesheet') else attrs.get('src') if tag in ['img', 'script'] else None
        if not reference:
            continue
        uri = urlsplit(reference)
        if uri.scheme or uri.netloc:
            continue
        target = ROOT / unquote(uri.path.lstrip('/')) if uri.path.startswith('/') else source.parent / unquote(uri.path) if uri.path else source
        found = next((p for p in [target, target.with_suffix('.html'), target / 'index.html'] if p.is_file()), None)
        if not found:
            errors.append((name, 'Missing target', reference))
        elif uri.fragment:
            target_doc = Document(found.read_text(encoding='utf-8'))
            if not any(attrs.get('id') == uri.fragment for _, attrs in target_doc.elements):
                errors.append((name, 'Missing fragment', reference))

for name in ['interviews.html', 'mentors.html']:
    current = (ROOT / name).read_text(encoding='utf-8')
    if '<form' in current or 'content="0;url=/"' not in current:
        errors.append((name, 'Retired service must redirect without a form'))
for name in PAGES:
    if name in ['interviews.html', 'mentors.html']:
        continue
    current = (ROOT / name).read_text(encoding='utf-8')
    if re.search(r'interviews\.html|mentors\.html|Register|meeting/register', current):
        errors.append((name, 'Removed service or registration link still present'))
training = json.loads((ROOT / 'upcoming-trainings.json').read_text(encoding='utf-8'))['trainings']
assert len(training) == 1
assert training[0]['name'] == 'Playwright GenAI Test Lead Training'
assert training[0]['trainingStartDate'] == 'November 10, 2026'
assert training[0]['sessionTime'] == '8:30 AM \u2013 10:00 AM IST'
assert training[0]['pricing'] == '\u20b930,000'
assert training[0]['oneTimePayment'] == '\u20b927,000 (10% discount)'
assert training[0]['contactUrl'] == 'https://wa.me/message/KUQXMGZALG4FE1'
ElementTree.parse(ROOT / 'sitemap.xml')
for error in errors:
    print('FAIL:', *error)
if errors:
    raise SystemExit(1)
print(f'PASS: {len(PAGES)} pages, local links, fragments, assets, labels, sitemap and the single WhatsApp training schedule.')
