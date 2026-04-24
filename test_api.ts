import { apiClient } from './apps/shared/apiClient.ts';
import fs from 'fs';

// Simulating browser env for apiClient
(globalThis as any).process = { env: { VITE_API_URL: "https://api.kerabatkopitiam.my.id/api" } };

async function fetchAPI() {
    try {
        const response: any = await apiClient.getExpenses(40, 0, "2026-04-18T00:00", "2026-04-20T23:59");
        if (response.data) {
           console.log("Found expenses via API:", response.data.length);
           response.data.filter((e: any) => e.title.includes('Touge') || e.title.includes('Es batu') || e.title.includes('Bayar server') || e.title.includes('Lengkuas') || e.title.includes('Daun jeruk'))
              .forEach((e: any) => console.log(e.id, e.title, e.expenseDate));
        } else {
           console.log(response);
        }
    } catch(e) { console.error(e) }
}
fetchAPI();
