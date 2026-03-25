// Test seluruh sistem
export const runSystemTest = async () => {
  const results = [];
  
  // Test 1: Backend connection
  try {
    const healthRes = await fetch('http://localhost:8000/health');
    results.push({
      test: 'Backend Connection',
      status: healthRes.ok ? '✅ PASS' : '❌ FAIL',
      details: healthRes.ok ? 'Backend is running' : 'Backend not responding'
    });
  } catch (error) {
    results.push({
      test: 'Backend Connection',
      status: '❌ FAIL',
      details: error.message
    });
  }
  
  // Test 2: Get Public Key
  try {
    const keyRes = await fetch('http://localhost:8000/api/public-key');
    const keyData = await keyRes.json();
    results.push({
      test: 'EdDSA Key Generation',
      status: keyData.public_key ? '✅ PASS' : '❌ FAIL',
      details: keyData.public_key 
        ? `Algorithm: ${keyData.algorithm}, Key Size: ${keyData.key_size}`
        : 'No public key returned'
    });
  } catch (error) {
    results.push({
      test: 'EdDSA Key Generation',
      status: '❌ FAIL',
      details: error.message
    });
  }
  
  // Test 3: Create Certificate
  try {
    const formData = new FormData();
    formData.append('certificate_id', 'TEST-001');
    formData.append('recipient_name', 'Test User');
    formData.append('issued_date', '2024-01-01');
    
    const signRes = await fetch('http://localhost:8000/api/sign', {
      method: 'POST',
      body: formData
    });
    
    const signData = await signRes.json();
    results.push({
      test: 'Certificate Signing',
      status: signData.success ? '✅ PASS' : '❌ FAIL',
      details: signData.success 
        ? `Certificate ID: ${signData.certificate_id}`
        : 'Signing failed'
    });
  } catch (error) {
    results.push({
      test: 'Certificate Signing',
      status: '❌ FAIL',
      details: error.message
    });
  }
  
  return results;
};

// Display test results in console
export const displayTestResults = (results) => {
  console.log('='.repeat(50));
  console.log('SYSTEM TEST RESULTS');
  console.log('='.repeat(50));
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.test}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Details: ${result.details}`);
    console.log('-'.repeat(50));
  });
  
  const passed = results.filter(r => r.status.includes('PASS')).length;
  const total = results.length;
  
  console.log(`\n📊 Summary: ${passed}/${total} tests passed`);
  console.log('='.repeat(50));
};