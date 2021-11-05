<script>
    import Close from 'svelte-material-icons/Close.svelte'

    let size;
    let newItem = '';
	
    let todoList = [
        {text:"散步、打拳", status:true},
        {text:"吃早餐、中餐、晚餐", status:false},
        {text:"挣三百块钱", status:false},
        {text:"睡觉休息", status:false},
    ];
	
	function addToList() {
		todoList = [...todoList, {text: newItem, status: false}];
		newItem = '';
	}
	
	function removeFromList(index) {
		todoList.splice(index, 1)
		todoList = todoList;
    }
</script>
<div class="flex flex-col space-y-1">
<input bind:value={newItem} type="text" placeholder="今天要做的事项" class="bg-gray-700 text-gray-300">
<button on:click={addToList} class="py-1 px-2 bg-gray-700 text-gray-300">添加</button>
</div>
<br/>
{#each todoList as item, index}
<div class="flex justify-between items-center">
	<input bind:checked={item.status} type="checkbox">
	<span class:checked={item.status}>{item.text}</span>
	<span on:click={() => removeFromList(index)}><Close {size} /></span>
    </div>
	<br/>
{/each} 


<style> 
	.checked {
        text-decoration: line-through;
    }
</style> 