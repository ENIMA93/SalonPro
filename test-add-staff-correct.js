const { chromium } = require('playwright');

async function testAddStaffCorrect() {
  console.log('🚀 Starting Corrected Add Staff + Persistence Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate and authenticate
    console.log('📱 Opening app...');
    await page.goto('http://localhost:5176/');
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
    
    // Step 2: Navigate to Staff page
    console.log('📋 Navigating to Staff page...');
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    // Step 3: Count initial staff
    console.log('🔍 Counting initial staff...');
    const initialCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 Initial staff count: ${initialCount}`);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'add-test-1-initial.png', fullPage: true });
    
    // Step 4: Click Add Staff
    console.log('➕ Opening Add Staff modal...');
    await page.click('text=Add Staff');
    await page.waitForTimeout(2000);
    
    // Take screenshot of modal
    await page.screenshot({ path: 'add-test-2-modal.png', fullPage: true });
    
    // Step 5: Fill form correctly
    const testName = `Test User ${Date.now()}`;
    console.log(`👤 Creating staff: ${testName}`);
    
    // Fill name field (this should be editable)
    await page.fill('input[placeholder="e.g. Ahmed"]', testName);
    await page.waitForTimeout(500);
    
    // Fill role field (this should be editable)
    await page.fill('input[placeholder="e.g. Stylist, Barber"]', 'Test Barber');
    await page.waitForTimeout(500);
    
    // Email and password should auto-generate, so we just submit
    console.log('💾 Submitting form...');
    await page.click('button:has-text("Save")');
    
    // Wait for success screen or error
    await page.waitForTimeout(5000);
    
    // Take screenshot after submission
    await page.screenshot({ path: 'add-test-3-after-submit.png', fullPage: true });
    
    // Check if we see success screen
    const successVisible = await page.locator('text=has been successfully added').count() > 0;
    
    if (successVisible) {
      console.log('✅ Success screen visible');
      
      // Click Done to close success screen
      await page.click('button:has-text("Done")');
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ No success screen - checking for errors...');
      const errorText = await page.textContent('body');
      if (errorText.includes('error') || errorText.includes('Error')) {
        console.log('❌ Error detected in form submission');
      }
    }
    
    // Step 6: Verify staff was added
    console.log('✅ Verifying staff was added...');
    await page.waitForTimeout(2000);
    
    const afterAddCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 Staff count after adding: ${afterAddCount}`);
    
    const newStaffExists = await page.locator(`text=${testName}`).count() > 0;
    console.log(`👤 New staff "${testName}" visible: ${newStaffExists ? '✅ YES' : '❌ NO'}`);
    
    // Take screenshot after adding
    await page.screenshot({ path: 'add-test-4-after-adding.png', fullPage: true });
    
    // Step 7: Test navigation persistence
    console.log('🏠 Testing navigation persistence...');
    await page.click('text=Home');
    await page.waitForTimeout(2000);
    
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    const afterNavCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    const staffExistsAfterNav = await page.locator(`text=${testName}`).count() > 0;
    
    console.log(`📊 Staff count after navigation: ${afterNavCount}`);
    console.log(`👤 New staff after navigation: ${staffExistsAfterNav ? '✅ FOUND' : '❌ LOST'}`);
    
    // Take screenshot after navigation
    await page.screenshot({ path: 'add-test-5-after-nav.png', fullPage: true });
    
    // Step 8: Test page refresh persistence
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
    await page.screenshot({ path: 'add-test-6-final.png', fullPage: true });
    
    // Step 9: Results
    console.log('\n🎯 ADD STAFF + PERSISTENCE TEST RESULTS:');
    console.log('=========================================');
    console.log(`Initial count: ${initialCount}`);
    console.log(`After adding: ${afterAddCount} (expected: ${initialCount + 1})`);
    console.log(`After navigation: ${afterNavCount} (expected: ${afterAddCount})`);
    console.log(`After refresh: ${afterRefreshCount} (expected: ${afterAddCount})`);
    console.log(`Staff creation: ${newStaffExists ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Navigation persistence: ${staffExistsAfterNav ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Refresh persistence: ${staffExistsAfterRefresh ? '✅ PASSED' : '❌ FAILED'}`);
    
    const testPassed = (
      newStaffExists &&
      afterAddCount > initialCount &&
      afterNavCount === afterAddCount &&
      afterRefreshCount === afterAddCount &&
      staffExistsAfterNav &&
      staffExistsAfterRefresh
    );
    
    if (testPassed) {
      console.log('\n🎉 COMPLETE ADD STAFF + PERSISTENCE TEST: PASSED!');
      console.log('✅ New staff can be added and persists perfectly across all scenarios');
    } else {
      console.log('\n❌ ADD STAFF + PERSISTENCE TEST: FAILED!');
      console.log('🐛 Issues detected:');
      if (!newStaffExists) {
        console.log('   → Staff creation failed');
      }
      if (afterNavCount !== afterAddCount) {
        console.log('   → Staff count changed after navigation');
      }
      if (afterRefreshCount !== afterAddCount) {
        console.log('   → Staff count changed after refresh');
      }
      if (!staffExistsAfterNav) {
        console.log('   → New staff disappeared after navigation');
      }
      if (!staffExistsAfterRefresh) {
        console.log('   → New staff disappeared after refresh');
      }
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('   1. add-test-1-initial.png - Initial staff page');
    console.log('   2. add-test-2-modal.png - Add staff modal');
    console.log('   3. add-test-3-after-submit.png - After form submission');
    console.log('   4. add-test-4-after-adding.png - Staff page with new member');
    console.log('   5. add-test-5-after-nav.png - After navigation test');
    console.log('   6. add-test-6-final.png - Final state after refresh');
    
    console.log('\n⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'add-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testAddStaffCorrect().catch(console.error);