// Single-process deployment only. Multi-instance hosting needs a shared limiter.
export function createLimiter({ maxKeys = 5000 } = {}) {
  const buckets = new Map();
  return {
    take(key, max, windowMs, now = Date.now()) {
      for (const [k, value] of buckets) if (value.until <= now) buckets.delete(k);
      let bucket = buckets.get(key);
      if (!bucket) {
        if (buckets.size >= maxKeys) return false;
        bucket = { count: 0, until: now + windowMs }; buckets.set(key, bucket);
      }
      if (bucket.count >= max) return false;
      bucket.count++; return true;
    }
  };
}
