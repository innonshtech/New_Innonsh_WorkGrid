async function testPost() {
    try {
        const res = await fetch('http://localhost:3000/api/payroll/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: 'T001',
                password: 'password123',
                personalDetails: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    phone: '1234567890',
                    dateOfJoining: '2023-01-01'
                },
                jobDetails: {
                    organizationId: '60d5ecb8b5c9c627fcd12345',
                    departmentId: '60d5ecb8b5c9c627fcd12346'
                },
                workingHr: 9,
                payslipStructure: {
                    basicSalary: 1000,
                    salaryType: 'monthly'
                },
                salaryDetails: {
                    bankAccount: {
                        accountNumber: '123456789',
                        bankName: 'Test Bank',
                        ifscCode: 'TEST0001234'
                    }
                }
            })
        });
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Response:', text);
    } catch (e) {
        console.error('Error:', e);
    }
}
testPost();
