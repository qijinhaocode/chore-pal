import { differenceInDays, addDays, formatISO } from 'date-fns';
import { AV } from '$lib/leancloud';

/** 用户类型 */
export interface User {
    id: string;
    username: string;
}

/** 任务类型 */
export interface Chore {
    id: string;
    title: string;
    weight?: number;
}

/** 时段类型 */
export interface ShiftSlot {
    id: string;
    name: string;
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
}

/** 排班条目 */
export interface ScheduleEntry {
    date: string; // ISO 日期 string
    slot: ShiftSlot;
    chore: Chore;
    owner: User;
}

/** 策略接口 */
export interface ScheduleStrategy {
    generate(
        participants: User[],
        chores: Chore[],
        slots: ShiftSlot[],
        start: Date,
        end: Date
    ): ScheduleEntry[];
}

/** A. 日轮转策略：每天一个人，循环分配所有任务 */
export class DailyRotationStrategy implements ScheduleStrategy {
    generate(
        participants: User[],
        chores: Chore[],
        slots: ShiftSlot[],
        start: Date,
        end: Date
    ): ScheduleEntry[] {
        const days = differenceInDays(end, start) + 1;
        const entries: ScheduleEntry[] = [];
        let userIndex = 0;
        for (let d = 0; d < days; d++) {
            const date = formatISO(addDays(start, d), { representation: 'date' });
            const owner = participants[userIndex % participants.length];
            chores.forEach(chore => {
                entries.push({ date, slot: { id: 'all-day', name: '全天', startTime: '00:00', endTime: '23:59' }, chore, owner });
            });
            userIndex++;
        }
        return entries;
    }
}

/** B. 三段轮班策略 */
export class ThreeShiftStrategy implements ScheduleStrategy {
    generate(
        participants: User[],
        chores: Chore[],
        slots: ShiftSlot[],
        start: Date,
        end: Date
    ): ScheduleEntry[] {
        const days = differenceInDays(end, start) + 1;
        const entries: ScheduleEntry[] = [];
        // 构建轮次队列
        const queue = participants;
        let cycleCount = 0;
        for (let d = 0; d < days; d++) {
            const date = formatISO(addDays(start, d), { representation: 'date' });
            slots.forEach((slot, idx) => {
                // 每个时段选一个 owner
                const owner = queue[(d * slots.length + idx) % queue.length];
                chores.forEach(chore => {
                    entries.push({ date, slot, chore, owner });
                });
            });
            cycleCount++;
        }
        return entries;
    }
}

/** F. 补排策略：检测空缺并递补 */
export class FallbackFillStrategy {
    fill(
        existing: ScheduleEntry[],
        participants: User[],
        chores: Chore[],
        slots: ShiftSlot[],
        start: Date,
        end: Date
    ): ScheduleEntry[] {
        const days = differenceInDays(end, start) + 1;
        const full: ScheduleEntry[] = [];
        let idx = 0;
        for (let d = 0; d < days; d++) {
            const date = formatISO(addDays(start, d), { representation: 'date' });
            slots.forEach(slot => {
                chores.forEach(chore => {
                    const exists = existing.find(e => e.date === date && e.slot.id === slot.id && e.chore.id === chore.id);
                    if (exists) {
                        full.push(exists);
                    } else {
                        // 递补下一个用户
                        const owner = participants[idx % participants.length];
                        full.push({ date, slot, chore, owner });
                        idx++;
                    }
                });
            });
        }
        return full;
    }
}

/** 调度引擎 **/
export class Scheduler {
    strategies: ScheduleStrategy[];
    fallback: FallbackFillStrategy;

    constructor(strategies: ScheduleStrategy[], fallback?: FallbackFillStrategy) {
        this.strategies = strategies;
        this.fallback = fallback || new FallbackFillStrategy();
    }

    async run(
        participants: User[],
        chores: Chore[],
        slots: ShiftSlot[],
        start: Date,
        end: Date
    ) {
        // 1. 初步生成
        let entries: ScheduleEntry[] = [];
        this.strategies.forEach(strategy => {
            entries = entries.concat(strategy.generate(participants, chores, slots, start, end));
        });
        // 2. 补排
        const full = this.fallback.fill(entries, participants, chores, slots, start, end);

        // 3. 保存到 LeanCloud
        const ClassEntry = AV.Object.extend('ScheduleEntry');
        const objects = full.map(e => {
            const obj = new ClassEntry();
            obj.set('date', new Date(e.date));
            obj.set('slot', AV.Object.createWithoutData('ShiftSlot', e.slot.id));
            obj.set('chore', AV.Object.createWithoutData('Chore', e.chore.id));
            obj.set('owner', AV.Object.createWithoutData('_User', e.owner.id));
            const acl = new AV.ACL();
            acl.setReadAccess(AV.User.current(), true);
            acl.setWriteAccess(AV.User.current(), true);
            obj.setACL(acl);
            return obj;
        });
        await AV.Object.saveAll(objects);
        return full;
    }
}
