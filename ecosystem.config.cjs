module.exports = {
    apps: [{
        name: 'CloudflareDDNS',
        script: './dist/index.js',
        cron_restart: '0 0 * * *',
    }],
};