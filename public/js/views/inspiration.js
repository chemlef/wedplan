import { h, icon, sheet, menu, toast, field, input, tagInput, emptyState, pickFile, imageToDataUrl, plural, confirmBox } from '../lib/ui.js';
import { store, list, can, create, patch, remove, bulk } from '../lib/store.js';
import { api } from '../lib/api.js';
import { INSPO_TAGS } from '../lib/templates.js';

const ui = { tag: '', favs: false };

export function parseLink(url) {
  const u = String(url || '').trim();
  let m = u.match(/pinterest\.[a-z.]+\/pin\/(?:[^/]*--)?(\d+)/i);
  if (m) return { kind: 'pin', pinId: m[1], url: u };
  m = u.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/i);
  if (m) return { kind: 'instagram', code: m[2], igType: m[1], url: u };
  if (/^https?:\/\/.+\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(u)) return { kind: 'image', src: u, url: u };
  if (/^https?:\/\//i.test(u)) return { kind: 'link', url: u };
  return null;
}

function itemSheet(it, defaults = {}) {
  const d = it ? structuredClone(it) : { kind: 'note', caption: '', tags: [], ...defaults };
  const editable = can('inspiration', 'edit');
  const s = sheet({
    title: it ? 'Inspiration' : d.kind === 'note' ? 'New note' : 'Add link', doneLabel: it ? 'Save' : 'Add',
    body: h('div', { class: 'form' },
      d.kind !== 'note' && !it ? field('Link', input({ value: d.url || '', placeholder: 'Pinterest pin, Instagram post, image or web page URL', oninput: (e) => { d.url = e.target.value; } }),
        'Instagram: open the post → ··· → Copy link. Pinterest: open the pin → Share → Copy link.') : null,
      field(d.kind === 'note' ? 'Note' : 'Caption', h('textarea', { class: 'input', rows: d.kind === 'note' ? 4 : 2, oninput: (e) => { d.caption = e.target.value; } }, d.caption || '')),
      field('Tags', tagInput(d.tags, (v) => { d.tags = v; }, { suggestions: INSPO_TAGS, placeholder: 'Add tag' }))),
    done: editable ? async () => {
      if (!it && d.kind !== 'note') {
        const p = parseLink(d.url);
        if (!p) { toast('That doesn’t look like a link', { error: true }); return false; }
        Object.assign(d, p);
      }
      if (d.kind === 'note' && !d.caption?.trim()) return false;
      const { id, type, _sort, _updated, _by, ...data } = d;
      if (it) await patch('inspo', it.id, data); else await create('inspo', data);
    } : null,
    footer: it && editable ? [h('button', { class: 'btn danger', onclick: () => { s.close(); remove('inspo', it.id, { label: 'Item' }); } }, icon('trash'), 'Delete'), h('span', { class: 'grow' })] : null,
  });
}

async function upload() {
  const file = await pickFile('image/*');
  if (!file) return;
  try {
    const src = await imageToDataUrl(file, 1200, 0.8);
    await create('inspo', { kind: 'image', src, caption: '', tags: ui.tag ? [ui.tag] : [] });
    toast('Photo added');
  } catch (e) { toast(e.message, { error: true }); }
}

async function pinterestImport() {
  const s = sheet({ title: 'Import from Pinterest', size: 'wide', body: h('div', { class: 'muted' }, 'Loading your boards…') });
  try {
    const { boards } = await api.get(`/api/w/${store.wedding.id}/pinterest/boards`);
    s.setBody(boards.length ? h('div', { class: 'grid auto-s' }, boards.map((b) => h('div', { class: 'card', style: { cursor: 'pointer', padding: 0, overflow: 'hidden' }, onclick: () => showPins(s, b) },
      b.image ? h('img', { src: b.image, alt: '', style: { width: '100%', height: '140px', objectFit: 'cover', display: 'block' } }) : h('div', { style: { height: '140px', background: 'var(--fill-2)' } }),
      h('div', { style: { padding: '10px 12px' } }, h('b', null, b.name), h('div', { class: 'xs muted' }, plural(b.count || 0, 'pin'))))))
      : h('div', { class: 'muted' }, 'No boards found on this Pinterest account.'));
  } catch (e) { s.setBody(h('div', { class: 'neg' }, e.message)); }
}
async function showPins(s, board) {
  s.setBody(h('div', { class: 'muted' }, `Loading “${board.name}”…`));
  const { pins } = await api.get(`/api/w/${store.wedding.id}/pinterest/boards/${board.id}/pins`);
  const have = new Set(list('inspo').map((x) => x.pinId).filter(Boolean));
  const picked = new Set(pins.filter((p) => !have.has(p.id)).map((p) => p.id));
  const grid = h('div', { class: 'masonry' }, pins.map((p) => {
    const card = h('div', { class: 'pin', style: { cursor: 'pointer', outline: picked.has(p.id) ? '3px solid var(--accent)' : 'none', opacity: have.has(p.id) ? 0.4 : 1 }, onclick: () => {
      if (have.has(p.id)) return;
      picked.has(p.id) ? picked.delete(p.id) : picked.add(p.id);
      card.style.outline = picked.has(p.id) ? '3px solid var(--accent)' : 'none';
    } }, h('img', { src: p.image, alt: p.title, loading: 'lazy' }));
    return card;
  }));
  s.setBody(h('div', { class: 'col' },
    h('div', { class: 'row' }, h('button', { class: 'btn plain', onclick: () => pinterestImport() }, icon('chevronL'), 'Boards'), h('b', { class: 'grow' }, board.name),
      h('button', { class: 'btn primary', onclick: async () => {
        const ops = pins.filter((p) => picked.has(p.id)).map((p) => ({ op: 'create', type: 'inspo', data: { kind: 'image', src: p.image, url: p.link, pinId: p.id, caption: p.title || p.description || '', tags: [board.name], source: 'pinterest' } }));
        if (!ops.length) return toast('Select some pins first', { error: true });
        await bulk(ops, `imported ${ops.length} pins from Pinterest`);
        toast(`Imported ${plural(ops.length, 'pin')}`); s.close();
      } }, 'Import selected')),
    grid));
}

function card(it, editable) {
  let media = null;
  if (it.kind === 'image' && it.src) media = h('img', { src: it.src, alt: it.caption || '', loading: 'lazy' });
  else if (it.kind === 'pin') media = h('iframe', { src: `https://assets.pinterest.com/ext/embed.html?id=${it.pinId}`, height: 420, loading: 'lazy', title: 'Pinterest pin', scrolling: 'no' });
  else if (it.kind === 'instagram') media = h('iframe', { src: `https://www.instagram.com/${it.igType || 'p'}/${it.code}/embed`, height: 480, loading: 'lazy', title: 'Instagram post', scrolling: 'no' });
  const tags = (it.tags || []).length ? h('div', { class: 'chips', style: { marginTop: '6px' } }, it.tags.map((t) => h('span', { class: 'chip', style: { height: '20px', fontSize: '11px' } }, t))) : null;
  const actions = h('div', { class: 'pin-actions' },
    h('button', { class: 'btn s icon', 'aria-label': it.fav ? 'Unfavourite' : 'Favourite', onclick: () => editable && patch('inspo', it.id, { fav: !it.fav }), style: it.fav ? { color: '#ff2d55' } : null }, icon('heart')),
    it.url && h('a', { class: 'btn s icon', href: it.url, target: '_blank', rel: 'noopener', 'aria-label': 'Open original' }, icon('link')),
    h('button', { class: 'btn s icon', 'aria-label': 'Edit', onclick: () => itemSheet(it) }, icon('more')));
  if (it.kind === 'note') {
    return h('div', { class: 'pin note-pin', style: { background: it.color || 'var(--card)' } }, actions, it.caption, tags && h('div', { style: { fontFamily: 'var(--font)' } }, tags));
  }
  if (it.kind === 'link') {
    return h('div', { class: 'pin' }, actions, h('a', { href: it.url, target: '_blank', rel: 'noopener', class: 'pin-body', style: { display: 'block', color: 'inherit' } },
      h('div', { class: 'row' }, icon('link', 'faint'), h('span', { class: 'ellipsis small', style: { color: 'var(--accent)' } }, it.url.replace(/^https?:\/\/(www\.)?/, ''))),
      it.caption && h('div', { class: 'mt' }, it.caption)), tags && h('div', { class: 'pin-body', style: { paddingTop: 0 } }, tags));
  }
  return h('div', { class: 'pin' }, actions, media, (it.caption || tags) ? h('div', { class: 'pin-body' }, it.caption, tags) : null,
    it.fav ? h('div', { style: { position: 'absolute', top: '8px', left: '8px', color: '#ff2d55' } }, '♥') : null);
}

export default {
  title: 'Inspiration',
  mounted(ctx) {
    const p = ctx.query.get('pinterest');
    if (p) { history.replaceState({}, '', '/inspiration'); toast(p === 'connected' ? 'Pinterest connected' : 'Pinterest wasn’t connected', { error: p !== 'connected' }); if (p === 'connected') pinterestImport(); }
  },
  render() {
    const editable = can('inspiration', 'edit');
    const items = list('inspo');
    const tags = [...new Set([...items.flatMap((x) => x.tags || [])])].sort();
    const shown = items.filter((x) => (!ui.tag || (x.tags || []).includes(ui.tag)) && (!ui.favs || x.fav)).slice().reverse();
    const pi = store.integrations.pinterest;

    return h('div', null,
      h('div', { class: 'page-head' },
        h('div', null, h('h1', null, 'Inspiration'), h('div', { class: 'sub' }, `${plural(items.length, 'idea')} · photos, Pinterest pins, Instagram posts and notes`)),
        editable && h('div', { class: 'actions' },
          store.config.pinterest && (pi?.connected
            ? h('button', { class: 'btn', style: { color: '#e60023' }, onclick: (e) => menu(e.currentTarget, [
              { label: 'Import pins from a board', icon: 'download', onClick: pinterestImport },
              { label: 'Disconnect Pinterest', icon: 'x', danger: true, onClick: async () => { if (await confirmBox({ title: 'Disconnect Pinterest?', confirm: 'Disconnect', destructive: true })) { await api.del(`/api/w/${store.wedding.id}/integrations/pinterest`); delete store.integrations.pinterest; rr(); } } }]) }, icon('pinterest'), 'Pinterest')
            : h('a', { class: 'btn', style: { color: '#e60023' }, href: `/api/pinterest/connect?w=${store.wedding.id}` }, icon('pinterest'), 'Connect Pinterest')),
          h('button', { class: 'btn', onclick: () => itemSheet(null, { kind: 'note', tags: ui.tag ? [ui.tag] : [] }) }, icon('notes'), h('span', { class: 'hide-m' }, 'Note')),
          h('button', { class: 'btn', onclick: () => itemSheet(null, { kind: 'link', tags: ui.tag ? [ui.tag] : [] }) }, icon('link'), h('span', { class: 'hide-m' }, 'Link')),
          h('button', { class: 'btn primary', onclick: upload }, icon('image'), 'Photo'))),
      h('div', { class: 'chips mb' },
        h('button', { class: ['chip', !ui.tag && !ui.favs && 'on'], onclick: () => { ui.tag = ''; ui.favs = false; rr(); } }, 'All'),
        h('button', { class: ['chip', ui.favs && 'on'], onclick: () => { ui.favs = !ui.favs; rr(); } }, '♥ Favourites'),
        [...new Set([...INSPO_TAGS.filter((t) => tags.includes(t)), ...tags])].map((t) => h('button', { class: ['chip', ui.tag === t && 'on'], onclick: () => { ui.tag = ui.tag === t ? '' : t; rr(); } }, t))),
      items.length ? h('div', { class: 'masonry' }, shown.map((x) => card(x, editable)))
        : h('div', null,
          emptyState('inspo', 'Collect ideas in one place', 'Upload photos, paste links to Pinterest pins and Instagram posts, or jot down notes. Tag them (dress, flowers, cake…) to build mood boards.',
            editable && h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn', onclick: () => itemSheet(null, { kind: 'link' }) }, icon('link'), 'Paste a link'), h('button', { class: 'btn primary', onclick: upload }, icon('image'), 'Upload photo'))),
          h('div', { class: 'card small muted', style: { maxWidth: '620px', margin: '0 auto' } }, h('div', { class: 'row top' }, icon('instagram', 'faint'),
            h('div', null, h('b', { style: { color: 'var(--label)' } }, 'About Instagram & Pinterest. '),
              'Pinterest can be connected so you can browse your own boards and import pins. Instagram no longer lets apps read personal accounts or saved collections, so paste links to posts you like instead — they show up here as live embeds.')))));
  },
};
function rr() { import('../lib/store.js').then((m) => m.emit()); }
