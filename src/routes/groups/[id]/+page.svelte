<script lang="ts">
    import { AV } from '$lib/leancloud';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { get } from 'svelte/store';

    let params = get(page).params;
    let groupId = params.id;

    let groupName = '';
    let code = '';
    let isOwner = false;
    let members: { gmId: string; username: string }[] = [];
    let loading = true;
    let error = '';

    async function fetchGroup() {
        loading = true;
        error = '';
        const current = AV.User.current();
        if (!current) {
            goto('/login');
            return;
        }

        try {
            const group = await new AV.Query('Group').get(groupId);
            groupName = group.get('name') || '';
            code = group.get('code') || '';
            const owner = group.get('owner') as AV.User;
            isOwner = owner?.id === current.id;

            // 查询 GroupMember 表，找出该组的所有成员
            const q = new AV.Query('GroupMember');
            q.equalTo('group', group);
            q.include('user');
            const results = await q.find();

            members = results.map(r => {
                const user = r.get('user') as AV.User;
                return {
                    gmId: r.id!,
                    username: user?.getUsername() || '未知用户'
                };
            });
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function removeMember(gmId: string) {
        if (!isOwner) return;
        try {
            await AV.Object.createWithoutData('GroupMember', gmId).destroy();
            members = members.filter(m => m.gmId !== gmId);
        } catch (e: any) {
            alert('删除失败: ' + e.message);
        }
    }

    onMount(fetchGroup);
</script>

<style>
    .container { max-width: 500px; margin: auto; padding: 1rem; }
    h2 { margin-bottom: 1rem; }
    ul { list-style: none; padding: 0; }
    li { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
    button { background: none; border: none; color: #dc2626; cursor: pointer; }
</style>

<div class="container">
    <h2>{groupName}（邀请码：{code}）</h2>
    {#if loading}
        <p>加载中...</p>
    {:else if error}
        <p style="color:red">{error}</p>
    {:else if members.length === 0}
        <p>暂无成员</p>
    {:else}
        <ul>
            {#each members as m}
                <li>
                    <span>{m.username}</span>
                    {#if isOwner}
                        <button on:click={() => removeMember(m.gmId)}>踢出</button>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</div>
