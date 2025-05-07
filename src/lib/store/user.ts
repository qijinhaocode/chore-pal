// src/lib/stores/user.ts
import { writable } from 'svelte/store';
import { AV } from '$lib/leancloud';

export const currentUser = writable<AV.User | null>(AV.User.current());
