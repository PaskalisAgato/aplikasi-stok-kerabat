export interface GeoLocation {
    latitude: number;
    longitude: number;
    address: string;
}
export declare const getGeoLocation: () => Promise<GeoLocation>;
