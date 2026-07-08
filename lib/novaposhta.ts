// Серверний хелпер для Nova Poshta API. Ключ береться з NOVAPOSHTA_API_KEY і
// назовні не потрапляє — фронт ходить лише через наші /api/np/*.

const NP_ENDPOINT = 'https://api.novaposhta.ua/v2.0/json/';

export function npConfigured(): boolean {
  return !!process.env.NOVAPOSHTA_API_KEY;
}

async function npCall(
  modelName: string,
  calledMethod: string,
  methodProperties: Record<string, string>,
): Promise<any[]> {
  const apiKey = process.env.NOVAPOSHTA_API_KEY;
  if (!apiKey) return [];
  const res = await fetch(NP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Nova Poshta ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export interface NpCity {
  ref: string;
  name: string;
  area: string;
}
export interface NpWarehouse {
  ref: string;
  name: string;
  number: string;
}

export async function searchCities(query: string): Promise<NpCity[]> {
  if (!query || query.length < 2) return [];
  const rows = await npCall('Address', 'getCities', { FindByString: query, Limit: '20' });
  return rows.map((c) => ({ ref: c.Ref, name: c.Description, area: c.AreaDescription || '' }));
}

export async function getWarehouses(cityRef: string): Promise<NpWarehouse[]> {
  if (!cityRef) return [];
  const rows = await npCall('Address', 'getWarehouses', { CityRef: cityRef, Limit: '1000' });
  return rows.map((w) => ({ ref: w.Ref, name: w.Description, number: w.Number || '' }));
}
