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

<div class="h-96 w-full md:w-2/5 mx-auto px-4 grid self-center justify-self-center content-center text-center ">
	<div class="flex justify-center place-items-center space-x-2">
		<div class=" {currentTab == 'Signin' ? 'tab-active': ''}" on:click={() => changeTab("Signin")}>
			<span class="px-2 py-0.5">登录</span>
		</div>
		<div class=" {currentTab == 'Signup' ? 'tab-active': ''}" on:click={() => changeTab("Signup")}>
			<span class="px-2 py-0.5">注册</span>
		</div>
	</div>
	<br />
    <div>
	{#if currentTab === "Signin"}
	<form on:submit|preventDefault={signIn} class="">
		<input id="email" name="email" type="email" placeholder="电邮" onfocus="this.value=''" class="bg-gray-700 text-gray-300 w-full" /><br /> <br />
		<input id="password" name="password" type="password" placeholder="密码" onfocus="this.value=''" class="bg-gray-700 text-gray-300 w-full" /><br /><br />
		<button class="bg-gray-700 text-gray-100 px-2 py-0.5">登录</button>
	</form>

{:else}
<form on:submit|preventDefault={signUp} class="">
	<input id="email" name="email" type="email" placeholder="电邮" onfocus="this.value=''" class="bg-gray-700 text-gray-300 w-full" /><br /><br />
	<input id="password" name="password" type="password" placeholder="密码" onfocus="this.value=''" class="bg-gray-700 text-gray-300 w-full" /><br /><br />
	<button class="bg-gray-700 text-gray-100 px-2 py-0.5">注册</button>
</form>
{/if}
</div>
</div>

<style>
	.tab-active {
		border-bottom: 2px solid white;
	}
	
</style>