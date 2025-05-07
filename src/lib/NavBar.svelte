<script lang="ts">
    import { AV } from '$lib/leancloud';
    import { goto } from '$app/navigation';
    import { currentUser } from '$lib/store/user';
    import { derived } from 'svelte/store';

    const isAdmin = derived(currentUser, u => (u?.get('isAdmin') as boolean) || false);

    async function logout() {
        await AV.User.logOut();
        currentUser.set(null);
        goto('/login');
    }
</script>

<style>
    nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.5rem;
        background-color: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .left, .right {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    a {
        text-decoration: none;
        color: #374151;
        font-size: 0.95rem;
        font-weight: 500;
    }

    a:hover {
        color: #2563eb;
    }

    .username {
        font-size: 0.9rem;
        color: #4b5563;
    }

    button {
        background: none;
        border: none;
        color: #2563eb;
        font-size: 0.9rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
    }

    button:hover {
        text-decoration: underline;
    }
</style>

<nav>
    <div class="left">
        <a href="/">🏠 chore-pal</a>
        <a href="/schedule">📆 我的排班</a>
        {#if $isAdmin}
            <a href="/tasks">🛠 创建任务</a>
        {/if}
        {#if $currentUser}
            <a href="/groups/create">➕ 创建分组</a>
            <a href="/groups/join">🔗 加入分组</a>
            <a href="/groups">👥 我的分组</a>
        {/if}
    </div>
    <div class="right">
        {#if $currentUser}
            <span class="username">{$currentUser.getUsername()}</span>
            <button on:click={logout}>退出</button>
        {/if}
    </div>
</nav>
