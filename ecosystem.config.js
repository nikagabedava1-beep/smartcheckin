module.exports = {
  apps: [
    {
      name: 'smartcheckin',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/smartcheckin',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/www/smartcheckin/logs/error.log',
      out_file: '/var/www/smartcheckin/logs/output.log',
      log_file: '/var/www/smartcheckin/logs/combined.log',
      time: true,
    },
  ],
}
