import { jsonRequestWithTlsFallback } from './secondmeHttp';

type QueryValue = string | number | boolean;

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  return { url, serviceKey };
}

function buildUrl(
  table: string,
  query?: Record<string, string | number | boolean | null | undefined>,
) {
  const { url } = getConfig();
  const nextUrl = new URL(`/rest/v1/${table}`, url);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        nextUrl.searchParams.set(key, String(value));
      }
    });
  }

  return nextUrl.toString();
}

async function request<T>(
  method: string,
  table: string,
  options?: {
    query?: Record<string, string | number | boolean | null | undefined>;
    body?: unknown;
    prefer?: string;
  },
) {
  const { serviceKey } = getConfig();

  const response = await jsonRequestWithTlsFallback<T>({
    url: buildUrl(table, options?.query),
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(options?.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  const data = response.data;

  if (!response.ok) {
    const detail =
      (data as
        | {
            message?: string;
            error_description?: string;
            hint?: string;
          }
        | null
        | undefined)?.message ||
      (data as
        | {
            message?: string;
            error_description?: string;
            hint?: string;
          }
        | null
        | undefined)?.error_description ||
      (data as
        | {
            message?: string;
            error_description?: string;
            hint?: string;
          }
        | null
        | undefined)?.hint ||
      response.bodyText ||
      `HTTP ${response.status}`;
    throw new Error(detail);
  }

  return (data ?? null) as T;
}

export async function selectMany<T>(
  table: string,
  query?: Record<string, string | number | boolean | null | undefined>,
) {
  return request<T[]>('GET', table, { query });
}

export async function selectOne<T>(
  table: string,
  query?: Record<string, string | number | boolean | null | undefined>,
) {
  const rows = await request<T[]>('GET', table, { query });
  return rows[0] ?? null;
}

export async function insertRows<T>(table: string, rows: object | object[]) {
  return request<T[]>('POST', table, {
    body: rows,
    prefer: 'return=representation',
  });
}

export async function updateRows<T>(
  table: string,
  query: Record<string, string | number | boolean | null | undefined>,
  patch: object,
) {
  return request<T[]>('PATCH', table, {
    query,
    body: patch,
    prefer: 'return=representation',
  });
}

export function eq(column: string, value: QueryValue) {
  return { [column]: `eq.${value}` };
}

export function inList(column: string, values: QueryValue[]) {
  const encodedValues = values.map((value) =>
    typeof value === 'string' ? `"${value.replace(/"/g, '\\"')}"` : String(value),
  );

  return { [column]: `in.(${encodedValues.join(',')})` };
}

export function order(column: string, ascending = true) {
  return `${column}.${ascending ? 'asc' : 'desc'}`;
}
