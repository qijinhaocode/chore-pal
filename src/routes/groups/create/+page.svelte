<script lang="ts">
    import { AV } from '$lib/leancloud';
    import { generateCode } from '$lib/utils';

    let name = '';
    let message = '';
    let createdCode = '';

    let loading = false;

    async function createGroup() {
        if (loading) return;
        loading = true;
        message = '';

        try {
            const user = AV.User.current();
            const code = generateCode();

            const Group = AV.Object.extend('Group');
            const g = new Group();
            g.set('name', name);
            g.set('code', code);
            g.set('owner', user);

            await g.save(); // 先保存分组
           // ✅ 只有真正创建成功后才显示
            createdCode = code;

            // 保存成员关系（GroupMember）
            const GroupMember = AV.Object.extend('GroupMember');
            const gm = new GroupMember();
            gm.set('user', user);
            gm.set('group', g);
            gm.set('role', 'owner');
            gm.set('status', 'active');
            await gm.save();

            message = '创建成功！';
            name = '';
        } catch (e: any) {
            message = '创建失败：' + e.message;
        } finally {
            loading = false;
        }
    }
    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text).then(() => {
            alert('邀请码已复制到剪贴板');
        }, () => {
            alert('复制失败，请手动复制');
        });
    }
</script>

<h2>创建新分组</h2>
<input bind:value={name} placeholder="分组名称" />
<button on:click={createGroup} disabled={loading}>
    {#if loading}创建中...{/if}
    {#if !loading}创建{/if}
</button>
{#if createdCode}
    <p>
        邀请码：<strong>{createdCode}</strong>
        <button on:click={() => copyToClipboard(createdCode)}>复制</button>
    </p>
{/if}
<p>{message}</p>
