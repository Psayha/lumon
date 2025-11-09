export async function logFetchResponse(res: Response) {
  try {
    const safe = res.clone();
    const ct = safe.headers.get('content-type') || '';
    let body: unknown = '[no body]';
    if (ct.includes('application/json')) {
      body = await safe.json();
    } else {
      const text = await safe.text();
      body = text.length ? text : '[empty]';
    }
    console.info('[FETCH]', {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      body
    });
  } catch (e) {
    console.warn('[FETCH] response log error:', String(e));
  }
}

