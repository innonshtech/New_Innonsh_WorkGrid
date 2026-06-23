const axios = require('axios');

async function main() {
  try {
    console.log('Attempting login as employee...');
    const loginRes = await axios.post('http://localhost:3000/api/v1/login', {
      username: 'aniket.innonsh@gmail.com',
      password: 'password123',
      role: 'employee'
    });

    console.log('Login Status:', loginRes.status);
    const cookies = loginRes.headers['set-cookie'];
    console.log('Cookies received:', cookies);

    const authToken = cookies.find(c => c.startsWith('authToken='));
    const tokenValue = authToken ? authToken.split(';')[0] : '';
    console.log('Auth Token:', tokenValue);

    console.log('Fetching payslips...');
    const payslipRes = await axios.get('http://localhost:3000/api/v1/employee/payroll/payslip', {
      headers: {
        Cookie: tokenValue
      }
    });

    console.log('Payslips API Status:', payslipRes.status);
    console.log('Payslips Data:', JSON.stringify(payslipRes.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

main();
