import { Client } from 'pg';

const connectionString = 'postgresql://postgres.lvfqfynqzgxjbkotlccp:epizetkano356@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const client = new Client({ connectionString });

async function main() {
  await client.connect();
  
  const rawInput = `253	Gula Pasir 1kg	Iwan Mart	Bahan Bar	22000	24/4/2026, 00.00.00
251	Es Batu	Higen	Bahan Bar	36000	23/4/2026, 00.00.00
250	Kopi robusta	Sense roastery	Bahan Bar	290000	21/4/2026, 00.00.00
252	Telur	Gudang Telur	Bahan Dapur	54000	21/4/2026, 00.00.00
247	Masako	Pasar	Bahan Dapur	1000	21/4/2026, 00.00.00
248	Cabe kering	Pasar	Bahan Dapur	12000	21/4/2026, 00.00.00
246	Beras	Toko beras	Bahan Dapur	170000	21/4/2026, 00.00.00
241	Bayar domain	Domainesia	Lainnya	12995	21/4/2026, 00.00.00
242	Bayar domain	Domainesia	Lainnya	12995	20/4/2026, 00.00.00
243	Galon	Iwan mart	Bahan Bar	12000	20/4/2026, 00.00.00
245	Touge	Pasar	Bahan Bar	10000	19/4/2026, 00.00.00
239	Es batu	Higen	Bahan Bar	36000	19/4/2026, 00.00.00
240	Bayar server	Herza cloud	Lainnya	56427	19/4/2026, 00.00.00
244	Lengkuas	Pasar	Bahan Bar	5000	19/4/2026, 00.00.00
249	Daun jeruk	Pasar	Bahan Dapur	5000	19/4/2026, 00.00.00
234	Luch box 	Gio ampera	Bahan Bar	44000	18/4/2026, 00.00.00
238	Kopi robusta lampung	Senses roastery	Bahan Bar	290000	18/4/2026, 00.00.00
237	Sedotan dingin 	Gio ampera	Bahan Bar	26000	18/4/2026, 00.00.00
236	Sedotan panas	Gio ampera	Bahan Bar	13500	18/4/2026, 00.00.00
235	Uht Frisian flag	Gio ampera	Bahan Bar	102500	18/4/2026, 00.00.00
233	Container 70 L	Gio ampera	Peralatan	135000	18/4/2026, 00.00.00
232	Gula stik	Gio ampera	Bahan Bar	33000	18/4/2026, 00.00.00
231	Skrup + kuas + lakban	Tb mitra jasa	Peralatan	31000	18/4/2026, 00.00.00
226	Ubi 2kg	Toko sayur	Bahan Dapur	12000	16/4/2026, 00.00.00
227	Sedai	Toko Syur	Bahan Dapur	5000	16/4/2026, 00.00.00
228	Serai	Toko sayur 	Bahan Dapur	5000	16/4/2026, 00.00.00
230	Gas	Bright	Bahan Dapur	208000	16/4/2026, 00.00.00
229	Freshmilk 2 kotak	Sentral Makmur	Bahan Bar	44000	16/4/2026, 00.00.00
225	Es Batu 3 kantong	Higen Purer Ice	Bahan Bar	36000	14/4/2026, 00.00.00
215	Vixal	Harmonis	Lainnya	13800	14/4/2026, 00.00.00
214	SKM 10pcs	Harmonis	Bahan Bar	135000	14/4/2026, 00.00.00
213	Tisu Dapur	Harmonis	Bahan Dapur	28800	14/4/2026, 00.00.00
212	SMK 2 pcs	Iwan Mart	Bahan Bar	30000	14/4/2026, 00.00.00
223	Standing Pouch Bening (10x17)	Pesona Pack Pontianak	Bahan Bar	16500	14/4/2026, 00.00.00
224	Paper Leak Proof	Pesona Pack Pontianak 	Bahan Bar	40000	14/4/2026, 00.00.00
216	Margarin 250gr (1)	Harmonis 	Bahan Bar	10800	14/4/2026, 00.00.00
218	Masako Ayam 250gr (2)	Harmonis	Bahan Dapur	18400	14/4/2026, 00.00.00
217	Margarin 200gr (4)	Harmonis	Bahan Bar	24800	14/4/2026, 00.00.00
221	Kopi 40k (200gr)	Roasterium	Bahan Bar	9000	14/4/2026, 00.00.00
220	Kopi standard 300gr	Roasterium	Bahan Bar	19500	14/4/2026, 00.00.00
219	Kantong uk 20	Harmonis	Bahan Bar	10500	14/4/2026, 00.00.00
222	Standing Pouch Bening (16x24)	Pesona Pack Pontianak	Bahan Bar	42900	14/4/2026, 00.00.00
210	Sawi	Flamboyan	Bahan Dapur	7000	12/4/2026, 00.00.00
211	Kaki meja	Facebook	Peralatan	375000	12/4/2026, 00.00.00
208	SKM	Iwan mart	Bahan Bar	30000	11/4/2026, 00.00.00
197	Bawang merah	Flamboyan	Bahan Dapur	10000	10/4/2026, 00.00.00
209	Listrik	PLN	Lainnya	501400	10/4/2026, 00.00.00
207	Es batu	Higen	Bahan Bar	36000	10/4/2026, 00.00.00
206	Air galon	Iwan mart	Bahan Bar	12000	10/4/2026, 00.00.00
205	Serai	Flamboyan	Bahan Dapur	5000	10/4/2026, 00.00.00
204	Jahe	Flamboyan	Bahan Bar	5000	10/4/2026, 00.00.00
203	Teri medan	Flamboyan	Bahan Dapur	45000	10/4/2026, 00.00.00
202	Kwetiau	Flamboyan	Bahan Dapur	12000	10/4/2026, 00.00.00
201	Jinten	Flamboyan	Bahan Dapur	5000	10/4/2026, 00.00.00
200	Cabe rawit	Flamboyan	Bahan Dapur	40000	10/4/2026, 00.00.00
199	Cumi	Flamboyan	Bahan Bar	80000	10/4/2026, 00.00.00
198	Daun bawang	Flamboyan	Bahan Bar	5000	10/4/2026, 00.00.00
187	Teh 5bks	Kaisar	Bahan Bar	131000	9/4/2026, 00.00.00
195	Creamer	Borneo Beverages supply	Bahan Bar	60000	9/4/2026, 00.00.00
196	Senar Gitar	Toko Gitar	Lainnya	80000	9/4/2026, 00.00.00
193	Creamer	Senses Coffee Roasters	Bahan Bar	60000	9/4/2026, 00.00.00
194	Sirup Leci	Borneo Beveragea supply	Bahan Bar	50000	9/4/2026, 00.00.00
192	Kopi Robusta Lampung 2bks	Senses Coffee Roasters	Bahan Bar	290000	9/4/2026, 00.00.00
191	Tisu Bar	Harmonis 	Bahan Bar	31800	9/4/2026, 00.00.00
190	Bumbu Kari 4bks	Harmonis	Bahan Dapur	10000	9/4/2026, 00.00.00
189	Oreo 2bks	Gio Ampera	Bahan Bar	19000	9/4/2026, 00.00.00
188	Saringan Kopi Kecil 2pcs	Gio Ampera	Bahan Bar	22000	9/4/2026, 00.00.00
182	Garam 2 pcs	Harmonis	Bahan Dapur	8400	7/4/2026, 00.00.00
186	Mineral 2 dus	Harmonis	Bahan Bar	83800	7/4/2026, 00.00.00
185	Minyak Goreng 2 liter (2)	Harmonis	Bahan Dapur	88400	7/4/2026, 00.00.00
184	Kentang	Harmonis 	Bahan Dapur	38500	7/4/2026, 00.00.00
183	Totole 3pcs	Harmonis	Bahan Dapur	32700	7/4/2026, 00.00.00
181	Tepung serbaguna 3pcs	Harmonis	Bahan Dapur	18600	7/4/2026, 00.00.00
180	Tepung Maizena 	Harmonis	Bahan Dapur	5400	7/4/2026, 00.00.00
179	Ladaku 100gr	Harmonis	Bahan Dapur	36500	7/4/2026, 00.00.00
178	Kantong Pex Bawang uk15 2pack	Haromonis	Bahan Bar	21000	7/4/2026, 00.00.00
177	Freshmilk 4kotak	Harmonis	Bahan Bar	82000	7/4/2026, 00.00.00
176	Superpell	Alfamart	Lainnya	8900	7/4/2026, 00.00.00
175	Makanan Karyawan 	Toko sayur 	Bahan Dapur	53000	7/4/2026, 00.00.00
174	Air galon	Iwan mart	Bahan Bar	12000	6/4/2026, 00.00.00
173	PRINT SOP	Toko Fotokopi	Lainnya	22000	6/4/2026, 00.00.00
172	Batu Es 3 Kantong	Higen purer Ice	Bahan Bar	36000	6/4/2026, 00.00.00
171	Bayar Maxim	Maxim	Lainnya	10000	5/4/2026, 00.00.00
166	Timun	Flamboyan	Bahan Dapur	10000	3/4/2026, 00.00.00
168	Paku payung + baut pengait	Toko bangunan	Peralatan	6000	3/4/2026, 00.00.00
167	Sawi 	Flamboyan	Bahan Dapur	5000	3/4/2026, 00.00.00
170	full cream	cintah ria	Bahan Bar	67500	3/4/2026, 00.00.00
159	Es Batu	Higen purer ice	Bahan Bar	36000	2/4/2026, 00.00.00
161	Keju Mychiz 2 pack	Flamboyant supply	Bahan Bar	23000	2/4/2026, 00.00.00
169	Pisang	Flamboyan	Bahan Bar	20000	2/4/2026, 00.00.00
165	bubuk kopi	senses	Bahan Bar	290000	2/4/2026, 00.00.00
164	Mix Vegetable 1kg	Flamboyan Frozen	Bahan Dapur	30500	2/4/2026, 00.00.00
163	Minyak Wijen	Flamboyant supply	Bahan Dapur	63000	2/4/2026, 00.00.00
162	Lunch Box uk S	Flamboyant supply	Lainnya	34000	2/4/2026, 00.00.00
160	SKM Vamoola 2kg	Flamboyant supply	Bahan Bar	47000	2/4/2026, 00.00.00
158	Batrai alkaline isi 2	Iwanmart	Peralatan	21000	1/4/2026, 00.00.00
156	Batrai alkaline 	Iwan mart	Peralatan	22500	1/4/2026, 00.00.00
155	air galon	iwan mart	Bahan Bar	12000	1/4/2026, 00.00.00
157	Galon	Iwanmart	Bahan Bar	12000	1/4/2026, 00.00.00`;

  const parsed = rawInput.split('\\n').map(line => {
      const parts = line.split('\\t');
      return { id: parseInt(parts[0]), title: parts[1], amount: parts[4] };
  });

  const ids = parsed.map(p => p.id);

  const res = await client.query('select id, title, amount, is_deleted from expenses where id = ANY($1::int[])', [ids]);
  
  const mismatches = [];
  res.rows.forEach(dbRow => {
      const userRow = parsed.find(p => p.id === dbRow.id);
      if (userRow) {
          if (userRow.title !== dbRow.title || parseFloat(userRow.amount) !== parseFloat(dbRow.amount)) {
              mismatches.push({ id: dbRow.id, userTitle: userRow.title, dbTitle: dbRow.title, userAmount: userRow.amount, dbAmount: dbRow.amount, deleted: dbRow.is_deleted });
          }
      }
  });

  console.log('Mismatches found:', mismatches.length);
  if (mismatches.length > 0) {
      console.table(mismatches.slice(0, 15));
  }
  
  await client.end();
}

main().catch(console.error);
