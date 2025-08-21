// Stack-level E2E tests for LuxDAO
const { test, expect } = require('@playwright/test');

test.describe('LuxDAO Stack E2E Tests', () => {
  test('Frontend loads successfully', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    // Check that page has content
    const content = await page.content();
    expect(content).toContain('html');
  });

  test('Anvil blockchain is accessible', async ({ request }) => {
    const response = await request.post('http://localhost:8545', {
      data: {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      }
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('result');
  });

  test('PostgreSQL is healthy', async ({ request }) => {
    // Check if postgres port is accessible
    const exec = require('child_process').execSync;
    const result = exec('docker exec luxdao-postgres pg_isready -U luxdao', { encoding: 'utf8' });
    expect(result).toContain('accepting connections');
  });

  test('Redis is healthy', async ({ request }) => {
    // Check if redis is accessible
    const exec = require('child_process').execSync;
    const result = exec('docker exec luxdao-redis redis-cli ping', { encoding: 'utf8' });
    expect(result.trim()).toBe('PONG');
  });

  test('IPFS is healthy', async ({ request }) => {
    // Check if IPFS is accessible via docker
    const exec = require('child_process').execSync;
    const result = exec('docker exec luxdao-ipfs ipfs id', { encoding: 'utf8' });
    expect(result).toContain('AgentVersion');
  });

  test('Contract deployment successful', async ({ request }) => {
    // Check if contracts are deployed by calling eth_getCode
    const response = await request.post('http://localhost:8545', {
      data: {
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: ['0x5FbDB2315678afecb367f032d93F642f64180aa3', 'latest'],
        id: 1
      }
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.result).not.toBe('0x');
  });

  test('Full stack integration', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Check if the app has loaded by looking for any button or link
    const hasInteractiveElements = await page.locator('button, a').count();
    expect(hasInteractiveElements).toBeGreaterThan(0);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/app-loaded.png' });
  });
});