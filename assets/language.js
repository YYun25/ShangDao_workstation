/* Shared language switching for static and dynamically generated course content. */
(() => {
  'use strict';
  const key = 'shangdao.language';
  const dictionary = window.SHANGDAO_TRANSLATIONS || {};
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(Object.keys(dictionary).sort((a, b) => b.length - a.length).map(escape).join('|'), 'g');
  const translate = value => value.replace(pattern, match => dictionary[match]);
  const records = new WeakMap();
  const attributes = ['title', 'alt', 'placeholder', 'aria-label'];
  let language = 'zh';
  try { language = localStorage.getItem(key) === 'en' ? 'en' : 'zh'; } catch (_) {}
  const toolbar = document.createElement('div');
  toolbar.className = 'language-switch';
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Language / 語言');
  toolbar.innerHTML = '<button type="button" data-language="zh" lang="zh-Hant">中文</button><button type="button" data-language="en" lang="en">English</button>';
  const anchor = document.querySelector('.brand') || document.querySelector('header') || document.body;
  if (anchor === document.body) {
    const wrapper = document.createElement('div');
    wrapper.className = 'language-bar';
    wrapper.append(toolbar);
    document.body.prepend(wrapper);
  } else { anchor.append(toolbar); }

  function updateValue(node, field, current, setter) {
    let fields = records.get(node);
    if (!fields) { fields = {}; records.set(node, fields); }
    let record = fields[field];
    if (!record || current !== record.last) record = { original: current, last: current };
    const next = language === 'en' ? translate(record.original) : record.original;
    if (next !== current) setter(next);
    record.last = next;
    fields[field] = record;
  }
  function apply() {
    observer.disconnect();
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement && !node.parentElement.closest('script, style, .language-switch, noscript')
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    while (walker.nextNode()) {
      const node = walker.currentNode;
      updateValue(node, 'text', node.nodeValue, value => { node.nodeValue = value; });
    }
    document.querySelectorAll('[title], [alt], [placeholder], [aria-label]').forEach(node => {
      if (node.closest('.language-switch')) return;
      attributes.forEach(name => {
        if (node.hasAttribute(name)) updateValue(node, name, node.getAttribute(name), value => node.setAttribute(name, value));
      });
    });
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-Hant';
    document.documentElement.dataset.language = language;
    toolbar.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    observer.observe(document.documentElement, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes});
  }
  const observer = new MutationObserver(apply);
  window.addEventListener('pagehide', () => observer.disconnect());
  window.addEventListener('pageshow', apply);
  toolbar.addEventListener('click', event => {
    const button = event.target.closest('[data-language]');
    if (!button) return;
    language = button.dataset.language;
    try { localStorage.setItem(key, language); } catch (_) {}
    apply();
  });
  window.addEventListener('storage', event => {
    if (event.key === key) { language = event.newValue === 'en' ? 'en' : 'zh'; apply(); }
  });
  const originalAlert = window.alert.bind(window);
  window.alert = message => originalAlert(language === 'en' ? translate(String(message)) : message);
  window.shangdaoLanguage = {translate, refresh: apply, get language() { return language; }};
  apply();
})();
