<script lang="ts">
    import { AV } from '$lib/leancloud';
    import { goto } from '$app/navigation';
    import { currentUser } from '$lib/store/user';

    let email = '';
    let password = '';
    let message = '';

    async function login() {
        message = '';
        try {
            await AV.User.logIn(email, password);
            message = '✅ 登录成功';
            currentUser.set(AV.User.current());
            goto('/schedule'); // 登录成功后跳转
        } catch (error) {
            message = `❌ 登录失败：${error.message}`;
        }
    }
</script>

<h2>值日宝登录</h2>

<form on:submit|preventDefault={login}>
    <input type="email" bind:value={email} placeholder="Email" required />
    <input type="password" bind:value={password} placeholder="Password" required />
    <button type="submit">登录</button>
</form>

<p>{message}</p>
