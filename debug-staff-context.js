const { chromium } = require('playwright');

async function debugStaffContext() {
  console.log('🔍 Debugging Staff Context and Data Flow...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.text().includes('[StaffContext]') || msg.text().includes('[Staff]')) {
        console.log('🖥️ Browser:', msg.text());
      }
    });
    
    console.log('📱 Opening app...');
    await page.goto('http://localhost:5176/');
    await page.waitForTimeout(3000);
    
    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });
    
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
    await page.waitForTimeout(5000); // Give time for logs
    
    // Get the actual staff data from the React context
    const staffData = await page.evaluate(() => {
      // Try to access the staff data from the global context
      const staffElements = document.querySelectorAll('[class*="bg-gray-800"]');
      const emailElements = document.querySelectorAll('div:has-text("@")');
      
      return {
        staffElementsCount: staffElements.length,
        emailElementsCount: emailElements.length,
        allStaffElements: Array.from(staffElements).map(el => ({
          text: el.textContent?.substring(0, 100),
          className: el.className
        })),
        allEmailElements: Array.from(emailElements).map(el => ({
          text: el.textContent?.substring(0, 100),
          className: el.className
        }))
      };
    });
    
    console.log('\n📊 DEBUGGING RESULTS:');
    console.log('=====================');
    console.log(`Staff elements (.bg-gray-800): ${staffData.staffElementsCount}`);
    console.log(`Email elements (div:has-text("@")): ${staffData.emailElementsCount}`);
    
    console.log('\n📝 Staff Elements:');
    staffData.allStaffElements.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.text}`);
    });
    
    console.log('\n📧 Email Elements:');
    staffData.allEmailElements.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.text}`);
    });
    
    // Take screenshot for visual inspection
    await page.screenshot({ path: 'debug-staff-page.png', fullPage: true });
    
    console.log('\n📸 Screenshot saved: debug-staff-page.png');
    console.log('⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

debugStaffContext().catch(console.error);