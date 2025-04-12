export function normalizeSongName(name: string) {
  if (name === 'D✪N’T  ST✪P  R✪CKIN’') {
    return 'D✪N’T ST✪P R✪CKIN’';
  }
  return name.replace(/" \+ '/g, '').replace(/' \+ "/g, '');
}
