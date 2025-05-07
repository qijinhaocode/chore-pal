<script lang="ts">
    import { onMount } from 'svelte';
    import { AV } from '$lib/leancloud';
    import { goto } from '$app/navigation';

    let user = AV.User.current();

    onMount(() => {
        if (user) {
            // 已登录用户自动跳转
            goto('/schedule');
        }
    });
</script>

{#if !user}
    <h1>欢迎使用 chore-pal 🧹</h1>
    <p>请先登录以管理你的值日任务</p>
    <a href="/login">👉 去登录</a>
{/if}
