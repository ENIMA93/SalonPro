const { chromium } = require('playwright');

async function testAddStaffAndPersistence() {
  console.log('🚀 Starting Add Staff + Persistence Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to the app
    console.log('📱 Opening app at http://localhost:5176/');
    await page.goto('http://localhost:5176/');
    await page.waitForTimeout(3000);
    
    // Step 2: Check for authentication and navigate to Staff page
    const pageText = await page.textContent('body');
    if (pageText.includes('Login') || pageText.includes('Email')) {
      console.log('🔐 Please login manually in the browser...');
      
      // Wait for authentication
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
    await page.waitForTimeout(3000);
    
    // Step 3: Count initial staff
    console.log('🔍 Counting initial staff...');
    const initialCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 Initial staff count: ${initialCount}`);
    
    // Step 4: Add new staff member
    console.log('➕ Adding new staff member...');
    await page.click('text=Add Staff');
    await page.waitForTimeout(1000);
    
    // Fill form
    const testName = `Test Staff ${Date.now()}`;
    console.log(`👤 Creating staff: ${testName}`);
    
    await page.fill('input[placeholder*="name"], input[name="name"]', testName);
    await page.fill('input[placeholder*="role"], input[name="role"]', 'Barber');
    
    // The email and password should be auto-generated, so we just save
    await page.click('button:has-text("Save"), button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Step 5: Verify staff was added
    console.log('✅ Verifying staff was added...');
    const afterAddCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 Staff count after adding: ${afterAddCount}`);
    
    const newStaffExists = await page.locator(`text=${testName}`).count() > 0;
    console.log(`👤 New staff "${testName}" visible: ${newStaffExists ? '✅ YES' : '❌ NO'}`);
    
    // Take screenshot
    await page.screenshot({ path: 'staff-after-adding.png', fullPage: true });
    
    // Step 6: Navigate away and back
    console.log('🏠 Testing navigation persistence...');
    await page.click('text=Home');
    await page.waitForTimeout(2000);
    
    await page.click('text=Staff');
    await page.waitForTimeout(2000);
    
    const afterNavCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    const staffExistsAfterNav = await page.locator(`text=${testName}`).count() > 0;
    
    console.log(`📊 Staff count after navigation: ${afterNavCount}`);
    console.log(`👤 New staff after navigation: ${staffExistsAfterNav ? '✅ FOUND' : '❌ LOST'}`);
    
    // Step 7: Test page refresh
    console.log('🔄 Testing page refresh persistence...');
    await page.reload();
    await page.waitForTimeout(5000);
    
    // Navigate back to staff
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    const afterRefreshCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    const staffExistsAfterRefresh = await page.locator(`text=${testName}`).count() > 0;
    
    console.log(`📊 Staff count after refresh: ${afterRefreshCount}`);
    console.log(`👤 New staff after refresh: ${staffExistsAfterRefresh ? '✅ FOUND' : '❌ LOST'}`);
    
    // Final screenshot
    await page.screenshot({ path: 'staff-final-state.png', fullPage: true });
    
    // Results
    console.log('\n🎯 TEST RESULTS:');
    console.log('================');
    console.log(`Initial count: ${initialCount}`);
    console.log(`After adding: ${afterAddCount} (should be +1)`);
    console.log(`After navigation: ${afterNavCount} (should match after adding)`);
    console.log(`After refresh: ${afterRefreshCount} (should match after adding)`);
    console.log(`Staff persistence: ${staffExistsAfterNav && staffExistsAfterRefresh ? '✅ PASSED' : '❌ FAILED'}`);
    
    const testPassed = (
      afterAddCount === initialCount + 1 &&
      afterNavCount === afterAddCount &&
      afterRefreshCount === afterAddCount &&
      staffExistsAfterNav &&
      staffExistsAfterRefresh
    );
    
    if (testPassed) {
      console.log('\n🎉 COMPLETE TEST: PASSED!');
      console.log('✅ Staff can be added and persists across navigation and refresh');
    } else {
      console.log('\n❌ COMPLETE TEST: FAILED!');
      console.log('🐛 Staff persistence issue detected');
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testAddStaffAndPersistence().catch(console.error);