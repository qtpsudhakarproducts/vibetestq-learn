"""Render role-focused career examples from profiles/profiles.json.

Run after build-academy.py. Existing profile URLs and Markdown downloads are kept.
The JSON is editorial content; refresh the research before changing its review date.
"""
from pathlib import Path
import html
import json
import importlib.util

spec = importlib.util.spec_from_file_location('academy_builder', Path(__file__).with_name('build-academy.py'))
academy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(academy)
page, section, cards = academy.page, academy.section, academy.cards

ROOT = Path(__file__).resolve().parents[1]
E = html.escape


def bullets(items):
    return '<ul class="cp-list">' + ''.join('<li>' + E(x) + '</li>' for x in items) + '</ul>'


def build():
    data = json.loads((ROOT / 'profiles/profiles.json').read_text(encoding='utf-8'))
    profiles, categories, sources = data['profiles'], data['categories'], data['sources']
    career_intro = '''<section class="ap-hero"><div class="ap-wrap"><span class="ap-eyebrow">VibeTestQ Academy</span><h1>Career Preparation.<br><span>Show what you can do.</span></h1><p class="ap-lead">Understand the role you want, build evidence of your skills, and practice explaining your decisions. Use the examples to plan your next learning step.</p></div></section>'''
    career_intro += section('resources', 'Prepare with purpose', 'Two ways to get started.', '', cards([
        ('Role examples', 'Sample QA profiles', 'Explore 57 illustrative profiles with focused skills, ownership, project ideas, and evidence to prepare.', '/profiles/', 'Browse sample profiles'),
        ('Interview study', 'Interview Preparation', 'Work through Quality Engineering questions and explanations, then practice with examples from your own experience.', '/iqs/', 'Browse interview questions')
    ], 'two'), True)
    career_intro += section('approach', 'Your next step', 'Turn an example into your own story.', '', bullets([
        'Choose a role and experience level that fit your current work.',
        'Compare the core skills with evidence you can already show.',
        'Build one project for a gap, then explain the test decisions and findings.',
        'Use your real experience and verified results when updating your resume.'
    ]) + '<p><a href="/career-preparation/job-market.html">Read the India job-posting research notes →</a></p>')
    page('career-preparation/index.html', 'Career Preparation | VibeTestQ Academy', 'Explore sample QA profiles, interview questions, project evidence, and learning next steps.', career_intro, 'career')
    decorate('career-preparation/index.html')
    intro = '''<section class="ap-hero"><div class="ap-wrap"><span class="ap-eyebrow">Career Preparation</span><h1>Sample QA profiles.<br><span>Find your next step.</span></h1><p class="ap-lead">Explore role expectations, practical skills, and project ideas across Quality Engineering. Compare the examples with your experience and choose what to build next.</p><p class="cp-note">These are illustrative learning examples, not real candidates or vacancies. Experience ranges describe the examples; employers use different titles and expectations.</p><div class="ap-actions"><a class="ap-button secondary" href="/career-preparation/">Career Preparation</a><a href="/career-preparation/job-market.html">Research and update notes</a></div></div></section>'''
    options = ''.join(f'<option value="{E(k)}">{E(v["label"])}</option>' for k, v in categories.items())
    filters = f'''<div class="cp-filters"><div><label for="profile-search">Search roles, skills, or project topics</label><input id="profile-search" type="search" placeholder="Try API, Playwright, data, or leadership"></div><div><label for="profile-category">Role family</label><select id="profile-category"><option value="all">All role families</option>{options}</select></div><div><label for="profile-level">Experience level</label><select id="profile-level"><option value="all">All levels</option><option value="junior">Junior</option><option value="mid">Mid-level</option><option value="senior">Senior</option><option value="lead">Lead / manager</option><option value="exec">Principal / leadership</option></select></div><button type="button" class="ap-button secondary" id="profile-reset">Reset filters</button></div><p id="profile-count" role="status" aria-live="polite">57 sample profiles</p><p id="profile-empty" hidden>No profiles match. Try another role family or clear the filters.</p>'''
    directory = []
    for p in profiles:
        search = ' '.join([p['role'], p['focus'], *p['core'], *p['optional'], *(x['title'] for x in p['projects'])]).lower()
        directory.append(f'''<article class="ap-card cp-card" data-category="{E(p['category'])}" data-level="{E(p['level'])}" data-search="{E(search, quote=True)}"><span class="ap-tag">{E(p['levelLabel'])} · {E(p['experience'])}</span><h3><a href="/profiles/{E(p['path'])}">{E(p['role'])}</a></h3><p>{E(p['focus'])}</p><p class="cp-skills">{' · '.join(E(x) for x in p['core'][:4])}</p><a href="/profiles/{E(p['path'])}">View sample profile →</a></article>''')
    body = intro + section('examples', 'Choose a role', 'Build a profile you can explain.', 'Core skills, optional specializations, and evidence are separate in every example.', filters + '<div class="ap-grid three">' + ''.join(directory) + '</div>', True)
    page('profiles/index.html', 'Sample QA Profiles | VibeTestQ Academy', 'Explore 57 illustrative Quality Engineering profiles, role expectations, portfolio projects, and learning next steps.', body, 'career')
    decorate('profiles/index.html', directory=True)

    for p in profiles:
        family = categories[p['category']]
        intro = f'''<section class="ap-hero"><div class="ap-wrap"><a href="/profiles/">← Sample QA Profiles</a><p class="ap-eyebrow">{E(family['label'])} · {E(p['levelLabel'])}</p><h1>{E(p['role'])}</h1><p class="ap-lead">{E(p['focus'])}</p><p class="cp-note">Illustrative profile · {E(p['experience'])} of example experience · Reviewed October 4, 2026. This is a learning example, not a real candidate or a hiring requirement.</p></div></section>'''
        content = section('summary', 'Profile example', 'A focused professional summary.', '', bullets(p['summary']), True)
        content += section('scope', 'Ownership at this level', 'What this role takes responsibility for.', '', '<p>' + E(p['scope']) + '</p>' + bullets(p['responsibilities']))
        content += section('skills', 'Demonstrable skills', 'Core skills and optional specialization.', 'The primary stack is one example. Equivalent tools can fit another employer; list only what you can demonstrate.', '<div class="ap-grid two"><article class="ap-card"><h3>Core skills for this example</h3>' + bullets(p['core']) + '</article><article class="ap-card"><h3>Optional / role-dependent</h3>' + bullets(p['optional']) + '</article></div>', True)
        portfolio = ''.join(f'<article class="ap-card"><span class="ap-tag">Portfolio idea</span><h3>{E(x["title"])}</h3><p>{E(x["description"])}</p><h4>Evidence to prepare</h4>{bullets(x["evidence"])}</article>' for x in p['projects'])
        content += section('portfolio', 'Show the work', 'Two projects to discuss in an interview.', 'These are suggested projects, not claims of completed employment or measured results.', '<div class="ap-grid two">' + portfolio + '</div>')
        content += section('evidence', 'Make it credible', 'Explain your contribution.', '', bullets(p['evidence']) + '<p>Replace these examples with your own work. Include measured outcomes only when you have a baseline, a method, and evidence. Add education or certifications only if they are yours.</p>', True)
        learning = [(tag, title, text, url, 'Explore resource') for tag, title, text, url in family['learning']]
        content += section('next', 'Build the missing skills', 'Continue in Academy.', 'These resources support part of this role. Specialist skills may require additional study and hands-on work.', cards(learning))
        source_links = ''.join(f'<li><a href="{E(sources[k]["url"], quote=True)}" target="_blank" rel="noopener">{E(sources[k]["title"])}</a></li>' for k in family['sources'])
        content += section('research', 'Editorial context', 'Postings behind this update.', 'The example combines market observations with Academy guidance; it does not reproduce one job description. Postings can change or close.', '<ul class="cp-list">' + source_links + '</ul><a href="/career-preparation/job-market.html">Read the research notes →</a><p><a href="' + E(Path(p['path']).name.replace('.html', '.md')) + '" download>Download this example as Markdown</a></p>', True)
        path = 'profiles/' + p['path']
        page(path, p['role'] + ' | Sample QA Profile | VibeTestQ Academy', p['focus'], intro + content, 'career')
        decorate(path)
        write_markdown(p, family, sources)

    research = '''<section class="ap-hero"><div class="ap-wrap"><span class="ap-eyebrow">Career Preparation · India research notes</span><h1>What informed<br><span>these examples.</span></h1><p class="ap-lead">Reviewed October 4, 2026. We reviewed India-based role descriptions on Cutshort and Foundit India, with India employer postings as cross-checks, to update Academy's QA examples.</p><p class="cp-note">This is a qualitative editorial review, not a hiring survey, salary guide, or statement about every employer. Titles and experience bands vary. The profiles are Academy-authored learning examples.</p><p>Some specialist postings are older or closed; their status is noted below. They support role guidance and do not imply current vacancies. Naukri was inaccessible to automated browsing and was not used as a verified source.</p></div></section>'''
    research += section('findings', 'Our interpretation', 'Use a focused stack and show the evidence.', '', bullets([
        'Keep test design, investigation, and product understanding visible alongside automation.',
        'For automation roles, show a maintainable primary stack, API coverage, failure diagnosis, and useful CI feedback.',
        'Separate using AI to assist test engineering from evaluating an AI product; they require different evidence.',
        'Specialist roles need their own depth: mobile devices, accessible interactions, performance experiments, or data reconciliation.',
        'Distinguish individual delivery, cross-team technical influence, and people leadership.',
        'Treat tool names as stack examples. Optional technologies are not a universal checklist.'
    ]), True)
    source_cards = ''.join(f'<article class="ap-card"><h3><a href="{E(s["url"], quote=True)}" target="_blank" rel="noopener">{E(s["title"])}</a></h3><p>{E(s["location"])}</p><p>{E(s["note"])}</p><p class="ap-fine">Reviewed October 4, 2026. Link availability may change.</p></article>' for s in sources.values())
    research += section('postings', 'India job sites and employer cross-checks', 'Examples reviewed.', 'Cutshort and Foundit listings form the main source set. Agency listings are identified, and site metadata is treated cautiously. We use responsibilities and skill distinctions; we do not generalize salary or location requirements.', '<div class="ap-grid two">' + source_cards + '</div>')
    page('career-preparation/job-market.html', 'QA Job Market Research Notes | VibeTestQ Academy', 'Employer job postings and editorial notes behind Academy sample QA profiles, reviewed October 4, 2026.', research, 'career')
    decorate('career-preparation/job-market.html')


def decorate(path, directory=False):
    file = ROOT / path
    source = file.read_text(encoding='utf-8')
    extra = '<link rel="stylesheet" href="/assets/academy/profiles.css?v=20261004.1">'
    if directory:
        extra += '<script defer src="/assets/academy/profiles.js?v=20261004.1"></script>'
    file.write_text(source.replace('</head>', extra + '</head>'), encoding='utf-8')


def write_markdown(p, family, sources):
    text = f'# {p["role"]}\n\nIllustrative learning example; not a real candidate. Reviewed October 4, 2026.\n\n'
    text += f'**Example experience:** {p["experience"]}\n\n**Focus:** {p["focus"]}\n\n'
    for title, items in [('Professional summary', p['summary']), ('Responsibilities', [p['scope'], *p['responsibilities']]), ('Core skills', p['core']), ('Optional / role-dependent', p['optional'])]:
        text += '## ' + title + '\n\n' + ''.join('- ' + x + '\n' for x in items) + '\n'
    text += '## Suggested portfolio projects\n\nThese are ideas, not completed-work claims.\n\n'
    for x in p['projects']:
        text += '### ' + x['title'] + '\n\n' + x['description'] + '\n\n' + ''.join('- Evidence: ' + e + '\n' for e in x['evidence']) + '\n'
    text += '## Evidence to prepare\n\n' + ''.join('- ' + x + '\n' for x in p['evidence'])
    text += '\nUse only your own verified qualifications and measured outcomes.\n\n## Continue learning\n\n'
    text += ''.join(f'- [{title}](https://academy.vibetestq.com{url})\n' for _, title, _, url in family['learning'])
    text += '\n## Research context\n\nAcademy editorial synthesis; requirements vary by employer.\n\n'
    text += ''.join(f'- [{sources[k]["title"]}]({sources[k]["url"]})\n' for k in family['sources'])
    (ROOT / 'profiles' / Path(p['path']).with_suffix('.md')).write_text(text, encoding='utf-8')


if __name__ == '__main__':
    build()
