import AV from 'leancloud-storage';

AV.init({
    appId: import.meta.env.VITE_APP_ID!,
    appKey: import.meta.env.VITE_APP_KEY!,
    serverURL: import.meta.env.VITE_SERVER_URL!,
});

export { AV };
