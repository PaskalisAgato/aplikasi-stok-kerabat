async function test() {
    try {
        const response = await fetch('http://localhost:5000/api/inventory/1/movement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'IN',
                quantity: 10,
                reason: 'Test Restock'
            })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}
test();
