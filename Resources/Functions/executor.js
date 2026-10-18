const fs = require('fs');
const path = require('path');

module.exports = async (conn, m, config, store) => {
    try {
        const PluginsPath = path.join(__dirname, '../../Plugins');
        if (!fs.existsSync(PluginsPath)) {
            console.log('[EXECUTOR] Plugins folder NOT FOUND at', PluginsPath);
            return;
        }

        const files = fs.readdirSync(PluginsPath).filter(f => f.endsWith('.js'));
        // console.log(`[EXECUTOR] Loading ${files.length} plugins for ${m?.key?.remoteJid || 'welcome'}`);

        for (let file of files) {
            try {
                const pluginPath = path.join(PluginsPath, file);
                delete require.cache[require.resolve(pluginPath)]; // auto-reload on restart
                const plugin = require(pluginPath);
                if (typeof plugin === 'function') {
                    await plugin(conn, m, config, store);
                } else if (plugin && typeof plugin.default === 'function') {
                    await plugin.default(conn, m, config, store);
                }
            } catch (e) {
                console.log(`[PLUGIN ERROR] ${file}:`, e.message);
                // console.log(e.stack); // uncomment to see full error
            }
        }
    } catch (err) {
        console.log('[EXECUTOR ERROR]', err.message);
        console.log(err.stack);
    }
};