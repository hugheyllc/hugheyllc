import { chromium } from 'playwright';

(async () => {
  console.log('Starting client-requests form test...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('https://hugheyllc.com/client-requests', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded');
    
    // Enter access code (checking if it asks for one)
    const authInput = await page.$('#authPassword');
    if (authInput) {
      console.log('Auth gate detected');
      await authInput.fill('hughey2025');
      await page.click('#authForm button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(500);
    }
    
    // Fill form
    console.log('Filling form...');
    await page.fill('#clientName', 'Test Firm LLC');
    await page.fill('#email', 'test@example.com');
    await page.fill('#phone', '727-483-3222');
    await page.selectOption('#requestType', 'Website Update');
    await page.fill('#description', 'This is a test submission to verify the client request portal is working correctly.');
    await page.selectOption('#priority', 'normal');
    
    console.log('Submitting form...');
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/client-requests')),
      page.click('#submitBtn')
    ]);
    
    const respBody = await response.json();
    console.log('Response status:', response.status());
    console.log('Response body:', JSON.stringify(respBody, null, 2));
    
    if (respBody.success) {
      console.log('\n✅ SUCCESS — Form submitted with ticket:', respBody.ticket_id);
      process.exit(0);
    } else {
      console.error('\n❌ FAILED — Error:', respBody.error);
      process.exit(1);
    }
  } catch (err) {
    console.error('Test error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
