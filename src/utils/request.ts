export type RequestOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
};

function mergeHeaders(defaults: HeadersInit = {}, custom: HeadersInit = {}) {
  const out = new Headers(defaults as any);
  const addAll = (h: HeadersInit) => {
    if (!h) return;
    if (h instanceof Headers) {
      h.forEach((v, k) => out.set(k, v));
    } else if (Array.isArray(h)) {
      for (const [k, v] of h) out.set(k, v as string);
    } else {
      for (const k of Object.keys(h)) out.set(k, (h as Record<string,string>)[k]);
    }
  };
  addAll(custom); // пользовательские имеют приоритет
  return out;
}

export async function request(url: string, opts: RequestOptions = {}) {
  const defaults: RequestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  const method = (opts.method || defaults.method)!;
  const headers = mergeHeaders(defaults.headers!, opts.headers || {});
  const body = opts.body ?? null;

  const res = await fetch(url, { method, headers, body });
  return res;
}

