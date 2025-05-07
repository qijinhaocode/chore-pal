<script lang="ts">
    import { AV } from '$lib/leancloud';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let codeInput = '';
    let error = '';
    let loading = false;
    let group: { id: string; name: string; code: string; owner: string } | null = null;

    // todo 强制触发表创建（仅开发阶段可保留）
    onMount(async () => {
        const test = new AV.Object('JoinRequest');
        test.set('status', 'test_init');
        try {
            await test.save();
            console.log('JoinRequest 表已成功创建（test_init）');
            await test.destroy(); // 保存后删除避免污染
        } catch (e) {
            console.warn('JoinRequest 表预创建失败', e);
        }
    });

    // 检查登录
    onMount(() => {
        if (!AV.User.current()) {
            goto('/login');
        }
    });

    // 查询分组
    async function searchGroup() {
        error = '';
        group = null;
        if (!codeInput.trim()) {
            error = '请输入邀请码';
            return;
        }
        loading = true;
        try {
            const q = new AV.Query('Group');
            q.equalTo('code', codeInput.trim());
            const results = await q.find();
            if (results.length === 0) {
                error = '无效的邀请码';
            } else {
                const g = results[0];
                group = {
                    id: g.id,
                    name: g.get('name'),
                    code: g.get('code'),
                    owner: g.get('owner')
                };
            }
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    // 加入分组（改为提交申请）
    async function joinGroup() {
        if (!group) return;
        error = '';
        loading = true;
        try {
            const current = AV.User.current();
            const username = current.getUsername();

            // 检查是否已有申请
            const existing = new AV.Query('JoinRequest');
            existing.equalTo('group', AV.Object.createWithoutData('Group', group.id));
            existing.equalTo('user', current);
            existing.equalTo('status', 'pending');
            const dup = await existing.first();
            if (dup) {
                error = '你已提交申请，请等待审批';
                loading = false;
                return;
            }

            const jr = new AV.Object('JoinRequest');
            jr.set('user', current);
            jr.set('username', username);
            jr.set('group', AV.Object.createWithoutData('Group', group.id));
            jr.set('status', 'pending');

            const acl = new AV.ACL();
            acl.setReadAccess(current, true);
            acl.setWriteAccess(current, true);
            acl.setRoleReadAccess('authenticated', true); // 管理员可见
            const groupPtr = AV.Object.createWithoutData('Group', group.id);
            await groupPtr.fetch(); // 必须 fetch 才能拿到 owner 字段
            const owner = groupPtr.get('owner');
            if (owner) {
                acl.setReadAccess(owner, true);
                acl.setWriteAccess(owner, true);
            }

            jr.setACL(acl);

            console.log('即将保存 JoinRequest');
            await jr.save();
            console.log('JoinRequest 保存成功');

            error = '申请已提交，请等待管理员审批';
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<style>
    .container { max-width: 400px; margin: auto; padding: 1rem; }
    input { width: 100%; padding: 0.5rem; margin: 0.5rem 0; border: 1px solid #ccc; border-radius: 4px; }
    button { padding: 0.5rem 1rem; margin-right: 0.5rem; border: none; border-radius: 4px; cursor: pointer; }
    .error { color: #dc2626; margin-top: 0.5rem; }
    .group-info { padding: 0.5rem; border: 1px solid #eee; border-radius: 4px; margin: 0.5rem 0; }
</style>

<div class="container">
    <h2>加入分组</h2>
    <input
            placeholder="输入邀请码"
            bind:value={codeInput}
            on:keyup={(e) => e.key === 'Enter' && searchGroup()}
    />
    <button on:click={searchGroup} disabled={loading}>查询</button>

    {#if loading}
        <p>查询中...</p>
    {:else if error}
        <p class="error">{error}</p>
    {:else if group}
        <div class="group-info">
            <p><strong>分组名称：</strong>{group.name}</p>
            <p><strong>邀请码：</strong>{group.code}</p>
        </div>
        <button on:click={joinGroup}>申请加入</button>
        <p style="font-size: 0.9rem; color: #666;">提交申请后需等待管理员审批</p>
    {/if}
</div>
