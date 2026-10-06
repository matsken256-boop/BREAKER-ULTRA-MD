const fs = require('fs');
const path = require('path');

module.exports = async (conn, m, config, store) => {
    try {
        const PluginsPath = path.join(__dirname, '../../Plugins');
        if (!fs.existsSync(PluginsPath)) return;

        const files = fs.readdirSync(PluginsPath).filter(f => f.endsWith('.js'));
        for (let file of files) {
            try {
                const plugin = require(path.join(PluginsPath, file));
                if (typeof plugin === 'function') {
                    await plugin(conn, m, config, store);
                }
            } catch (e) {
            }
        }
    } catch (err) {
        console.log('[EXECUTOR ERROR]', err);
    }
};