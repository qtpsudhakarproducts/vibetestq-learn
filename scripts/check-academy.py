"""Validate Academy public navigation, assets and preserved form contracts."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
from xml.etree import ElementTree
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PAGES = ['index.html', 'upcoming-trainings.html', 'qa-ai-era-training.html',
         'genai-manual-testing.html', 'selenium-genai.html', 'cypress-genai.html',
         'interviews.html', 'mentors.html', '404.html']


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
    original = subprocess.check_output(['git', 'show', 'main:' + name], cwd=ROOT).decode('utf-8')
    current = (ROOT / name).read_text(encoding='utf-8')
    def contract(text):
        form = re.search(r'<form\b.*?</form>', text, re.S).group()
        return [(tag, {k: v for k, v in attrs.items() if k in ['id', 'name', 'type', 'required', 'value', 'for']}) for tag, attrs in Document(form).elements]
    if contract(original) != contract(current):
        errors.append((name, 'Form inputs changed'))
    for key in ['endpoint', 'token', 'extra', 'readReply']:
        old, new = re.search(key + r':\s*([^\n]+)', original), re.search(key + r':\s*([^\n]+)', current)
        if (old.group(1) if old else None) != (new.group(1) if new else None):
            errors.append((name, 'Submission contract changed', key))
ElementTree.parse(ROOT / 'sitemap.xml')
for error in errors:
    print('FAIL:', *error)
if errors:
    raise SystemExit(1)
print(f'PASS: {len(PAGES)} pages, local links, fragments, assets, labels, sitemap and preserved interview/mentorship submission contracts.')
