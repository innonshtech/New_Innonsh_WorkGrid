const jwt = require('jsonwebtoken');

const secret = '50560daf592e4a3fd93fc1ed75e13ebb88425fab6a5357024f126f8148ab9efe';
const payload = {
  id: '89853dfc-3438-47a8-9bdd-3838118a843c',
  mongoId: '6a0444076c76d863008f0660',
  email: 'info@innonsh.com',
  role: 'admin',
  organizationId: '1713d3da-2293-43c2-a7f9-c15a35b9c453'
};

const token = jwt.sign(payload, secret);
console.log(token);
