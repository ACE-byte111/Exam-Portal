const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Judge0 Language IDs
const EXT_TO_LANG_ID = {
  'cpp': 54,   // C++ (GCC 9.2.0)
  'h': 54,
  'hpp': 54,
  'c': 50,     // C (GCC 9.2.0)
  'py': 71,    // Python (3.8.1)
  'java': 62,  // Java (OpenJDK 13.0.1)
  'js': 63,    // JavaScript (Node.js 12.14.0)
};

/**
 * Base64 helper
 */
const toBase64 = (str) => Buffer.from(str || '').toString('base64');
const fromBase64 = (str) => Buffer.from(str || '', 'base64').toString('utf-8');

// Using multiple Judge0 CE Public Instances for high availability
const JUDGE0_INSTANCES = [
  'https://ce.judge0.com',
  'https://api.judge0.com'
];

router.post('/run', requireAuth, async (req, res) => {
  const { fileName, content, stdin = '' } = req.body;

  if (!fileName || !content) {
    return res.status(400).json({ error: 'Missing fileName or content' });
  }

  const ext = fileName.split('.').pop().toLowerCase();
  const languageId = EXT_TO_LANG_ID[ext];

  if (!languageId) {
    return res.status(400).json({ error: `Language for .${ext} is not supported.` });
  }

  let lastError = null;
  
  // Try each instance until one works
  for (const baseUrl of JUDGE0_INSTANCES) {
    try {
      const url = `${baseUrl}/submissions?base64_encoded=true&wait=true`;
      console.log(`[Compiler] Attempting execution on: ${baseUrl}...`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          source_code: toBase64(content),
          language_id: languageId,
          stdin: toBase64(stdin),
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`[Compiler] Success on ${baseUrl}`);
        // Decode results from Base64
        const stdout = fromBase64(result.stdout);
        const stderr = fromBase64(result.stderr);
        const compile_output = fromBase64(result.compile_output);

        return res.json({
          stdout: stdout,
          stderr: stderr || compile_output || '',
          exitCode: result.status?.id === 3 ? 0 : (result.status?.id || 1),
          status: result.status?.description || 'Unknown',
          time: result.time,
          memory: result.memory
        });
      } else {
        console.warn(`[Compiler] ${baseUrl} returned ${response.status}`);
        lastError = `Status ${response.status}: ${result.message || 'Error'}`;
      }
    } catch (error) {
      console.warn(`[Compiler] ${baseUrl} failed: ${error.message}`);
      lastError = error.message;
    }
  }

  res.status(500).json({ 
    error: `All code execution engines are currently unavailable. Last error: ${lastError}` 
  });
});

module.exports = router;
