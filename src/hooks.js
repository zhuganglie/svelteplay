import cookie from 'cookie';

/** @type {import('@sveltejs/kit').GetSession} */
export function getSession(request) {
	return cookie.parse(request.headers.cookie || '').session || null;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({request,resolve}) {
	const response = await resolve(request, {
		ssr: !request.url.pathname.startsWith('/blog')
	});
	return response;
}