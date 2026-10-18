const fs = require('fs');
const path = require('path');

module.exports = async (conn, m, config, store) => {
    try {
        // TRY BOTH PATHS - Resources/Plugins and root/Plugins
        let PluginsPath = path.join(__dirname, '../Plugins');
        if (!fs.existsSync(PluginsPath)) {
            PluginsPath = path.join(__dirname, '../../Plugins');
        }
        if (!fs.existsSync(PluginsPath)) {
            PluginsPath = path.join(__dirname, '../../Resources/Plugins');
        }
        
        if (!fs.existsSync(PluginsPath)) {
            console.log('[EXECUTOR] Plugins folder NOT FOUND. Tried:');
            console.log('-', path.join(__dirname, '../Plugins'));
            console.log('-', path.join(__dirname, '../../Plugins'));
            return;
        }

        const files = fs.readdirSync(PluginsPath).filter(f => f.endsWith('.js'));
        console.log(`[EXECUTOR] Found ${files.length} plugins at ${PluginsPath}`);

        for (let file of files) {
            try {
                const pluginPath = path.join(PluginsPath, file);
                delete require.cache[require.resolve(pluginPath)];
                const plugin = require(pluginPath);
                if (typeof plugin === 'function') {
                    await plugin(conn, m, config, store);
                } else if (plugin && typeof plugin.default === 'function') {
                    await plugin.default(conn, m, config, store);
                }
            } catch (e) {
                console.log(`[PLUGIN ERROR] ${file}:`, e.message);
            }
        }
    } catch (err) {
        console.log('[EXECUTOR ERROR]', err.message);
    }
};