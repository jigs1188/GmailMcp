/**
 * Test sending email via MCP server
 */

import http from 'http';

const data = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'send_email',
    arguments: {
      to: 'parmarjigs372@gmail.com',
      subject: 'Test from MCP Server',
      body: 'Hello! This email was sent from your Gmail MCP Server running on localhost. It works!'
    }
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/message',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Response:', body);
    const result = JSON.parse(body);
    if (result.result?.content?.[0]?.text) {
      console.log('\nEmail Result:', result.result.content[0].text);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();
