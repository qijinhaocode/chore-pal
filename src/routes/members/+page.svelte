<script lang="ts">
    import { AV } from '$lib/leancloud';
    import { onMount } from 'svelte';

    let currentUser = AV.User.current();
    let members: { id: string; name: string; contact: string; role: string }[] = [];
    let newName = '';
    let newContact = '';
    let newRole = '';
    let loading = true;
    let error = '';

    // 初始化查询成员
    async function fetchMembers() {
        loading = true;
        error = '';
        try {
            if (!currentUser) {
                throw new Error('请先登录');
            }
            const query = new AV.Query('Member');
            query.equalTo('owner', currentUser);
            query.descending('createdAt');
            const results = await query.find();
            members = results.map(m => ({
                id: m.id,
                name: m.get('name'),
                contact: m.get('contact'),
                role: m.get('role')
            }));
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    // 添加新成员
    async function addMember() {
        if (!newName.trim()) return;
        try {
            const Member = AV.Object.extend('Member');
            const member = new Member();
            member.set('name', newName);
            member.set('contact', newContact);
            member.set('role', newRole);
            member.set('owner', currentUser);

            // ACL 设置：仅创建者可读写
            const acl = new AV.ACL();
            acl.setReadAccess(currentUser, true);
            acl.setWriteAccess(currentUser, true);
            member.setACL(acl);

            await member.save();
            members = [{ id: member.id, name: newName, contact: newContact, role: newRole }, ...members];
            newName = '';
            newContact = '';
            newRole = '';
        } catch (e: any) {
            error = `添加失败：${e.message}`;
        }
    }

    onMount(fetchMembers);
</script>

<style>
    form { margin-top: 1rem; }
    input, select { margin: 0.25rem 0; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; width: 100%; }
    button { margin-top: 0.5rem; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
</style>

<h2>成员管理</h2>

{#if loading}
    <p>加载中...</p>
{:else if error}
    <p style="color:red;">{error}</p>
{:else}
    <ul>
        {#each members as m}
            <li>
                <strong>{m.name}</strong> — {m.contact} ({m.role})
            </li>
        {/each}
    </ul>

    <form on:submit|preventDefault={addMember}>
        <input bind:value={newName} placeholder="姓名" required />
        <input bind:value={newContact} placeholder="联系方式" />
        <input bind:value={newRole} placeholder="角色（可选）" />
        <button type="submit">添加成员</button>
    </form>
{/if}
