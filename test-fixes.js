const { chromium } = require('playwright');

async function testFixes() {
  console.log('🔧 Testing Staff Duplication and Edge Function Fixes...');
  
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
    
    // Step 3: Count staff - should be 9 (matching database)
    const initialCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 Initial staff count: ${initialCount} (expected: 9)`);
    
    if (initialCount === 9) {
      console.log('✅ Staff count matches database - no duplication');
    } else {
      console.log('❌ Staff count mismatch - duplication issue may persist');
    }
    
    // Step 4: Test Force Refresh multiple times
    console.log('🔄 Testing Force Refresh (1/3)...');
    await page.click('button:has-text("Force Refresh")');
    await page.waitForTimeout(4000);
    
    const afterRefresh1 = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 After Force Refresh 1: ${afterRefresh1}`);
    
    console.log('🔄 Testing Force Refresh (2/3)...');
    await page.click('button:has-text("Force Refresh")');
    await page.waitForTimeout(4000);
    
    const afterRefresh2 = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 After Force Refresh 2: ${afterRefresh2}`);
    
    console.log('🔄 Testing Force Refresh (3/3)...');
    await page.click('button:has-text("Force Refresh")');
    await page.waitForTimeout(4000);
    
    const afterRefresh3 = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 After Force Refresh 3: ${afterRefresh3}`);
    
    // Step 5: Test navigation persistence
    console.log('🏠 Testing navigation...');
    await page.click('text=Home');
    await page.waitForTimeout(2000);
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    const afterNavigation = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 After navigation: ${afterNavigation}`);
    
    // Step 6: Count staff without login accounts
    const staffWithoutLogin = await page.$$eval('span:has-text("No login")', (elements) => elements.length);
    console.log(`👤 Staff without login accounts: ${staffWithoutLogin} (expected: 5)`);
    
    // Step 7: Test Create Login if available
    if (staffWithoutLogin > 0) {
      console.log('🔧 Testing Create Login functionality...');
      
      const createLoginButtons = await page.$$('button[aria-label="Create login account"]');
      
      if (createLoginButtons.length > 0) {
        console.log('➕ Clicking Create Login button...');
        
        // Set up dialog handler before clicking
        let alertMessage = '';
        page.on('dialog', async dialog => {
          alertMessage = dialog.message();
          console.log('📢 Alert:', alertMessage.substring(0, 100) + '...');
          await dialog.accept();
        });
        
        await createLoginButtons[0].click();
        await page.waitForTimeout(8000); // Wait for Edge Function call
        
        // Check if alert appeared (success)
        if (alertMessage.includes('Login created successfully')) {
          console.log('✅ Login creation successful!');
          
          // Verify staff count didn't change (no duplication)
          const afterCreateLogin = await page.$$eval('div:has-text("@")', (elements) => elements.length);
          console.log(`📊 After create login: ${afterCreateLogin}`);
          
          if (afterCreateLogin === afterNavigation) {
            console.log('✅ No duplication after create login');
          } else {
            console.log('❌ Duplication detected after create login');
          }
          
          // Check if "No login" count decreased
          const staffWithoutLoginAfter = await page.$$eval('span:has-text("No login")', (elements) => elements.length);
          console.log(`👤 Staff without login after creation: ${staffWithoutLoginAfter}`);
          
          if (staffWithoutLoginAfter < staffWithoutLogin) {
            console.log('✅ Login account successfully created and reflected in UI');
          } else {
            console.log('❌ Login creation may have failed or UI not updated');
          }
        } else if (alertMessage.includes('Failed')) {
          console.log('❌ Login creation failed:', alertMessage);
        } else {
          console.log('⚠️ No alert received - may still be processing');
        }
      } else {
        console.log('❌ No Create Login buttons found');
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test-fixes-final.png', fullPage: true });
    
    // Results
    console.log('\n🎯 FIXES TEST RESULTS:');
    console.log('=======================');
    console.log(`Expected staff count: 9`);
    console.log(`Initial count: ${initialCount}`);
    console.log(`After Force Refresh 1: ${afterRefresh1}`);
    console.log(`After Force Refresh 2: ${afterRefresh2}`);
    console.log(`After Force Refresh 3: ${afterRefresh3}`);
    console.log(`After navigation: ${afterNavigation}`);
    
    const allCountsCorrect = [initialCount, afterRefresh1, afterRefresh2, afterRefresh3, afterNavigation].every(count => count === 9);
    
    if (allCountsCorrect) {
      console.log('\n🎉 ALL FIXES WORKING PERFECTLY!');
      console.log('✅ No duplication issues');
      console.log('✅ Force Refresh works correctly');
      console.log('✅ Navigation persistence works');
    } else {
      console.log('\n❌ SOME ISSUES REMAIN:');
      if (initialCount !== 9) console.log('   → Initial count wrong');
      if (afterRefresh1 !== 9 || afterRefresh2 !== 9 || afterRefresh3 !== 9) console.log('   → Force Refresh issues');
      if (afterNavigation !== 9) console.log('   → Navigation issues');
    }
    
    console.log('\n⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-fixes-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testFixes().catch(console.error);