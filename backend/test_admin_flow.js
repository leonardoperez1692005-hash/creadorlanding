
const BASE_URL = 'http://localhost:3001/api';

async function testAdminFlow() {
    console.log('1. Intentando login como superadmin...');

    try {
        // 1. Login
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@staticlaunch.com',
                password: 'admin123'
            })
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.error('❌ Login falló:', loginData);
            return;
        }

        console.log('✅ Login exitoso. Token obtenido:', loginData.token.substring(0, 20) + '...');

        // 2. Acceder a ruta protegida
        console.log('\n2. Intentando acceder a /api/admin/users con el token...');

        const usersRes = await fetch(`${BASE_URL}/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${loginData.token}`
            }
        });

        const usersData = await usersRes.json();

        if (!usersRes.ok) {
            console.error('❌ Acceso a admin falló:', usersData);
            return;
        }

        console.log('✅ Acceso exitoso. Usuarios encontrados:', usersData.users.length);
        console.log('Lista de usuarios:', JSON.stringify(usersData.users, null, 2));

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

testAdminFlow();
