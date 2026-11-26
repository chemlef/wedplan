import { h, icon, field, input, toast, seg } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { api } from '../lib/api.js';
import { signOut, applyTheme } from '../app.js';

export default {
  title: 'My account',
  render() {
    const s = store.session;
    const isUser = s.kind === 'user';
    const cur = input({ type: 'password', autocomplete: 'current-password' });
    const next = input({ type: 'password', autocomplete: 'new-password', placeholder: 'At least 8 characters' });
    const name = input({ value: isUser ? s.user.name || '' : '' });
    const theme = localStorage.getItem('wp_theme') || 'light';
    return h('div', { style: { maxWidth: '640px' } },
      h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'My account'), h('div', { class: 'sub' }, isUser ? s.user.email : `${s.member.name || s.member.username} · signed in with the wedding code`))),
      isUser ? h('div', { class: 'card form mb' }, field('Your name', name), h('div', null, h('button', { class: 'btn primary', onclick: async () => { await api.post('/api/auth/profile', { name: name.value }); s.user.name = name.value; toast('Saved'); } }, 'Save'))) : null,
      h('div', { class: 'card form mb' }, h('div', { class: 'card-title' }, 'Appearance'),
        seg([{ value: 'light', label: 'Light', icon: 'sun' }, { value: 'dark', label: 'Dark', icon: 'moon' }, { value: 'auto', label: 'Match device' }], theme, (v) => { localStorage.setItem('wp_theme', v); applyTheme(); import('../lib/store.js').then((m) => m.emit()); })),
      h('div', { class: 'card form mb' }, h('div', { class: 'card-title' }, 'Change password'), field('Current password', cur), field('New password', next),
        h('div', null, h('button', { class: 'btn primary', onclick: async () => {
          try { await api.post('/api/auth/password', { current: cur.value, next: next.value }); cur.value = ''; next.value = ''; toast('Password changed'); } catch (e) { toast(e.message, { error: true }); }
        } }, 'Change password'))),
      h('button', { class: 'btn danger', onclick: signOut }, icon('logout'), 'Sign out'));
  },
};
