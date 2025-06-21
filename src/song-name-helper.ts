export function normalizeSongName(name: string) {
  if (name === 'D✪N’T  ST✪P  R✪CKIN’') {
    return 'D✪N’T ST✪P R✪CKIN’';
  }
  return name.replace(/" \+ '/g, '').replace(/' \+ "/g, '');
}

export function getSongNickname(normalizedSongName: string, category: string) {
  if (normalizedSongName === 'Link') {
    return category.includes('iconico') ? 'Link (nico)' : 'Link (org)';
  }
  return normalizedSongName;
}
