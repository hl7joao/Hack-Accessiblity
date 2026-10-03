import type { Line, LineId } from '../types';

export const LINES: Record<LineId, Line> = {
  Red: { id: 'Red', name: 'Red Line', color: '#c60c30', textColor: '#fff' },
  Blue: { id: 'Blue', name: 'Blue Line', color: '#00a1de', textColor: '#000' },
  Brn: { id: 'Brn', name: 'Brown Line', color: '#62361b', textColor: '#fff' },
  G: { id: 'G', name: 'Green Line', color: '#009b3a', textColor: '#fff' },
  Org: { id: 'Org', name: 'Orange Line', color: '#f9461c', textColor: '#000' },
  P: { id: 'P', name: 'Purple Line', color: '#522398', textColor: '#fff' },
  Pink: { id: 'Pink', name: 'Pink Line', color: '#e27ea6', textColor: '#000' },
  Y: { id: 'Y', name: 'Yellow Line', color: '#f9e300', textColor: '#000' },
};
