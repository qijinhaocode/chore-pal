<script lang="ts">
    import { AV } from '$lib/leancloud';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { get } from 'svelte/store';

    let params = get(page).params;
    let groupId = params.id;
    let currentUser = AV.User.current();
    let requests: { id: string; username: string }[] = [];
    let group: any = null;
    let isOwner = false;
    let loading = true;
    let error = '';

    async function fetchRequests() {
        loading = true;
        try {
            if (!currentUser) {
                goto('/login');
                return;
            }

            console.log('当前用户 ID:', currentUser?.id);
            console.log('Group ID:', groupId);

            group = await new AV.Query('Group').get(groupId);
            console.log('获取到 Group:', group);

            isOwner = (group.get('owner') as AV.User)?.id === currentUser.id;
            if (!isOwner) {
                error = '你无权查看此页面';
                return;
            }

            const q = new AV.Query('JoinRequest');
            console.log('1025++',q)
            const groupPointer = AV.Object.createWithoutData('Group', groupId);
            // q.include('group');
            // q.equalTo('status', 'pending');
            // q.equalTo('group', '681b35fb685d2315e66edc44');
            console.log('JoinRequest group pointer:', groupPointer);
            const results = await q.find();

            console.log('查询到的申请数:', results.length);

            requests = results
                .filter(r => r.get('group')?.id === groupId)
                .map(r => ({ id: r.id, username: r.get('username') }));
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function approve(id: string) {
        const jr = await new AV.Query('JoinRequest').get(id);
        const user = jr.get('user');

        // 1. 检查是否已经是成员（避免重复创建）
        const check = new AV.Query('GroupMember');
        check.equalTo('user', user);
        check.equalTo('group', group);
        const exists = await check.first();

        if (!exists) {
            const GroupMember = AV.Object.extend('GroupMember');
            const gm = new GroupMember();
            gm.set('user', user);
            gm.set('group', group);
            gm.set('role', 'member');
            gm.set('status', 'active');
            await gm.save();
        }

        // 2. 更新申请状态
        jr.set('status', 'approved');
        await jr.save();

        // 3. 前端移除显示
        requests = requests.filter(r => r.id !== id);
    }

    async function reject(id: string) {
        const jr = await new AV.Query('JoinRequest').get(id);
        jr.set('status', 'rejected');
        await jr.save();
        requests = requests.filter(r => r.id !== id);
    }

    onMount(fetchRequests);
</script>

<style>
    .container { max-width: 600px; margin: auto; padding: 1rem; }
    ul { list-style: none; padding: 0; }
    li { padding: 0.5rem 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    button { margin-left: 0.5rem; }
</style>

<div class="container">
    <h2>入群申请</h2>
    {#if loading}
        <p>加载中...</p>
    {:else if error}
        <p style="color:red">{error}</p>
    {:else if requests.length === 0}
        <p>暂无申请</p>
    {:else}
        <ul>
            {#each requests as r}
                <li>
                    <span>{r.username}</span>
                    <div>
                        <button on:click={() => approve(r.id)}>接受</button>
                        <button on:click={() => reject(r.id)}>拒绝</button>
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>
