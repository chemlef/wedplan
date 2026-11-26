import { h, icon, sheet, menu, toast, field, input, select, toggle, debounce, emptyState, plural, download, toCsv, printHtml, esc, sortable, confirmBox } from '../lib/ui.js';
import { store, list, can, create, patch, remove, bulk, coupleNames } from '../lib/store.js';
import { api } from '../lib/api.js';
import { MUSIC_SECTIONS } from '../lib/templates.js';

const ui = { section: 'all', results: [], q: '', searching: false, target: 'party' };
const dur = (ms) => (ms ? `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}` : '');
const sectionName = (k) => MUSIC_SECTIONS.find((s) => s.key === k)?.name || 'Other';

function songSheet(s0, defaults = {}) {
  const d = s0 ? { ...s0 } : { title: '', artist: '', section: ui.target, ...defaults };
  const editable = can('music', 'edit');
  const s = sheet({
    title: s0 ? s0.title : 'Add a song', doneLabel: s0 ? 'Save' : 'Add', size: 'narrow',
    body: h('div', { class: 'form' },
      field('Song', input({ value: d.title, oninput: (e) => { d.title = e.target.value; } })),
      field('Artist', input({ value: d.artist || '', oninput: (e) => { d.artist = e.target.value; } })),
      field('Moment', select(MUSIC_SECTIONS.map((x) => ({ value: x.key, label: x.name })), d.section, (v) => { d.section = v; })),
      field('Note for the DJ / band', input({ value: d.note || '', placeholder: 'e.g. start at the chorus, fade at 2:30', oninput: (e) => { d.note = e.target.value; } })),
      d.requestedBy ? h('div', { class: 'small muted' }, `Requested by ${d.requestedBy}`) : null),
    done: editable ? async () => {
      if (!d.title.trim()) return false;
      const { id, type, _sort, _updated, _by, ...data } = d;
      if (s0) await patch('song', s0.id, data); else await create('song', data);
    } : null,
    footer: s0 && editable ? [h('button', { class: 'btn danger', onclick: () => { s.close(); remove('song', s0.id, { label: s0.title }); } }, icon('trash'), 'Remove'), h('span', { class: 'grow' })] : null,
  });
}

const doSearch = debounce(async () => {
  if (!ui.q.trim()) { ui.results = []; rr(); return; }
  ui.searching = true; rr();
  try { ui.results = (await api.get(`/api/w/${store.wedding.id}/spotify/search?q=${encodeURIComponent(ui.q)}`)).tracks; } catch (e) { toast(e.message, { error: true }); ui.results = []; }
  ui.searching = false; rr();
}, 400);

function exportSheet() {
  const sections = MUSIC_SECTIONS.filter((s) => s.key !== 'donotplay');
  const st = { name: `${coupleNames()} – Wedding`, include: new Set(sections.filter((s) => s.key !== 'requests').map((s) => s.key)), newPlaylist: false };
  const songs = () => list('song').filter((x) => st.include.has(x.section));
  const sp = store.integrations.spotify;
  sheet({
    title: 'Export playlist', size: 'narrow',
    body: h('div', { class: 'form' },
      field('Include', h('div', { class: 'list' }, sections.map((s) => h('label', { class: 'list-item' }, h('span', { class: 'grow' }, s.name, h('span', { class: 'muted small' }, ` (${list('song').filter((x) => x.section === s.key).length})`)),
        h('input', { type: 'checkbox', checked: st.include.has(s.key), onchange: (e) => (e.target.checked ? st.include.add(s.key) : st.include.delete(s.key)) }))))),
      h('div', { class: 'col' },
        h('button', { class: 'btn', onclick: () => download('wedding-playlist.csv', toCsv([['Moment', 'Song', 'Artist', 'Note', 'Requested by', 'Spotify link'],
          ...MUSIC_SECTIONS.flatMap((s) => list('song').filter((x) => x.section === s.key && (st.include.has(s.key) || s.key === 'donotplay')).map((x) => [s.name, x.title, x.artist, x.note, x.requestedBy, x.url]))]), 'text/csv') }, icon('download'), 'Download CSV (for the DJ)'),
        h('button', { class: 'btn', onclick: () => printHtml('Wedding playlist', `<h1>${esc(coupleNames())}</h1><div class="muted">Music plan</div>${MUSIC_SECTIONS.filter((s) => st.include.has(s.key) || s.key === 'donotplay').map((s) => {
          const xs = list('song').filter((x) => x.section === s.key);
          return xs.length ? `<h2>${esc(s.name)}</h2><table>${xs.map((x, i) => `<tr><td style="width:24px">${i + 1}</td><td><b>${esc(x.title)}</b></td><td>${esc(x.artist || '')}</td><td class="muted">${esc(x.note || '')}</td></tr>`).join('')}</table>` : '';
        }).join('')}`) }, icon('print'), 'Print music plan'),
        h('button', { class: 'btn', onclick: () => { navigator.clipboard.writeText(songs().map((x) => `${x.title}${x.artist ? ` – ${x.artist}` : ''}`).join('\n')); toast('Song list copied'); } }, icon('copy'), 'Copy as text')),
      store.config.spotify ? h('div', { class: 'card', style: { background: 'var(--card-2)' } },
        h('div', { class: 'card-title' }, icon('spotify'), 'Spotify'),
        sp?.connected ? [
          field('Playlist name', input({ value: st.name, oninput: (e) => { st.name = e.target.value; } })),
          sp.playlistUrl && h('label', { class: 'row small mt' }, h('span', { class: 'grow' }, 'Create a new playlist instead of updating the existing one'), toggle(false, (v) => { st.newPlaylist = v; })),
          h('button', { class: 'btn primary mt', onclick: async (e) => {
            e.target.disabled = true;
            try {
              const r = await api.post(`/api/w/${store.wedding.id}/spotify/export`, { name: st.name, uris: songs().map((x) => x.uri).filter(Boolean), newPlaylist: st.newPlaylist });
              store.integrations.spotify.playlistUrl = r.url;
              toast(`${plural(r.count, 'song')} sent to Spotify`, { action: r.url ? { label: 'Open', onClick: () => window.open(r.url, '_blank') } : undefined });
            } catch (x) { toast(x.message, { error: true }); } finally { e.target.disabled = false; }
          } }, icon('send'), sp.playlistUrl ? 'Update Spotify playlist' : 'Create Spotify playlist'),
          h('div', { class: 'xs muted mt' }, 'Only songs added from Spotify search can be sent. Songs typed in by hand stay in the CSV.')]
          : h('a', { class: 'btn mt', href: `/api/spotify/connect?w=${store.wedding.id}` }, 'Connect Spotify first')) : null),
  });
}

export default {
  title: 'Music',
  mounted(ctx) {
    const s = ctx.query.get('spotify');
    if (s) { history.replaceState({}, '', '/music'); toast(s === 'connected' ? 'Spotify connected' : 'Spotify wasn’t connected', { error: s !== 'connected' }); }
  },
  render() {
    const editable = can('music', 'edit');
    const songs = list('song');
    const sp = store.integrations.spotify;
    const total = songs.filter((s) => s.section !== 'donotplay').reduce((a, s) => a + (s.duration || 0), 0);

    const track = (s) => h('div', { class: 'track', 'data-id': s.id },
      editable && h('span', { class: 'handle' }, icon('grip')),
      h('div', { class: 'art' }, s.image ? h('img', { src: s.image, alt: '' }) : icon('music')),
      h('div', { class: 'grow', style: { minWidth: 0, cursor: 'pointer' }, onclick: () => songSheet(s) },
        h('div', { class: 'ellipsis', style: { fontWeight: 500 } }, s.title),
        h('div', { class: 'xs muted ellipsis' }, [s.artist, s.note, s.requestedBy && `requested by ${s.requestedBy}`].filter(Boolean).join(' · '))),
      h('span', { class: 'xs muted num' }, dur(s.duration)),
      s.url && h('a', { class: 'btn plain icon s', href: s.url, target: '_blank', rel: 'noopener', 'aria-label': 'Open in Spotify', style: { color: '#1db954' } }, icon('spotify')),
      editable && h('button', { class: 'btn plain icon s', 'aria-label': 'Move', onclick: (e) => menu(e.currentTarget, [{ header: 'Move to' }, ...MUSIC_SECTIONS.map((m) => ({ label: m.name, checked: m.key === s.section, onClick: () => patch('song', s.id, { section: m.key }) })), '-', { label: 'Remove', icon: 'trash', danger: true, onClick: () => remove('song', s.id, { label: s.title }) }]) }, icon('more')));

    const sectionBlock = (sec) => {
      const xs = songs.filter((s) => s.section === sec.key);
      if (ui.section !== 'all' && ui.section !== sec.key) return null;
      if (ui.section === 'all' && !xs.length && ['requests', 'donotplay', 'traditional', 'parents', 'cake', 'entrance'].includes(sec.key)) return null;
      const l = h('div', { class: 'list' }, xs.length ? xs.map(track) : h('div', { class: 'list-empty small' }, sec.hint || 'No songs yet'),
        editable ? h('div', { class: 'list-item tap small', style: { color: 'var(--accent)' }, onclick: () => { ui.target = sec.key; songSheet(null, { section: sec.key }); } }, icon('plus', 'faint'), 'Add song') : null);
      if (editable) sortable(l, (ids) => bulk(ids.map((id, i) => ({ op: 'patch', type: 'song', id, data: { _sort: i } }))), '.track');
      return [h('div', { class: 'section-h' }, sec.name, h('span', { class: 'badge' }, xs.length), sec.key === 'donotplay' ? h('span', { class: 'xs neg', style: { textTransform: 'none' } }, 'The DJ will avoid these') : null), l];
    };

    const searchPanel = sp?.connected ? h('div', { class: 'card mb' },
      h('div', { class: 'row wrap' },
        h('div', { class: 'search grow' }, icon('search'), input({ placeholder: 'Search Spotify for songs…', value: ui.q, 'data-k': 'sp-q', oninput: (e) => { ui.q = e.target.value; doSearch(); } })),
        h('span', { class: 'small muted' }, 'Add to'),
        select(MUSIC_SECTIONS.map((x) => ({ value: x.key, label: x.name })), ui.target, (v) => { ui.target = v; }, { class: 'input s', style: { width: 'auto' } })),
      ui.searching ? h('div', { class: 'small muted mt' }, 'Searching…') : null,
      ui.results.length ? h('div', { class: 'mt' }, ui.results.map((t) => {
        const added = songs.find((s) => s.spotifyId === t.spotifyId);
        return h('div', { class: 'track', style: { padding: '6px 0' } },
          h('div', { class: 'art' }, t.image ? h('img', { src: t.image, alt: '' }) : icon('music')),
          h('div', { class: 'grow', style: { minWidth: 0 } }, h('div', { class: 'ellipsis', style: { fontWeight: 500 } }, t.title), h('div', { class: 'xs muted ellipsis' }, `${t.artist} · ${t.album || ''}`)),
          h('span', { class: 'xs muted num' }, dur(t.duration)),
          added ? h('span', { class: 'xs pos' }, `✓ ${sectionName(added.section)}`)
            : editable && h('button', { class: 'btn s tinted', onclick: () => create('song', { ...t, section: ui.target }).then(() => toast(`Added to ${sectionName(ui.target)}`)) }, icon('plus'), 'Add'));
      })) : null) : null;

    return h('div', null,
      h('div', { class: 'page-head' },
        h('div', null, h('h1', null, 'Music'), h('div', { class: 'sub' }, `${plural(songs.filter((s) => s.section !== 'donotplay').length, 'song')}${total ? ` · ${Math.round(total / 60000)} minutes` : ''}${songs.filter((s) => s.section === 'requests').length ? ` · ${songs.filter((s) => s.section === 'requests').length} guest requests` : ''}`)),
        h('div', { class: 'actions' },
          store.config.spotify && (sp?.connected
            ? h('button', { class: 'btn', style: { color: '#1db954' }, onclick: (e) => menu(e.currentTarget, [{ header: `Connected as ${sp.user?.name || 'Spotify user'}` }, sp.playlistUrl && { label: 'Open playlist in Spotify', icon: 'link', onClick: () => window.open(sp.playlistUrl, '_blank') },
              editable && { label: 'Disconnect Spotify', icon: 'x', danger: true, onClick: async () => { if (await confirmBox({ title: 'Disconnect Spotify?', confirm: 'Disconnect', destructive: true })) { await api.del(`/api/w/${store.wedding.id}/integrations/spotify`); delete store.integrations.spotify; rr(); } } }]) }, icon('spotify'), 'Spotify')
            : editable && h('a', { class: 'btn', href: `/api/spotify/connect?w=${store.wedding.id}`, style: { color: '#1db954' } }, icon('spotify'), 'Connect Spotify')),
          h('button', { class: 'btn', onclick: exportSheet, disabled: !songs.length }, icon('download'), 'Export'),
          editable && h('button', { class: 'btn primary', onclick: () => songSheet(null) }, icon('plus'), 'Song'))),
      !store.config.spotify ? h('div', { class: 'card mb', style: { background: 'var(--fill-3)', boxShadow: 'none' } }, h('div', { class: 'row small' }, icon('spotify', 'faint'),
        h('span', { class: 'muted' }, 'Add songs by hand, or connect Spotify to search songs and send the playlist straight to your account. To turn it on, add Spotify keys in Vercel (see the README).'))) : null,
      searchPanel,
      h('div', { class: 'chips mb' }, [{ key: 'all', name: 'All moments' }, ...MUSIC_SECTIONS].map((s) => h('button', { class: ['chip', ui.section === s.key && 'on'], onclick: () => { ui.section = s.key; rr(); } }, s.name,
        s.key !== 'all' && songs.filter((x) => x.section === s.key).length ? ` ${songs.filter((x) => x.section === s.key).length}` : ''))),
      songs.length || ui.section !== 'all' ? MUSIC_SECTIONS.map(sectionBlock)
        : emptyState('music', 'Plan the soundtrack', 'Pick songs for the aisle, first dance and the party. Guests can request songs with their RSVP, and you can export the list for the DJ or to Spotify.',
          editable && h('button', { class: 'btn primary', onclick: () => songSheet(null) }, icon('plus'), 'Add a song')));
  },
};
function rr() { import('../lib/store.js').then((m) => m.emit()); }
