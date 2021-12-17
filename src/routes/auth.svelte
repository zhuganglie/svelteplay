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
		if (response.ok) window.location = '/about';
		else alert(await response.text());
	}

	let currentTab = "Signin";

	const changeTab = (tab) => {
		currentTab = tab;
	};
</script>

<h2>欢迎你！</h2>
<hr />

<div class="h-full w-full px-4 mx-auto grid content-evenly self-center justify-self-center text-center">
<<<<<<< HEAD

	<div class="flex">
		<div class="col tab-heading {currentTab == 'Signin' ? 'tab-active': ''}" on:click={() => changeTab("Signin")}>
			<span>登录</span>
		</div>
		<div class="col tab-heading {currentTab == 'Signup' ? 'tab-active': ''}" on:click={() => changeTab("Signup")}>
			<span>注册</span>
		</div>
	</div>

	{#if currentTab === "Signup"}
=======
>>>>>>> 0e591a7994d59bb14ebc864af55d7a9525cbcfe5
<form on:submit|preventDefault={signUp} class="">
	<label for="email">电邮</label> &nbsp;
	<input id="email" name="email" type="email" onfocus="this.value=''" class="bg-gray-700 text-gray-300" /><br /><br />
	<label for="password">密码</label> &nbsp;
	<input id="password" name="password" type="password" onfocus="this.value=''" class="bg-gray-700 text-gray-300" /><br /><br />
	<button class="bg-gray-700 text-gray-100 px-2 py-0.5">注册</button>
</form>
{:else}
<form on:submit|preventDefault={signIn} class="">
	<label for="email">电邮</label> &nbsp;
	<input id="email" name="email" type="email" class="bg-gray-700 text-gray-300" /><br /> <br />
	<label for="password">密码</label> &nbsp;
	<input id="password" name="password" type="password" class="bg-gray-700 text-gray-300" /><br /><br />
	<button class="bg-gray-700 text-gray-100 px-2 py-0.5">登入</button>
</form>
{/if}
</div>