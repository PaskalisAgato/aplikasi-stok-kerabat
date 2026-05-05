import axios from 'axios';

async function verifyLiveDiscounts() {
    try {
        console.log("Logging into production...");
        const login = await axios.post('https://api.kerabatkopitiam.my.id/api/auth/login-pin', {
            pin: '1122', // Master Admin PIN
            role: 'Admin'
        });

        const cookies = login.headers['set-cookie'];
        const token = login.data.session.id;
        console.log("Got token and cookies! Token:", token.substring(0, 8));

        const res = await axios.get('https://api.kerabatkopitiam.my.id/api/discounts?active=true', {
            headers: { 
                 Authorization: `Bearer ${token}`,
                 Cookie: cookies ? cookies.join('; ') : ''
            }
        });

        const discounts = res.data.data;
        const bundles = discounts.filter((d: any) => d.type === 'bundling');
        console.log("LIVE BUNDLING PROMOS:");
        console.log(JSON.stringify(bundles, null, 2));

        // Evaluate one explicitly
        console.log("\nTesting Evaluation via API...");
        // "promo bundling" target product IDs
        const cartItems = [
            { recipeId: 2, quantity: 1, price: 14000 },
            { recipeId: 8, quantity: 1, price: 16000 },
            { recipeId: 23, quantity: 1, price: 11000 },
            { recipeId: 7, quantity: 1, price: 14000 }
        ];

        const evalRes = await axios.post('https://api.kerabatkopitiam.my.id/api/discounts/evaluate', {
            items: cartItems
        }, {
            headers: { 
                 Authorization: `Bearer ${token}`,
                 Cookie: cookies ? cookies.join('; ') : ''
            }
        });

        console.log("EVALUATION RESULT:");
        console.log(JSON.stringify(evalRes.data, null, 2));

    } catch (e: any) {
        console.error("Failed:", e.response?.data || e.message);
    }
}

verifyLiveDiscounts();
