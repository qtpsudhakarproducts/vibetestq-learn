"""Build the sample resume directory and printable resumes from profiles.json."""
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
FORMATS = {
    'classic': 'Classic single column',
    'modern': 'Modern two column',
    'sidebar': 'Skills sidebar',
    'editorial': 'Editorial',
    'executive': 'Executive',
    'timeline': 'Experience timeline',
    'project': 'Project focused',
    'compact': 'Compact skills first',
}


def formats_for(profiles):
    counts = {}
    result = {}
    for p in profiles:
        category = p['category']
        choices = ('classic', 'modern', 'compact')
        if category in ['sdet', 'automation-engineering', 'architecture']:
            choices = ('sidebar', 'project', 'modern', 'timeline')
        elif category in ['test-leadership', 'senior-leadership']:
            choices = ('editorial', 'executive', 'timeline', 'classic')
        elif category in ['ai-ml-testing', 'performance-testing', 'data-quality']:
            choices = ('project', 'compact', 'sidebar', 'modern')
        index = counts.get(category, 0)
        result[p['path']] = choices[index % len(choices)]
        counts[category] = index + 1
    return result


def bullets(items):
    return '<ul>' + ''.join('<li>' + E(x) + '</li>' for x in items) + '</ul>'


def resume_section(title, content):
    return '<section class="resume-section"><h2>' + E(title) + '</h2>' + content + '</section>'


def decorate(path, directory=False):
    file = ROOT / path
    source = file.read_text(encoding='utf-8')
    extra = '<link rel="stylesheet" href="/assets/academy/profiles.css?v=20261005.2">'
    if directory:
        extra += '<script defer src="/assets/academy/profiles.js?v=20261005.2"></script>'
    file.write_text(source.replace('</head>', extra + '</head>'), encoding='utf-8')


def write_markdown(p):
    r = p['resume']
    text = f'# {r["name"]}\n\n{p["role"]} | {p["experience"]} experience | {r["location"]}\n\n'
    text += 'Sample resume with fictional details. Replace the content with your own experience and qualifications.\n\n'
    text += 'Email: [Your email] | Phone: [Your phone]\nLinkedIn: [Your LinkedIn URL] | GitHub / Portfolio: [Your portfolio URL]\n\n'
    text += '## Professional Summary\n\n' + ''.join('- ' + x + '\n' for x in r['summary'])
    text += '\n## Technical Skills\n\n' + ', '.join(r['technologies']) + '\n'
    text += '\n## Work Experience\n\n### ' + p['role'] + '\n\n[Company name] | [Start date - End date]\n\n' + r['experience'] + '\n\n'
    text += '### Responsibilities\n\n' + ''.join('- ' + x + '\n' for x in r['responsibilities'])
    text += '\n## Project Experience\n\n'
    for x in r['projects']:
        title, separator, description = x.partition(': ')
        text += '### ' + title + '\n\n' + (description if separator else x) + '\n\n'
    for title, key in [('Education', 'education'), ('Certifications', 'certifications'), ('Achievements', 'achievements')]:
        if r[key]:
            text += '## ' + title + '\n\n' + r[key] + '\n\n'
    (ROOT / 'profiles' / Path(p['path']).with_suffix('.md')).write_text(text.rstrip() + '\n', encoding='utf-8')


def build():
    data = json.loads((ROOT / 'profiles/profiles.json').read_text(encoding='utf-8'))
    profiles, categories = data['profiles'], data['categories']
    formats = formats_for(profiles)
    career = '<section class="ap-hero"><div class="ap-wrap"><span class="ap-eyebrow">VibeTestQ Academy</span><h1>Career Preparation.<br><span>Profiles &amp; interview practice.</span></h1><p class="ap-lead">Browse sample QA resumes or prepare with interview questions.</p></div></section>'
    career += section('resources', 'Choose a resource', 'Two ways to get started.', '', cards([
        ('Sample resumes', 'Sample QA profiles', 'Browse 57 resume examples by role and experience, with professional summaries, skills, work experience and projects.', '/profiles/', 'Browse sample profiles'),
        ('Interview study', 'Interview Preparation', 'Review Quality Engineering questions and explanations.', '/iqs/', 'Browse interview questions')
    ], 'two'), True)
    page('career-preparation/index.html', 'Career Preparation | VibeTestQ Academy', 'Sample QA resumes and interview preparation resources.', career, 'career')
    decorate('career-preparation/index.html')
    intro = '<section class="ap-hero resume-directory-hero"><div class="ap-wrap"><span class="ap-eyebrow">Sample resumes</span><h1>Sample QA profiles.</h1><p class="ap-lead">Browse complete resume examples for QA, automation, SDET and test leadership roles. Choose a role and experience level, then open a sample to see how it is written.</p><p class="ap-fine">57 samples. Print or save as PDF, or download editable Markdown. Names and details are fictional; adapt the sample to your own experience.</p></div></section>'
    options = ''.join(f'<option value="{E(k)}">{E(v["label"])}</option>' for k, v in categories.items())
    filters = f'<div class="cp-filters"><div><label for="profile-search">Search roles or skills</label><input id="profile-search" type="search" placeholder="Try Playwright, API or test lead"></div><div><label for="profile-category">Role family</label><select id="profile-category"><option value="all">All role families</option>{options}</select></div><div><label for="profile-level">Experience level</label><select id="profile-level"><option value="all">All levels</option><option value="junior">Junior</option><option value="mid">Mid-level</option><option value="senior">Senior</option><option value="lead">Lead / manager</option><option value="exec">Principal / leadership</option></select></div><button type="button" class="ap-button secondary" id="profile-reset">Reset filters</button></div><p id="profile-count" role="status" aria-live="polite">57 sample profiles</p><p id="profile-empty" hidden>No profiles match. Try another role family or clear the filters.</p>'
    directory = []
    for p in profiles:
        r = p['resume']
        search = ' '.join([r['name'], p['role'], *r['technologies']]).lower()
        skills = ' &middot; '.join(E(x) for x in r['technologies'][:6])
        directory.append(f'<article class="ap-card cp-card" data-category="{E(p["category"])}" data-level="{E(p["level"])}" data-search="{E(search, quote=True)}"><span class="ap-tag">{E(p["levelLabel"])} &middot; {E(p["experience"].replace("1 years", "1 year"))}</span><h3><a href="/profiles/{E(p["path"])}">{E(p["role"])}</a></h3><p class="cp-sample-name">{E(r["name"])} &middot; Sample resume</p><p class="cp-skills">{skills}</p><p class="resume-format-label">Format: {FORMATS[formats[p["path"]]]}</p><a class="ap-button secondary" href="/profiles/{E(p["path"])}">View sample resume</a></article>')
    body = intro + '<section class="ap-section white resume-directory-list" id="examples"><div class="ap-wrap">' + filters + '<div class="ap-grid three">' + ''.join(directory) + '</div></div></section>'
    page('profiles/index.html', 'Sample QA Profiles & Resumes | VibeTestQ Academy', 'Browse 57 complete sample resumes for QA, automation, SDET, specialist and test leadership roles. Print, save as PDF or download editable Markdown.', body, 'career')
    decorate('profiles/index.html', directory=True)
    for p in profiles:
        r = p['resume']
        md = E(Path(p['path']).name.replace('.html', '.md'))
        actions = f'<div class="ap-wrap resume-toolbar"><a href="/profiles/">&larr; All sample profiles</a><div><button type="button" class="ap-button" onclick="window.print()">Print / Save as PDF</button><a class="ap-button secondary" href="{md}" download>Download Markdown</a></div></div>'
        header = f'<header class="resume-heading"><span class="ap-eyebrow">Sample resume</span><h1>{E(r["name"])}</h1><p class="resume-role">{E(p["role"])} &middot; {E(p["experience"].replace("1 years", "1 year"))} experience</p><p>{E(r["location"])}</p><p class="resume-contact">[Your email] &middot; [Your phone]<br>[Your LinkedIn URL] &middot; [Your GitHub / Portfolio URL]</p></header>'
        summary = resume_section('Professional Summary', bullets(r['summary']))
        experience = resume_section('Work Experience', f'<h3>{E(p["role"])}</h3><p class="resume-muted">[Company name] &middot; [Start date &ndash; End date]</p><p>{E(r["experience"])}</p><h3>Responsibilities</h3>' + bullets(r['responsibilities']))
        projects = ''
        for x in r['projects']:
            title, separator, description = x.partition(': ')
            projects += '<div class="resume-project"><h3>' + E(title) + '</h3><p>' + E(description if separator else x) + '</p></div>'
        project = resume_section('Project Experience', '<div class="resume-project-grid">' + projects + '</div>')
        skills = resume_section('Technical Skills', '<div class="resume-tags">' + ''.join('<span>' + E(x) + '</span>' for x in r['technologies']) + '</div>')
        qualifications = ''
        for title, key in [('Education', 'education'), ('Certifications', 'certifications'), ('Achievements', 'achievements')]:
            if r[key]:
                qualifications += resume_section(title, '<p>' + E(r[key]) + '</p>')
        format = formats[p['path']]
        if format == 'sidebar':
            sheet = '<div class="resume-columns"><aside aria-label="Profile, skills and qualifications">' + header + skills + qualifications + '</aside><div>' + summary + experience + project + '</div></div>'
        elif format == 'classic':
            sheet = header + summary + skills + experience + project + qualifications
        elif format == 'compact':
            sheet = header + skills + '<div class="resume-columns"><div>' + summary + experience + project + '</div><aside aria-label="Qualifications">' + qualifications + '</aside></div>'
        elif format == 'timeline':
            sheet = header + summary + '<div class="resume-timeline">' + experience + project + '</div>' + skills + qualifications
        elif format == 'project':
            sheet = header + summary + project + '<div class="resume-columns"><div>' + experience + '</div><aside aria-label="Skills and qualifications">' + skills + qualifications + '</aside></div>'
        elif format == 'executive':
            sheet = header + summary + experience + '<div class="resume-columns"><div>' + project + '</div><aside aria-label="Skills and qualifications">' + skills + qualifications + '</aside></div>'
        elif format == 'editorial':
            sheet = header + summary + experience + project + '<div class="resume-columns"><div>' + skills + '</div><aside aria-label="Qualifications">' + qualifications + '</aside></div>'
        else:
            sheet = header + '<div class="resume-columns"><div>' + summary + experience + project + '</div><aside aria-label="Skills and qualifications">' + skills + qualifications + '</aside></div>'
        body = actions + '<div class="ap-wrap"><p class="resume-note">Sample resume with fictional details. Replace the content with your own experience and qualifications. <strong>Format: ' + FORMATS[format] + '.</strong></p><article class="resume-sheet resume-format-' + format + '">' + sheet + '</article></div>'
        path = 'profiles/' + p['path']
        page(path, r['name'] + ' - ' + p['role'] + ' | Sample Resume | VibeTestQ Academy', 'Sample resume for ' + p['role'] + ' with summary, skills, experience, projects and qualifications.', body, 'career')
        decorate(path)
        write_markdown(p)
    (ROOT / 'career-preparation/job-market.html').write_text('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/career-preparation/"><link rel="canonical" href="https://academy.vibetestq.com/career-preparation/"><title>Career Preparation | VibeTestQ Academy</title></head><body><p>Continue to <a href="/career-preparation/">Career Preparation</a>.</p></body></html>\n', encoding='utf-8')


if __name__ == '__main__':
    build()
