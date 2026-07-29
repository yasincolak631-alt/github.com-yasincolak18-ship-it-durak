// Web'deki (globals.css) tasarım kimliğinin React Native karşılığı.
// Kartpostal/bilet temasına eşlik eden renk ve tipografi tokenleri.

export const colors = {
  ink: '#12181F',
  paper: '#EFEEE7',
  paperRaised: '#F8F7F2',
  cini: '#1D4E64',
  ciniDeep: '#0F2E3B',
  brass: '#A9824C',
  brassBright: '#C9A26A',
  fig: '#3F6B52',
  stamp: '#9C3B3B',
  line: 'rgba(18, 24, 31, 0.14)',
  lineStrong: 'rgba(18, 24, 31, 0.28)',
};

export const fonts = {
  display: 'Spectral_600SemiBold',
  displayItalic: 'Spectral_600SemiBold_Italic',
  body: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
};

export const statusColors: Record<string, string> = {
  PENDING: colors.brass,
  CONFIRMED: colors.fig,
  CANCELLED: colors.stamp,
  COMPLETED: colors.ink,
};

export const statusLabels: Record<string, string> = {
  PENDING: 'Onay bekliyor',
  CONFIRMED: 'Onaylandı',
  CANCELLED: 'İptal edildi',
  COMPLETED: 'Tamamlandı',
};
