export interface GeoLocation {
    latitude: number;
    longitude: number;
    address: string;
}

export const getGeoLocation = (): Promise<GeoLocation> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error('Geolocation tidak didukung oleh browser Anda.'));
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse Geocoding using OpenStreetMap Nominatim (Free, no key)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
                        headers: {
                            'Accept-Language': 'id-ID'
                        }
                    });
                    const data = await res.json();
                    
                    // Construct a short address
                    const address = data.display_name || 'Lokasi tidak diketahui';
                    
                    resolve({ latitude, longitude, address });
                } catch (err) {
                    console.error('Reverse Geocoding Error:', err);
                    resolve({ latitude, longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
                }
            },
            (err) => {
                console.error('Geolocation Error:', err);
                reject(new Error('Gagal mengambil lokasi. Pastikan izin lokasi diberikan.'));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
};
