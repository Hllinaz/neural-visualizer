export class SeededRandom {

    constructor(private seed: number) { }

    next(): number {
        let t = this.seed += 0x6D2B79F5
        t = Math.imul(t ^ t >>> 15, t | 1)
        t ^= t + Math.imul(t ^ t >>> 7, t | 61)
        return ((t ^ t >>> 14) >>> 0) / 4294967296
    }

    nextRange(min: number, max: number): number {
        return min + (max - min) * this.next()
    }

    nextGaussian(): number {
        let u = 0, v = 0
        while (u === 0) u = this.next()
        while (v === 0) v = this.next()
        return Math.sqrt(-2.0 * Math.log(u)) *
            Math.cos(2.0 * Math.PI * v)
    }
}