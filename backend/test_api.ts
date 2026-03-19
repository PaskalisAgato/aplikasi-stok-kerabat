async function testLiveApi() {
    console.log("Testing connection to https://aplikasi-stok-kerabat.onrender.com/api/auth/login-pin");
    try {
        const response = await fetch("https://aplikasi-stok-kerabat.onrender.com/api/auth/login-pin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                role: "Admin",
                pin: "wrongpin" // We just want to see if the server responds, not necessarily succeed
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log("Headers:");
        response.headers.forEach((value, key) => console.log(`  ${key}: ${value}`));

        const text = await response.text();
        console.log(`\nResponse Body:\n${text}`);
    } catch (error) {
        console.error("Network Request Failed:", error);
    }
}

testLiveApi();
