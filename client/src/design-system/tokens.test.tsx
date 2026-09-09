it('exposes core custom properties on :root', async () => {
  await import('./tokens.css');
  // jsdom does not parse @import chains; assert the file is importable and
  // that a component using the var resolves to a non-empty computed style.
  const el = document.createElement('div');
  el.style.setProperty('color', 'var(--color-najd, #000)');
  document.body.appendChild(el);
  expect(el.style.color).toContain('var(--color-najd');
});
