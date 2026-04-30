async function testJudge0() {
  const url = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';
  const payload = {
    source_code: 'print("Hello from Judge0 Test")',
    language_id: 71, // Python
    stdin: ''
  };

  console.log('Testing Judge0 EXECUTION...');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.stdout && result.stdout.trim() === 'Hello from Judge0 Test') {
      console.log('\n✅ JUDGE0 EXECUTION SUCCESSFUL!');
    } else {
      console.log('\n❌ JUDGE0 EXECUTION FAILED OR RETURNED UNEXPECTED DATA');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testJudge0();
