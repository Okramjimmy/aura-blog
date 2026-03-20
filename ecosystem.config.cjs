// PM2 ecosystem config — must be .cjs because package.json has "type":"module"
// Usage:
//   pm2 start ecosystem.config.cjs --env production
//   pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name: 'aura-blog',

      // tsx runs TypeScript directly — no separate compile step needed for the server
      script: './node_modules/.bin/tsx',
      args:   'server.ts',

      // dotenv/config in server.ts loads this file automatically
      env_file: '.env',

      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },

      // Restart policy
      watch:               false,   // never watch in production
      max_memory_restart:  '400M',
      restart_delay:       3000,
      max_restarts:        10,
      min_uptime:          '10s',

      // Logging
      error_file:      './logs/pm2-error.log',
      out_file:        './logs/pm2-out.log',
      merge_logs:      true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
