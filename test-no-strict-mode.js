const { chromium } = require('playwright');

async function testNoStrictMode() {
  console.log('🔧 Testing without React StrictMode...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const page = await browser.newPage();
  
  try {
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('[StaffContext]')) {
        console.log('🖥️ Browser:', msg.text());
      }
    });
    
    console.log('📱 Opening app...');
    await page.goto('http://localhost:5176/');
    
    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    await page.waitForTimeout(3000);
    
    const pageText = await page.textContent('body');
    if (pageText.includes('Login') || pageText.includes('Email')) {
      console.log('🔐 Please login manually...');
      
      let authenticated = false;
      let attempts = 0;
      while (!authenticated && attempts < 30) {
        await page.waitForTimeout(2000);
        const currentText = await page.textContent('body');
        authenticated = currentText.includes('Staff');
        attempts++;
      }
      
      if (!authenticated) {
        console.log('❌ Authentication timeout');
        return;
      }
      console.log('✅ Authentication successful!');
    }
    
    console.log('📋 Navigating to Staff page...');
    await page.click('text=Staff');
    await page.waitForTimeout(4000);
    
    // Count staff using a valid CSS selector
    const staffCount = await page.evaluate(() => {
      // Count elements that contain email addresses (@ symbol)
      const allElements = document.querySelectorAll('*');
      let emailCount = 0;
      
      for (let element of allElements) {
        if (element.textContent && element.textContent.includes('@') && element.textContent.includes('.')) {
          // Make sure it's actually an email, not just any text with @
          const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
          if (emailPattern.test(element.textContent)) {
            emailCount++;
          }
        }
      }
      
      return emailCount;
    });
    
    console.log(`📊 Staff with emails found: ${staffCount}`);
    
    // Also count staff cards using a more specific selector
    const cardCount = await page.evaluate(() => {
      // Look for staff name elements (should be unique per staff member)
      const nameElements = document.querySelectorAll('h3.text-white.font-semibold');
      return nameElements.length;
    });
    
    console.log(`📊 Staff name elements found: ${cardCount}`);
    
    // Count staff without login
    const withoutLoginCount = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let count = 0;
      
      for (let element of elements) {
        if (element.textContent && element.textContent.includes('No login')) {
          count++;
        }
      }
      
      return count;
    });
    
    console.log(`👤 Staff without login: ${withoutLoginCount}`);
    
    // Test Force Refresh
    console.log('🔄 Testing Force Refresh...');
    await page.click('button:has-text("Force Refresh")');
    await page.waitForTimeout(4000);
    
    const cardCountAfterRefresh = await page.evaluate(() => {
      const nameElements = document.querySelectorAll('h3.text-white.font-semibold');
      return nameElements.length;
    });
    
    console.log(`📊 Staff count after Force Refresh: ${cardCountAfterRefresh}`);
    
    // Take screenshot
    await page.screenshot({ path: 'test-no-strict-mode.png', fullPage: true });
    
    console.log('\n🎯 NO STRICT MODE TEST RESULTS:');
    console.log('================================');
    console.log(`Staff with emails: ${staffCount} (expected: 4)`);
    console.log(`Staff name elements: ${cardCount} (expected: 9)`);
    console.log(`Staff without login: ${withoutLoginCount} (expected: 5)`);
    console.log(`After Force Refresh: ${cardCountAfterRefresh}`);
    
    if (cardCount === 9) {
      console.log('\n🎉 SUCCESS! Disabling StrictMode fixed the duplication!');
      console.log('✅ Staff count is now correct');
    } else {
      console.log('\n❌ Still showing wrong count - issue not related to StrictMode');
    }
    
    if (cardCountAfterRefresh === cardCount) {
      console.log('✅ Force Refresh maintains correct count');
    } else {
      console.log('❌ Force Refresh changes count');
    }
    
    console.log('\n⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-no-strict-mode-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testNoStrictMode().catch(console.error);