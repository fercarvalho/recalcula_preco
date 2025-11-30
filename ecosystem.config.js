module.exports = {
  apps: [{
    name: 'calculadora-reajuste',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // Configurações de reinicialização automática
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // Logs
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Configurações de restart
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Variáveis de ambiente (serão sobrescritas pelo arquivo .env)
    // Certifique-se de ter um arquivo .env na raiz do projeto
  }]
};

