export function now(req) {
    if (process.env.TEST_MODE === "1") {
        const h = req.headers["x-test-now-ms"]
        if (h) return new Date(parseInt(h, 10))
    }
    return new Date()
}