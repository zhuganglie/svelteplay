import cookie from 'cookie';

/** @type {import('@sveltejs/kit').GetSession} */
export function getSession(event) {
	return cookie.parse(event.request.headers.get('cookie') || '').session || null;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({event,resolve}) {
	const response = await resolve(event, {
		ssr: !event.url.pathname.startsWith('/talks')
	});
	return response;
}