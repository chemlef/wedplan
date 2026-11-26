import { h, icon, sheet, field, input, emptyState, timeAgo } from '../lib/ui.js';
import { list, can, create, patch, remove } from '../lib/store.js';

function noteSheet(n) {
  const d = n ? { ...n } : { title: '', body: '' };
  const editable = can('notes', 'edit');
  const s = sheet({
    title: n ? (n.title || 'Note') : 'New note', doneLabel: n ? 'Save' : 'Add', size: 'wide',
    body: h('div', { class: 'form' },
      field('Title', input({ value: d.title, oninput: (e) => { d.title = e.target.value; } })),
      h('textarea', { class: 'input', rows: 14, placeholder: 'Write anything: ideas, vows, speeches, to-dos, addresses…', oninput: (e) => { d.body = e.target.value; } }, d.body || '')),
    done: editable ? async () => {
      if (!d.title.trim() && !d.body.trim()) return false;
      const data = { title: d.title.trim(), body: d.body, pinned: !!d.pinned };
      if (n) await patch('note', n.id, data); else await create('note', data);
    } : null,
    footer: n && editable ? [h('button', { class: 'btn danger', onclick: () => { s.close(); remove('note', n.id, { label: 'Note' }); } }, icon('trash'), 'Delete'), h('span', { class: 'grow' })] : null,
  });
}

export default {
  title: 'Notes',
  render() {
    const editable = can('notes', 'edit');
    const notes = list('note').slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b._updated || 0) - (a._updated || 0));
    return h('div', null,
      h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Notes'), h('div', { class: 'sub' }, 'Shared notes for everyone helping with the wedding.')),
        editable && h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => noteSheet(null) }, icon('plus'), 'Note'))),
      notes.length ? h('div', { class: 'grid auto' }, notes.map((n) => h('div', { class: 'card', style: { cursor: 'pointer', minHeight: '140px', display: 'flex', flexDirection: 'column', gap: '6px' }, onclick: () => noteSheet(n) },
        h('div', { class: 'row' }, h('b', { class: 'grow' }, n.title || 'Untitled'),
          editable && h('button', { class: 'btn plain icon s', 'aria-label': n.pinned ? 'Unpin' : 'Pin', style: { color: n.pinned ? 'var(--accent)' : 'var(--label-3)' }, onclick: (e) => { e.stopPropagation(); patch('note', n.id, { pinned: !n.pinned }); } }, icon('pin'))),
        h('div', { class: 'small muted', style: { whiteSpace: 'pre-wrap', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' } }, n.body || ''),
        h('div', { class: 'xs faint', style: { marginTop: 'auto' } }, `${n._by ? `${n._by} · ` : ''}${n._updated ? timeAgo(n._updated) : ''}`))))
        : emptyState('notes', 'No notes yet', 'Keep vows, speeches, addresses, packing lists or anything else here.', editable && h('button', { class: 'btn primary', onclick: () => noteSheet(null) }, icon('plus'), 'New note')));
  },
};
