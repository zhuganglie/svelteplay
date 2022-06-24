<script context="module">
	export async function load({ params, fetch, session, context }) {
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
		const response = await fetch('/api/signup', {
			method: 'POST',
			body: new FormData(e.target),
		});
		if (response.ok)  window.location = '/' ;
		else alert(await response.text());
	}
	async function signIn(e) {
		const response = await fetch('/api/signin', {
			method: 'POST',
			body: new FormData(e.target),
		});
		if (response.ok) window.location = '/about';
		else alert(await response.text());
	}

	let currentTab = "Signin";
	const changeTab = (tab) => {
		currentTab = tab;
	};
</script>

<h1 class="text-3xl">欢迎你！</h1>
<hr />
<p>这里埋藏着一些关于我的秘密，请注册登录后浏览。</p>
<div class="h-96 w-full lg:w-4/5 xl:w-3/5 mx-auto px-4 grid self-center justify-self-center content-center text-center ">
	<div class="mb-6 flex justify-center place-items-center space-x-2">
		<div class=" {currentTab == 'Signin' ? 'tab-active': ''}" on:click={() => changeTab("Signin")}>
			<span class="px-2 py-0.5">登录</span>
		</div>
		<div class=" {currentTab == 'Signup' ? 'tab-active': ''}" on:click={() => changeTab("Signup")}>
			<span class="px-2 py-0.5">注册</span>
		</div>
	</div>
	<br />
    <div class="border border-zinc-700 p-8">
	{#if currentTab === "Signin"}
	<form on:submit|preventDefault={signIn} class="">
		<input id="email" name="email" type="email" placeholder="电邮" onfocus="this.value=''" class="bg-zinc-700 text-zinc-300 w-full" /><br /> <br />
		<input id="password" name="password" type="password" placeholder="密码" onfocus="this.value=''" class="bg-zinc-700 text-zinc-300 w-full" /><br /><br />
		<button class="bg-zinc-700 text-zinc-100 px-2 py-0.5">登录</button>
	</form>

{:else}
<form on:submit|preventDefault={signUp} class="">
	<input id="email" name="email" type="email" placeholder="电邮" onfocus="this.value=''" class="bg-zinc-700 text-zinc-300 w-full" /><br /><br />
	<input id="password" name="password" type="password" placeholder="密码" onfocus="this.value=''" class="bg-zinc-700 text-zinc-300 w-full" /><br /><br />
	<button class="bg-zinc-700 text-zinc-100 px-2 py-0.5">注册</button>
</form>
{/if}
</div>
</div>

<style>
	.tab-active {
		border-bottom: 2px solid rgb(212 212 216);
		font-weight: 700;
	}
	
</style>