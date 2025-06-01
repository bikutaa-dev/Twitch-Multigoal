class TimeCacheStorage {
    constructor(basettl) {
        this.data = new Map()
        this.timers = new Map()
        this.base_ttl = basettl
    }

    set(k, v, ttl = null) {
        if (ttl === null) {
            ttl = this.base_ttl
        }
        
        if (this.timers.has(k)) {
            clearTimeout(this.timers.get(k))
        }
        this.timers.set(
            k,
            setTimeout(() => this.delete(k), ttl)
        )
        this.data.set(k, v)
    }

    get(k) {
        return this.data.get(k)
    }

    has(k) {
        return this.data.has(k)
    }

    delete(k) {
        if (this.timers.has(k)) {
            clearTimeout(this.timers.get(k))
        }
        this.timers.delete(k)
        return this.data.delete(k)
    }

    clear() {
        this.data.clear()
        for (const v of this.timers.values()) {
            clearTimeout(v)
        }
        this.timers.clear()
    }
}

module.exports = TimeCacheStorage