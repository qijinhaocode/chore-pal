<script lang="ts">
    import { AV } from '$lib/leancloud';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    // 当前用户
    let currentUser = AV.User.current();
    // 任务列表
    let chores: Array<{
        id: string;
        title: string;
        description: string;
        cycle: string;
        weight: number;
        dueDate: string;
        evaluationRequired: boolean;
        isActive: boolean;
        done: boolean;
    }> = [];
    let loading = true;
    let error = '';

    // 新建任务表单字段
    let title = '';
    let description = '';
    let cycle = 'daily';
    let weight = 1;
    let dueDate = '';
    let evaluationRequired = false;
    let isActive = true;

    // 如果查询时类不存在，先触发建表并移除占位
    async function ensureChoreClass() {
        try {
            const query = new AV.Query('Chore');
            await query.find();
        } catch (e: any) {
            if (e.code === 101) {
                const ChoreClass = AV.Object.extend('Chore');
                const tmp = new ChoreClass();
                tmp.set('title', '初始化');
                tmp.set('cycle', 'daily');
                tmp.set('weight', 1);
                tmp.set('owner', currentUser);
                const acl = new AV.ACL();
                acl.setReadAccess(currentUser, true);
                acl.setWriteAccess(currentUser, true);
                tmp.setACL(acl);
                await tmp.save();
                await tmp.destroy();
            } else {
                throw e;
            }
        }
    }

    // 获取当前用户的任务
    async function fetchChores() {
        loading = true;
        error = '';
        if (!currentUser) {
            goto('/login');
            return;
        }
        try {
            await ensureChoreClass();
            const query = new AV.Query('Chore');
            query.equalTo('owner', currentUser);
            query.descending('createdAt');
            const results = await query.find();
            chores = results.map(c => ({
                id: c.id!,
                title: (c.get('title') as string) || '',
                description: (c.get('description') as string) || '',
                cycle: (c.get('cycle') as string) || '',
                weight: (c.get('weight') as number) || 0,
                dueDate: c.get('due_at') ? (c.get('due_at') as Date).toISOString().slice(0, 10) : '',
                evaluationRequired: (c.get('evaluationRequired') as boolean) || false,
                isActive: (c.get('isActive') as boolean) || false,
                done: (c.get('done') as boolean) || false
            }));
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    // 添加新任务
    async function addChore() {
        if (!title.trim()) return;
        try {
            const ChoreClass = AV.Object.extend('Chore');
            const chore = new ChoreClass();
            chore.set('title', title);
            chore.set('description', description);
            chore.set('cycle', cycle);
            chore.set('weight', weight);
            if (dueDate) chore.set('due_at', new Date(dueDate));
            chore.set('evaluationRequired', evaluationRequired);
            chore.set('isActive', isActive);
            chore.set('done', false);
            chore.set('owner', currentUser);
            const acl = new AV.ACL();
            acl.setReadAccess(currentUser, true);
            acl.setWriteAccess(currentUser, true);
            chore.setACL(acl);
            const saved = await chore.save();
            chores = [
                {
                    id: saved.id!,
                    title,
                    description,
                    cycle,
                    weight,
                    dueDate,
                    evaluationRequired,
                    isActive,
                    done: false
                },
                ...chores
            ];
            // 重置表单
            title = '';
            description = '';
            cycle = 'daily';
            weight = 1;
            dueDate = '';
            evaluationRequired = false;
            isActive = true;
        } catch (e: any) {
            error = e.message;
        }
    }

    onMount(fetchChores);
</script>

<style>
    .container { max-width: 600px; margin: auto; padding: 1rem; }
    .chore-item { border-bottom: 1px solid #eee; padding: 0.5rem 0; }
    form { margin-top: 1rem; display: grid; gap: 0.5rem; }
    label { font-weight: bold; display: flex; align-items: center; }
    input[type="text"], input[type="number"], input[type="date"], textarea, select {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        width: 100%;
    }
    input[type="checkbox"] {
        margin-right: 0.5rem;
        width: auto;
        height: auto;
    }
    button { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
</style>

<div class="container">
    <h2>任务管理</h2>

    {#if loading}
        <p>加载中...</p>
    {:else if error}
        <p style="color:red;">{error}</p>
    {:else}
        <div>
            {#each chores as c}
                <div class="chore-item">
                    <h3>{c.title} {c.isActive ? '' : '(已停用)'}</h3>
                    {#if c.description}
                        <p>{c.description}</p>
                    {/if}
                    <p>周期: {c.cycle} | 权重: {c.weight} | 截止: {c.dueDate || '—'}</p>
                    <p>评判: {c.evaluationRequired ? '开启' : '关闭'}</p>
                </div>
            {/each}
        </div>

        <form on:submit|preventDefault={addChore}>
            <label>任务标题</label>
            <input type="text" bind:value={title} required />

            <label>详情描述</label>
            <textarea rows="2" bind:value={description}></textarea>

            <label>周期</label>
            <select bind:value={cycle}>
                <option value="daily">每日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
            </select>

            <label>权重</label>
            <input type="number" bind:value={weight} min="1" />

            <label>截止日期</label>
            <input type="date" bind:value={dueDate} />

            <label><input type="checkbox" bind:checked={evaluationRequired} />需要评判</label>
            <label><input type="checkbox" bind:checked={isActive} />启用任务</label>

            <button type="submit">添加任务</button>
        </form>
    {/if}
</div>
