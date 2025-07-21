const os = require('os');
const { exec } = require('child_process');

// 获取本机IP地址
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();

console.log('🚀 污水治理智能审批系统 - 快速部署');
console.log('=====================================');
console.log('');
console.log('📍 本机IP地址:', localIP);
console.log('');
console.log('🌐 访问地址：');
console.log(`   本地访问: http://localhost:8080/`);
console.log(`   网络访问: http://${localIP}:8080/`);
console.log('');
console.log('🔧 管理页面：');
console.log(`   本地管理: http://localhost:8080/admin`);
console.log(`   网络管理: http://${localIP}:8080/admin`);
console.log('');
console.log('📋 分享给他人的链接：');
console.log(`   用户页面: http://${localIP}:8080/`);
console.log(`   管理页面: http://${localIP}:8080/admin`);
console.log('');
console.log('⚠️  注意事项：');
console.log('   1. 确保防火墙允许端口 3001 和 8080');
console.log('   2. 用户需要与你在同一网络（WiFi/局域网）');
console.log('   3. 保持后端和前端服务持续运行');
console.log('');
console.log('🔴 如需关闭服务，请按 Ctrl+C');
console.log('');

// 启动提示
setTimeout(() => {
    console.log('正在启动服务...');
    console.log('后端服务: http://localhost:3001');
    console.log('前端服务: http://localhost:8080');
}, 1000);