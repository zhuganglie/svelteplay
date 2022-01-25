import supabase from '$lib/db';

/*export async function post(request) {
	let email = request.body.get('email');
	let password = request.body.get('password');

	const { session, error } = await supabase.auth.signUp({ email, password });

	if (error) {
		return {
			status: error.status,
			body: error.message
		};
	}

	return {
		status: 200,
		body: 'success',
		headers: {
			'set-cookie': `session=${
				session.user.email
			}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${new Date(
				session.expires_at * 1000
			).toUTCString()};`
		}
	};
}*/

export async function post({request}) {
	const body = await request.formData()
	const email = await body.get('email')
	const password = await body.get('password')
	const { session, error } = await supabase.auth.signUp({ email, password });

	if (error) {
		return {
			status: error.status,
			body:  error.message ,
		};
	}

	return {
		status: 200,
		body:  'success' ,
		headers: new Headers({
			'set-cookie': `session=${
				session.user.email
			}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${new Date(
				session.expires_at * 1000
			).toUTCString()};`
		})
	};
}

