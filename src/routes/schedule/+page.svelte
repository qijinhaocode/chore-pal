<script lang="ts">
    import { AV } from '$lib/leancloud';
    import { onMount } from 'svelte';

    // 当前用户及管理员判断（需在控制台给管理员用户添加 isAdmin 字段）
    let currentUser = AV.User.current();
    let isAdmin = (currentUser?.get('isAdmin') as boolean) || false;

    // 排班数据
    let schedule: Array<{ date: string; slotName: string; choreTitle: string; ownerName: string }> = [];
    let loading = true;
    let error = '';

    // 确保 ScheduleEntry 类存在（自动建表）
    async function ensureScheduleEntryClass() {
        try {
            await new AV.Query('ScheduleEntry').find();
        } catch (e: any) {
            if (e.code === 101) {
                const Cls = AV.Object.extend('ScheduleEntry');
                const tmp = new Cls();
                tmp.set('date', new Date());
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

    // 获取排班
    async function fetchSchedule() {
        loading = true;
        error = '';
        try {
            await ensureScheduleEntryClass(); // 在查询前确保建表
            const query = new AV.Query('ScheduleEntry');
            query.include('slot').include('chore').include('owner');
            if (!isAdmin) {
                query.equalTo('owner', currentUser);
            }
            query.ascending('date');
            const results = await query.find();

            schedule = results.map(e => {
                const date = (e.get('date') as Date).toISOString().slice(0, 10);
                const slot = e.get('slot') as AV.Object;
                const chore = e.get('chore') as AV.Object;
                const owner = e.get('owner') as AV.User;
                return {
                    date,
                    slotName: slot.get('name') as string,
                    choreTitle: chore.get('title') as string,
                    ownerName: owner.getUsername()
                };
            });
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    onMount(fetchSchedule);
</script>

<style>
    .container { max-width: 600px; margin: auto; padding: 1rem; }
    .entry { padding: 0.5rem; border-bottom: 1px solid #eee; }
    h2 { margin-bottom: 1rem; }
</style>

<div class="container">
    <h2>{isAdmin ? '所有排班情况' : '我的排班安排'}</h2>

    {#if loading}
        <p>加载中...</p>
    {:else if error}
        <p style="color: red;">{error}</p>
    {:else}
        {#if schedule.length === 0}
            <p>暂无排班数据</p>
        {:else}
            {#each schedule as e}
                <div class="entry">
                    <strong>{e.date}</strong> — {e.slotName} — {e.choreTitle}
                    {#if isAdmin}
                        <span> — <em>{e.ownerName}</em></span>
                    {/if}
                </div>
            {/each}
        {/if}
    {/if}
</div>
