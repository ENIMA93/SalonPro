const { chromium } = require('playwright');

async function testEdgeFunction() {
  console.log('🧪 Testing Edge Function and Force Refresh...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate and authenticate
    console.log('📱 Opening app and authenticating...');
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
    const initialCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 Initial staff count: ${initialCount}`);
    
    // Step 4: Test Force Refresh (this was causing staff to disappear)
    console.log('🔄 Testing Force Refresh...');
    await page.click('button:has-text("Force Refresh")');
    await page.waitForTimeout(5000); // Wait for refresh to complete
    
    const afterForceRefreshCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 Staff count after Force Refresh: ${afterForceRefreshCount}`);
    
    if (afterForceRefreshCount === initialCount) {
      console.log('✅ Force Refresh works correctly - staff count maintained');
    } else {
      console.log('❌ Force Refresh issue - staff count changed');
    }
    
    // Take screenshot after force refresh
    await page.screenshot({ path: 'test-after-force-refresh.png', fullPage: true });
    
    // Step 5: Look for staff without login accounts
    console.log('👤 Looking for staff without login accounts...');
    
    const staffWithoutLogin = await page.$$eval('span:has-text("No login")', (elements) => elements.length);
    console.log(`📊 Staff without login accounts: ${staffWithoutLogin}`);
    
    if (staffWithoutLogin > 0) {
      console.log('🔧 Found staff without login - testing Create Login button...');
      
      // Try to click the first "Create Login" button (UserPlus icon)
      const createLoginButtons = await page.$$('button[aria-label="Create login account"]');
      
      if (createLoginButtons.length > 0) {
        console.log('➕ Clicking Create Login button...');
        await createLoginButtons[0].click();
        
        // Wait for the operation to complete
        await page.waitForTimeout(10000);
        
        // Check if an alert appeared (success message)
        page.on('dialog', async dialog => {
          console.log('📢 Alert message:', dialog.message());
          await dialog.accept();
        });
        
        // Take screenshot after create login attempt
        await page.screenshot({ path: 'test-after-create-login.png', fullPage: true });
        
        // Check if the staff member now has login
        const staffWithoutLoginAfter = await page.$$eval('span:has-text("No login")', (elements) => elements.length);
        console.log(`📊 Staff without login after creation: ${staffWithoutLoginAfter}`);
        
        if (staffWithoutLoginAfter < staffWithoutLogin) {
          console.log('✅ Login account creation successful!');
        } else {
          console.log('❌ Login account creation may have failed');
        }
      } else {
        console.log('❌ No Create Login buttons found');
      }
    } else {
      console.log('ℹ️ All staff already have login accounts');
    }
    
    // Step 6: Test Force Refresh again after changes
    console.log('🔄 Testing Force Refresh again after changes...');
    await page.click('button:has-text("Force Refresh")');
    await page.waitForTimeout(5000);
    
    const finalCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 Final staff count: ${finalCount}`);
    
    // Final screenshot
    await page.screenshot({ path: 'test-final-state.png', fullPage: true });
    
    // Results
    console.log('\n🎯 EDGE FUNCTION & FORCE REFRESH TEST RESULTS:');
    console.log('===============================================');
    console.log(`Initial staff count: ${initialCount}`);
    console.log(`After first Force Refresh: ${afterForceRefreshCount}`);
    console.log(`Final staff count: ${finalCount}`);
    console.log(`Force Refresh working: ${(afterForceRefreshCount === initialCount && finalCount === initialCount) ? '✅ YES' : '❌ NO'}`);
    console.log(`Staff without login initially: ${staffWithoutLogin}`);
    
    const testPassed = (
      afterForceRefreshCount === initialCount &&
      finalCount === initialCount
    );
    
    if (testPassed) {
      console.log('\n🎉 FORCE REFRESH TEST: PASSED!');
      console.log('✅ Force Refresh no longer causes staff to disappear');
    } else {
      console.log('\n❌ FORCE REFRESH TEST: FAILED!');
      console.log('🐛 Force Refresh still has issues');
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('   1. test-after-force-refresh.png');
    console.log('   2. test-after-create-login.png');
    console.log('   3. test-final-state.png');
    
    console.log('\n⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-edge-function-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testEdgeFunction().catch(console.error);