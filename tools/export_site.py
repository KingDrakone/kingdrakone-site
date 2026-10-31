#!/usr/bin/env python3
"""Converte os ficheiros da página (Main.dc.html e Artboard-*.dc.html) em HTML estático.
Uso: python3 tools/export_site.py <pasta-com-os-.dc.html>
- troca /_blob/<id> por assets/<id>.<ext> (os ficheiros têm de estar em assets/)
- troca os links entre páginas pelos nomes finais
"""
import glob, os, re, sys
src = sys.argv[1].rstrip('/') + '/'
M = {'Main': 'index', 'Artboard-9q2p': 'playlists', 'Artboard-kq7f': 'playlist-gta6',
     'Artboard-vh5i': 'playlist-minecraft', 'Artboard-wptd': 'playlist-fortnite',
     'Artboard-4f5r': 'playlist-memes', 'Artboard-1qrz': 'playlist-reacoes',
     'Artboard-p82f': 'playlist-tutoriais', 'Artboard-sxzr': 'playlist-mais',
     'Artboard-a0zs': 'playlist-lives', 'Artboard-6wda': 'shorts'}
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ext = {os.path.basename(f)[:32]: os.path.splitext(f)[1] for f in glob.glob(root + '/assets/*') if len(os.path.basename(f).split('.')[0]) == 32}
bad = False
for a, b in M.items():
    s = open(src + a + '.dc.html', encoding='utf-8').read()
    for k, v in M.items():
        s = s.replace(k + '.dc.html', v + '.html')
    miss = []
    def sub(m):
        if m.group(1) not in ext:
            miss.append(m.group(1)); return m.group(0)
        return 'assets/' + m.group(1) + ext[m.group(1)]
    s = re.sub(r'/_blob/([0-9a-f]{32})', sub, s)
    open(os.path.join(root, b + '.html'), 'w', encoding='utf-8').write(s)
    if miss:
        bad = True; print(b, 'FALTAM ficheiros em assets/:', miss)
print('ok' if not bad else 'com erros')
