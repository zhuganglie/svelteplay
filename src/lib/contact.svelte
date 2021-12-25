<!---<form
  action="https://formspree.io/f/xbjqdgdd"
  method="POST"
  class="flex flex-col space-y-4"
>
<input type="email" name="_replyto" placeholder="电邮" required class="bg-zinc-700 text-zinc-300">
<input type="text" name="name" placeholder="姓名" required class="bg-zinc-700 text-zinc-300">
<textarea name="text" placeholder="留言" rows="10" required class="p-2 bg-zinc-700 text-zinc-300"></textarea>
--->

  <!--- your other form fields go here 
  <button type="submit" class="px-2 py-1 bg-zinc-700 text-zinc-300">提交</button>
</form>
--->

<script>
  let submitStatus;
  const submitForm = async (data) => {
    submitStatus = "submitting";
    const formData = new FormData(data.currentTarget);

    const res = await fetch("contact.json", {
      method: "POST",
      body: formData,
    });

    const { message } = await res.json();
    submitStatus = message;
  };
</script>

{#if submitStatus == "submitting"}
  <p>提交中...</p>
{:else if submitStatus == "failed"}
  <p>没有提交成功。</p>
{:else if submitStatus == "success"}
  <p>提交成功了！</p>
{:else}
  <form on:submit|preventDefault={submitForm} class="flex flex-col space-y-4">
    <input type="text" name="name" placeholder="姓名" required class="bg-zinc-700 text-zinc-300">
    <input type="email" name="email" placeholder="电邮" required class="bg-zinc-700 text-zinc-300">
    <textarea name="message" placeholder="留言" rows="10" required class="p-2 bg-zinc-700 text-zinc-300"></textarea>
    <button type="submit" class="px-2 py-1 bg-zinc-700 text-zinc-300">提交</button>
  </form>
{/if}