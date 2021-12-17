<script context="module">
	export async function load({ page, fetch, session, context }) {
		if (session) {
			return {
				status: 302,
				redirect: '/'
			};
		}
		return {};
	}
</script>

<script>
	async function signUp(e) {
		const response = await fetch('/signup', {
			method: 'post',
			body: new FormData(e.target)
		});
		if (response.ok) window.location = '/';
		else alert(await response.text());
	}
	async function signIn(e) {
		const response = await fetch('/signin', {
			method: 'post',
			body: new FormData(e.target)
		});
		if (response.ok) window.location = '/';
		else alert(await response.text());
	}
</script>

<h1>Welcome to my app!</h1>
<h2>Sign up!</h2>
<form on:submit|preventDefault={signUp}>
	<label for="email">Email</label>
	<input id="email" name="email" type="email" /><br />
	<label for="password">Password</label>
	<input id="password" name="password" type="password" /><br />
	<button>Sign Up</button>
</form>
<h2>..or Log in!</h2>
<form on:submit|preventDefault={signIn}>
	<label for="email">Email</label>
	<input id="email" name="email" type="email" /><br />
	<label for="password">Password</label>
	<input id="password" name="password" type="password" /><br />
	<button>Login</button>
</form>