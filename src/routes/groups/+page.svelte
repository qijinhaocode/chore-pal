<script lang="ts">
    import { AV } from '$lib/leancloud';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let current = AV.User.current();
    let loading = true;
    let error = '';
    let groups: { id: string; name: string; code: string; isOwner: boolean }[] = [];

    // 删除分组前检查成员数组是否为空
    async function deleteGroup(id: string) {
        const confirmDelete = confirm('确定要删除该分组吗？该操作不可恢复');
        if (!confirmDelete) return;

        try {
            const g = await new AV.Query('Group').get(id);

            // 查询该分组下是否还有成员
            const q = new AV.Query('GroupMember');
            q.equalTo('group', g);
            const count = await q.count();

            if (count > 0) {
                alert('分组中还有成员，无法删除');
                return;
            }

            await g.destroy();
            groups = groups.filter(gr => gr.id !== id);
        } catch (e: any) {
            alert('删除失败: ' + e.message);
        }
    }

    // 加载我加入的分组
    onMount(async () => {
        if (!current) {
            goto('/login');
            return;
        }

        loading = true;
        error = '';
        try {
            const q = new AV.Query('GroupMember');
            q.equalTo('user', current);
            q.include('group');
            q.include('group.owner'); // 也包含 owner 以判断 isOwner

            const results = await q.find();

            groups = results.map(r => {
                const g = r.get('group');
                const owner = g.get('owner');
                return {
                    id: g.id,
                    name: g.get('name'),
                    code: g.get('code'),
                    isOwner: owner?.id === current.id
                };
            });
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    });
</script>

<style>
    .container { max-width: 600px; margin: auto; padding: 1rem; }
    ul { list-style: none; padding: 0; }
    li { padding: 0.5rem 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    a { text-decoration: none; color: #2563eb; font-weight: 500; }
    .owner { color: #10b981; font-size: 0.9rem; margin-left: 0.5rem; }
    button.delete {
        background: none;
        border: none;
        color: #dc2626;
        font-size: 0.85rem;
        cursor: pointer;
    }
</style>

<div class="container">
    <h2>我的分组</h2>
    {#if loading}
        <p>加载中...</p>
    {:else if error}
        <p style="color:red">{error}</p>
    {:else if groups.length === 0}
        <p>暂无分组，请创建或加入分组。</p>
    {:else}
        <ul>
            {#each groups as g}
                <li>
                    <a href="/groups/{g.id}">{g.name}</a>
                    <div>
                        {#if g.isOwner}
                            <span class="owner">（管理员）</span>
                            <a href="/groups/{g.id}/requests">审批申请</a>
                            <button class="delete" on:click={() => deleteGroup(g.id)}>删除</button>
                        {/if}
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>
