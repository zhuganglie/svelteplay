import getPosts from './lib/getPost';

/** @type {import('@sveltejs/kit').GetSession} */
export const getSession = async () => {
	return {
		posts: await getPosts()
	};
};