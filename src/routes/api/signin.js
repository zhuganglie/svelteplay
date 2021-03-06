import supabase from '$lib/db';

export async function post({request}) {
	
	const body = await request.formData()
	const email = body.GET('email')
	const password = body.GET('password')
	const { session, error } = await supabase.auth.signIn({ email, password });
	
	if (error) {
		return {
			status: error.status,
			body:  error.message ,
		};
	}

	return {
		status: 200,
		body: 'success' ,
		headers: {
			'set-cookie': `session=${
				session.user.email
			}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${new Date(
				session.expires_at * 1000
			).toUTCString()};`
		}
	};
}

