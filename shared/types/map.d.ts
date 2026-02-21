/**
 * Map component reference interface
 */
export type MapRef = {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  closePopups: () => void;
  setUserLocation: (lat: number, lng: number) => void;
};
