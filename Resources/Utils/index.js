module.exports = {
    runtime: (s) => {
        let d = Math.floor(s / 86400);
        let h = Math.floor(s % 86400 / 3600);
        let m = Math.floor(s % 3600 / 60);
        s = Math.floor(s % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    }
};