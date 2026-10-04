"""Build Academy public pages and refresh the shared shell around existing curricula.
Run: python scripts/build-academy.py
Lesson content, learning state, quizzes, form endpoints, and auth are independent.
"""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
VERSION = '20261004.1'
PUBLIC = ['qa-ai-era-training.html', 'genai-manual-testing.html', 'selenium-genai.html',
          'cypress-genai.html']


def brand():
    return '''<a class="ap-brand" href="/" aria-label="VibeTestQ Academy home"><img class="ap-light" src="/assets/vq/VQLogoTitleForLight.png" width="136" height="72" alt="VibeTestQ"><img class="ap-dark" src="/assets/vq/VQLogoTitleForDark.png" width="136" height="72" alt="VibeTestQ"><span class="ap-badge">ACADEMY</span></a>'''


def header(active=''):
    entries = [('Learn', '/learn/', 'learn'), ('Programs', '/#programs', 'programs'),
               ('Practice', '/practicehub/', 'practice'), ('Career Preparation', '/career-preparation/', 'career'),
               ('Schedule', '/upcoming-trainings.html', 'schedule')]
    links = ''.join(f'<a href="{url}"' + (' aria-current="page"' if key == active else '') + f'>{label}</a>' for label, url, key in entries)
    return f'''<a class="ap-skip" href="#academy-main">Skip to content</a><header class="ap-header"><nav class="ap-wrap ap-nav" aria-label="Academy navigation">{brand()}<div class="ap-links" id="academy-navigation">{links}<a class="ap-company" href="https://vibetestq.com/" target="_blank" rel="noopener">Company ↗</a></div><button class="ap-theme" type="button" aria-label="Switch to dark theme">Dark</button><button class="ap-menu" type="button" aria-expanded="false" aria-controls="academy-navigation">Menu</button></nav></header>'''


def footer():
    return f'''<footer class="ap-footer"><div class="ap-wrap"><div class="ap-footer-grid"><div>{brand()}<p>Training, documentation, and hands-on learning for modern Quality Engineering.</p></div><div><strong>Learn and practice</strong><ul><li><a href="/learn/">Learning library</a></li><li><a href="/playwright/">Playwright curriculum</a></li><li><a href="/practicehub/">Practice challenges</a></li><li><a href="/projects/">Automation practice lab</a></li><li><a href="/playwright/assessments/">Quizzes</a></li></ul></div><div><strong>Programs and preparation</strong><ul><li><a href="/career-preparation/">Career Preparation</a></li><li><a href="/#programs">Live programs</a></li><li><a href="/upcoming-trainings.html">Batch schedule</a></li><li><a href="/iqs/">Interview questions</a></li><li><a href="/profiles/">Sample QA profiles</a></li></ul></div><div><strong>Connect</strong><ul><li><a href="mailto:trainings@vibetestq.com">trainings@vibetestq.com</a></li><li><a href="https://wa.me/message/KUQXMGZALG4FE1" target="_blank" rel="noopener">Ask about training ↗</a></li><li><a href="https://vibetestq.com/" target="_blank" rel="noopener">VibeTestQ company ↗</a></li><li><a href="https://vibetestq.com/tamash-platform/" target="_blank" rel="noopener">TAMASH Platform ↗</a></li></ul></div></div><div class="ap-footer-bottom"><span>© 2026 VibeTestQ Academy.</span><span>Learn · Practice · Build · Prepare</span></div></div></footer>'''


def page(path, title, description, body, active='', resume=False):
    canonical = 'https://academy.vibetestq.com/' + ('' if path == 'index.html' else path)
    result = f'''<!DOCTYPE html><html lang="en" data-theme="light"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{html.escape(title)}</title><meta name="description" content="{html.escape(description, quote=True)}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="website"><meta property="og:url" content="{canonical}"><meta property="og:title" content="{html.escape(title, quote=True)}"><meta property="og:description" content="{html.escape(description, quote=True)}"><meta property="og:image" content="https://academy.vibetestq.com/assets/vq/VQLogoTitleForLight.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/academy/portal.css?v={VERSION}"><script defer src="/assets/academy/portal.js?v={VERSION}"></script></head><body class="academy-public">{header(active)}<main id="academy-main">{body}</main>{footer()}{'<script defer src="/assets/academy/resume.js"></script>' if resume else ''}</body></html>'''
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(result + '\n', encoding='utf-8')


def cards(items, columns='three'):
    return '<div class="ap-grid ' + columns + '">' + ''.join(f'<article class="ap-card"><span class="ap-tag">{tag}</span><h3>{title}</h3><p>{text}</p><a href="{url}">{action} →</a></article>' for tag, title, text, url, action in items) + '</div>'


def section(id, eyebrow, title, lead, content, white=False, more=''):
    return f'''<section class="ap-section{' white' if white else ''}" id="{id}"><div class="ap-wrap"><div class="ap-section-head"><div><span class="ap-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{lead}</p></div>{more}</div>{content}</div></section>'''


def sessions(trainings, limit=None):
    rows = []
    for t in trainings[:limit] if limit else trainings:
        e = lambda key: html.escape(str(t.get(key, '')), quote=True)
        rows.append(f'''<article class="ap-card"><span class="ap-tag">{e('type')}</span><h3>{e('name')}</h3><p>{e('description')}</p><dl><dt>Training starts</dt><dd>{e('trainingStartDate')}</dd><dt>Session time</dt><dd>{e('sessionTime')}</dd><dt>Training fee</dt><dd>{e('pricing')}</dd><dt>One-time payment</dt><dd>{e('oneTimePayment')}</dd><dt>Trainer</dt><dd>{e('trainer')}</dd></dl><a class="ap-button" href="{e('contactUrl')}" target="_blank" rel="noopener">Contact on WhatsApp ↗</a><br><a href="/{e('detailsUrl')}">View program →</a></article>''')
    return f'<div class="ap-grid two" data-academy-sessions="{limit or 0}">' + ''.join(rows) + '</div>' if rows else '<div data-academy-sessions="0"><p>No sessions are listed right now. Email <a href="mailto:trainings@vibetestq.com">trainings@vibetestq.com</a> for the next batch.</p></div>'


def build_practice_apps():
    apps = json.loads((ROOT / 'data/practice-apps.json').read_text(encoding='utf-8'))['apps']
    body = '''<section class="ap-hero"><div class="ap-wrap"><span class="ap-eyebrow">Practice · Application directory</span><h1>Put your testing skills<br><span>to work.</span></h1><p class="ap-lead">Choose a business application, read its guide, and build tests around a complete workflow. Explore six practice apps and Sandbox Studio.</p><div class="ap-actions"><a class="ap-button secondary" href="/practicehub/">Practice challenges →</a><a class="ap-button secondary" href="/projects/">42-day program &amp; Practice Lab →</a></div><p class="ap-fine">Applications and their guides open on vibetestq.com in a new tab.</p></div></section>'''
    app_cards = []
    for app in apps:
        base = 'https://vibetestq.com/testweb/' + app['slug'] + '/'
        links = f'<a class="ap-button" href="{base}" target="_blank" rel="noopener" aria-label="Open {html.escape(app["title"], quote=True)} app">Open app ↗</a>'
        resources = ([{'title': 'Read testing guide' if app['slug'] != 'loan' else 'Read user guide', 'path': app['guide']}] if app.get('guide') else []) + app.get('resources', [])
        links += ''.join(f'<a href="{base}{resource["path"]}" target="_blank" rel="noopener">{html.escape(resource["title"])} ↗</a>' for resource in resources)
        app_cards.append(f'<article class="ap-card" id="{app["slug"]}"><span class="ap-tag">{html.escape(app["category"])}</span><h3>{html.escape(app["title"])}</h3><p>{html.escape(app["description"])}</p><div class="ap-actions">{links}</div></article>')
    body += section('applications', 'Choose a practice target', 'Applications & guides.', 'Start with the guide, identify the expected result, then automate and verify the workflow.', '<div class="ap-grid two">' + ''.join(app_cards) + '</div>', True)
    page('practice/apps/index.html', 'Practice Apps & Testing Guides | VibeTestQ Academy', 'Explore CRM, HRMS, flight booking, loans, asset management, VegCart and Sandbox Studio, with testing guides and workflow examples.', body, 'practice')


def build():
    # Retire instructor decks, including bookmarked links, from the learner site.
    destinations = {path: '/notes/' for path in (ROOT / 'presentations').glob('*.html')}
    destinations[ROOT / 'appium/Mobile-Application-Testing-2026.html'] = '/appium/'
    for path, destination in destinations.items():
        path.write_text(f'<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url={destination}"><link rel="canonical" href="https://academy.vibetestq.com{destination}"><title>Learning resources | VibeTestQ Academy</title></head><body><p>Continue to <a href="{destination}">learning resources</a>.</p></body></html>\n', encoding='utf-8')
    build_practice_apps()
    trainings = json.loads((ROOT / 'upcoming-trainings.json').read_text(encoding='utf-8'))['trainings']
    body = '''<section class="ap-hero"><div class="ap-wrap ap-hero-grid"><div><span class="ap-eyebrow">VibeTestQ Academy · Quality Engineering education</span><h1>Learn the skills.<br>Practice the work.<br><span>Build your confidence.</span></h1><p class="ap-lead">Training, practical guides, and hands-on exercises for modern QA and automation. Choose a learning path, join a live program, or put your skills to work.</p><div class="ap-actions"><a class="ap-button" href="/learn/">Start Learning →</a><a class="ap-button secondary" href="#programs">Explore Live Programs</a></div><p class="ap-fine">Free lessons, practice sets, and quizzes. GitHub sign-in is required for learning pages.</p></div><aside class="ap-start" aria-label="Choose where to start"><span class="ap-eyebrow">Your next step</span><h2>What would you like to do?</h2><p>Pick the route that fits your goal.</p><a href="/playwright/"><strong>Learn automation from the foundations →</strong><span>Start with the Playwright curriculum and supporting guides.</span></a><a href="/practicehub/"><strong>Practice what you already know →</strong><span>Challenges with feedback, hints, and explanations.</span></a><a href="/upcoming-trainings.html"><strong>Learn with an instructor →</strong><span>See the upcoming live online training and contact us on WhatsApp.</span></a><a href="/iqs/"><strong>Prepare for your next interview →</strong><span>Study questions and build a focused preparation plan.</span></a></aside></div></section>'''
    body += section('paths', 'Learn at your pace', 'Find your learning path.', 'Read the guides, work through examples, and follow your progress in the learning library.', cards([
        ('Start here', 'Playwright & automation', 'Build your foundations in JavaScript, TypeScript, Playwright, API testing, and framework design.', '/playwright/', 'Open curriculum'),
        ('AI for QA', 'AI for Testers', 'Understand AI concepts and explore their use in testing and Quality Engineering.', '/ai/', 'Explore AI learning'),
        ('Go further', 'Explore the learning library', 'Browse additional tracks in automation, AI workflows, tools, and engineering practice.', '/learn/', 'Browse all tracks'),
    ]), True, '<a href="/learn/">View the library →</a>')
    body += section('practice', 'Put learning into action', 'Read it. Try it. Check your understanding.', 'Move from an explanation to an exercise, then apply it to a larger workflow.', cards([
        ('Practice', 'Practice challenges', 'Work through JavaScript, TypeScript, and Playwright challenges with feedback and explanations.', '/practicehub/', 'Open Practice Hub'),
        ('Build', 'Practice apps & guides', 'Explore six business apps and Sandbox Studio, with testing guides and workflow examples.', '/practice/apps/', 'Browse practice apps'),
        ('Program', 'Automation practice lab', 'Follow a structured 42-day practice program and apply automation to application targets.', '/projects/', 'Open Practice Lab'),
        ('Check', 'Quizzes & assessments', 'Check your understanding as you work through the Playwright curriculum.', '/playwright/assessments/', 'Explore quizzes'),
    ], 'four'))
    body += section('programs', 'Instructor-led learning', 'Learn with a live program.', 'Explore the curriculum first, then check the schedule or ask which program fits your experience.', cards([
        ('Playwright + GenAI', 'Playwright GenAI Test Lead Training', 'JavaScript and TypeScript, Playwright, framework design, API testing, CI/CD, and GenAI workflows.', '/qa-ai-era-training.html', 'View curriculum'),
        ('AI-assisted QA', 'GenAI Manual Testing', 'Testing foundations, practical AI workflows, and applying GenAI to Quality Engineering work.', '/genai-manual-testing.html', 'View curriculum'),
        ('Selenium + GenAI', 'Selenium automation', 'Build on Selenium foundations and explore advanced automation and GenAI-assisted testing.', '/selenium-genai.html', 'View curriculum'),
        ('Cypress + GenAI', 'Cypress automation', 'Explore modern end-to-end automation, framework practice, and GenAI-assisted testing.', '/cypress-genai.html', 'View curriculum'),
    ], 'four'), True, '<a href="/upcoming-trainings.html">View batch schedule →</a>')
    body += section('sessions', 'Live learning', 'Upcoming live online training.', 'Starts November 10, 2026. Contact us on WhatsApp to join. Times are shown in IST.', sessions(trainings, 2), more='<a href="/upcoming-trainings.html">See all sessions →</a>')
    body += section('preparation', 'Prepare for your next step', 'Career Preparation.', 'Explore role expectations, build evidence of your skills, and prepare to explain your work.', cards([
        ('Career examples', 'Sample QA profiles', 'Explore 57 sample profiles across QA roles and experience levels, with skills, projects, and responsibilities.', '/profiles/', 'Browse sample profiles'),
        ('Study', 'Interview preparation', 'Browse questions and explanations across Quality Engineering topics.', '/iqs/', 'Browse questions'),
    ], 'two'), True, '<a href="/career-preparation/">Explore Career Preparation →</a>')
    body += '''<section class="ap-section"><div class="ap-wrap"><div class="ap-next"><div><span class="ap-eyebrow">Start with one topic</span><h2>Your next learning step is here.</h2><p>Open the library, choose a track, and work through it at your pace.</p></div><a class="ap-button" href="/learn/">Open Learning Library →</a></div><p class="ap-fine">Looking for the TAMASH product? Visit the <a href="https://vibetestq.com/" target="_blank" rel="noopener">VibeTestQ company website ↗</a>.</p></div></section>'''
    page('index.html', 'VibeTestQ Academy | Learn, Practice & Build Quality Engineering Skills', 'Explore Quality Engineering training, learning guides, practice challenges, quizzes, and interview preparation at VibeTestQ Academy.', body, resume=True)

    body = '''<section class="ap-hero"><div class="ap-wrap"><span class="ap-eyebrow">Live programs</span><h1>Find your next<br><span>learning session.</span></h1><p class="ap-lead">Join Playwright GenAI Test Lead Training, live online from November 10, 2026, 8:30–10:00 AM IST. Contact us on WhatsApp to join.</p><div class="ap-actions"><a class="ap-button secondary" href="/#programs">Explore Programs</a><a class="ap-button" href="https://wa.me/message/KUQXMGZALG4FE1" target="_blank" rel="noopener">Contact on WhatsApp ↗</a></div></div></section>'''
    body += section('schedule', 'Batch schedule', 'Playwright GenAI Test Lead Training.', 'Training fee: ₹30,000. Pay ₹27,000 with the 10% one-time payment discount. All session times are shown in IST.', sessions(trainings), True)
    page('upcoming-trainings.html', 'Training Schedule | VibeTestQ Academy', 'Playwright GenAI Test Lead Training: live online from November 10, 2026, 8:30–10:00 AM IST. ₹30,000; one-time payment ₹27,000. Contact on WhatsApp.', body, 'schedule')

    for name in PUBLIC:
        source = (ROOT / name).read_text(encoding='utf-8')
        source = re.sub(r'<html\b[^>]*>', '<html lang="en" data-theme="light">', source, count=1)
        source = re.sub(r'<body\b[^>]*>', '<body class="academy-public">', source, count=1)
        source = re.sub(r'\s*<a class="ap-skip"[^>]*>.*?</a>', '', source, flags=re.S)
        source = re.sub(r'\s*<header\b[^>]*>.*?</header>', lambda _: '\n' + header('programs'), source, count=1, flags=re.S)
        source = re.sub(r'<footer\b[^>]*>.*?</footer>', lambda _: footer(), source, count=1, flags=re.S)
        source = re.sub(r'<main\b[^>]*>', '<main id="academy-main">', source, count=1)
        source = re.sub(r'<script src="script\.js[^\"]*"></script>', '', source)
        source = re.sub(r'<link[^>]+href="/assets/academy/portal\.css[^>]+>', '', source)
        source = re.sub(r'<script defer src="/assets/academy/portal\.js[^\"]*"></script>', '', source)
        source = re.sub(r'\s*</head>', f'\n<link rel="stylesheet" href="/assets/academy/portal.css?v={VERSION}"><script defer src="/assets/academy/portal.js?v={VERSION}"></script>\n</head>', source)
        source = source.replace('color: #ffffff;', 'color: var(--text-main);').replace('color: #cbd5e1;', 'color: var(--text-muted);')
        source = source.replace('Free to use &mdash; including commercially', 'Explore the program')
        (ROOT / name).write_text('\n'.join(line.rstrip() for line in source.splitlines()) + '\n', encoding='utf-8')

    for retired in ['interviews.html', 'mentors.html']:
        (ROOT / retired).write_text('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/"><title>VibeTestQ Academy</title></head><body><p>This service is no longer listed. <a href="/">Visit Academy home</a>.</p></body></html>\n', encoding='utf-8')

    page('404.html', 'Page Not Found | VibeTestQ Academy', 'Find Academy learning paths, training programs, and practice resources.', '''<section class="ap-hero"><div class="ap-wrap"><span class="ap-eyebrow">VibeTestQ Academy</span><h1>Let’s find your<br><span>next learning step.</span></h1><p class="ap-lead">This page is no longer available. Browse the learning library or return to Academy home.</p><div class="ap-actions"><a class="ap-button" href="/learn/">Open Learning Library</a><a class="ap-button secondary" href="/">Academy Home</a></div></div></section>''')
    fallback = (ROOT / '404.html').read_text(encoding='utf-8')
    fallback = re.sub(r'<link rel="canonical"[^>]*>', '<meta name="robots" content="noindex">', fallback)
    (ROOT / '404.html').write_text(fallback, encoding='utf-8')
    (ROOT / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://academy.vibetestq.com/sitemap.xml\n', encoding='utf-8')
    entries = ['', *PUBLIC, 'upcoming-trainings.html', 'learn/', 'playwright/', 'practicehub/', 'practice/apps/', 'projects/', 'iqs/', 'profiles/', 'ai/', 'career-preparation/']
    profile_data = ROOT / 'profiles/profiles.json'
    if profile_data.is_file():
        entries += ['profiles/' + item['path'] for item in json.loads(profile_data.read_text(encoding='utf-8'))['profiles']]
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += ''.join(f'<url><loc>https://academy.vibetestq.com/{path}</loc></url>\n' for path in entries)
    (ROOT / 'sitemap.xml').write_text(sitemap + '</urlset>\n', encoding='utf-8')


if __name__ == '__main__':
    build()
    if (ROOT / 'profiles/profiles.json').is_file():
        import runpy
        runpy.run_path(str(ROOT / 'scripts/build-profiles.py'), run_name='__main__')
