const { chromium } = require('playwright');

async function testWithAuth() {
  console.log('🚀 Starting comprehensive test with authentication...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to app
    console.log('📱 Opening app...');
    await page.goto('http://localhost:5176/');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'step1-initial.png', fullPage: true });
    console.log('📸 Initial page screenshot saved');
    
    // Step 2: Check what's on the page
    const pageText = await page.textContent('body');
    console.log('📄 Page contains login form:', pageText.includes('Login') || pageText.includes('Email'));
    console.log('📄 Page contains staff link:', pageText.includes('Staff'));
    console.log('📄 Page contains sidebar:', pageText.includes('Home') && pageText.includes('Dashboard'));
    
    // Step 3: If we see a login form, we need to authenticate
    if (pageText.includes('Login') || pageText.includes('Email')) {
      console.log('🔐 Login form detected - authentication required');
      console.log('⚠️  Please login manually in the browser window that opened');
      console.log('⚠️  Once logged in, the test will continue automatically...');
      
      // Wait for authentication (look for sidebar or staff link)
      let authenticated = false;
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes
      
      while (!authenticated && attempts < maxAttempts) {
        await page.waitForTimeout(2000);
        const currentText = await page.textContent('body');
        authenticated = currentText.includes('Staff') && (currentText.includes('Home') || currentText.includes('Dashboard'));
        attempts++;
        
        if (attempts % 10 === 0) {
          console.log(`⏳ Waiting for authentication... (${attempts * 2}s elapsed)`);
        }
      }
      
      if (!authenticated) {
        console.log('❌ Authentication timeout - please login and run the test again');
        return;
      }
      
      console.log('✅ Authentication successful!');
    }
    
    // Step 4: Take screenshot after auth
    await page.screenshot({ path: 'step2-after-auth.png', fullPage: true });
    
    // Step 5: Navigate to Staff page
    console.log('📋 Navigating to Staff page...');
    
    // Try multiple selectors for Staff link
    const staffSelectors = [
      'text=Staff',
      'a:has-text("Staff")',
      'button:has-text("Staff")',
      '[href*="staff"]',
      'nav a:has-text("Staff")'
    ];
    
    let staffClicked = false;
    for (const selector of staffSelectors) {
      try {
        await page.click(selector, { timeout: 2000 });
        staffClicked = true;
        console.log(`✅ Clicked staff using selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ Failed with selector: ${selector}`);
      }
    }
    
    if (!staffClicked) {
      console.log('❌ Could not find Staff link');
      await page.screenshot({ path: 'error-no-staff-link.png', fullPage: true });
      return;
    }
    
    await page.waitForTimeout(3000);
    
    // Step 6: Take screenshot of staff page
    await page.screenshot({ path: 'step3-staff-page.png', fullPage: true });
    
    // Step 7: Count staff members using multiple selectors
    console.log('🔍 Counting staff members...');
    
    const staffSelectors2 = [
      '.bg-gray-800',
      '[data-testid="staff-item"]',
      '.staff-card',
      'div:has-text("Maria Rodriguez")',
      'div:has-text("@")', // Email indicators
    ];
    
    let staffCount = 0;
    let bestSelector = '';
    
    for (const selector of staffSelectors2) {
      try {
        const count = await page.$$eval(selector, elements => elements.length);
        if (count > staffCount) {
          staffCount = count;
          bestSelector = selector;
        }
        console.log(`📊 Selector "${selector}": ${count} elements`);
      } catch (e) {
        console.log(`❌ Selector "${selector}" failed`);
      }
    }
    
    console.log(`📊 Best count: ${staffCount} using selector: ${bestSelector}`);
    
    // Step 8: Look for Maria Rodriguez specifically
    const mariaSelectors = [
      'text=Maria Rodriguez',
      '*:has-text("Maria Rodriguez")',
      'div:has-text("Maria")'
    ];
    
    let mariaFound = false;
    for (const selector of mariaSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          mariaFound = true;
          console.log(`✅ Found Maria Rodriguez using: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Maria selector failed: ${selector}`);
      }
    }
    
    if (!mariaFound) {
      console.log('❌ Maria Rodriguez not found on staff page');
    }
    
    // Step 9: Test navigation persistence
    console.log('🏠 Testing navigation to Home and back...');
    await page.click('text=Home');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'step4-home-page.png', fullPage: true });
    
    // Navigate back to Staff
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'step5-staff-after-nav.png', fullPage: true });
    
    // Count again
    const staffCountAfterNav = await page.$$eval(bestSelector, elements => elements.length);
    console.log(`📊 Staff count after navigation: ${staffCountAfterNav}`);
    
    // Check Maria again
    let mariaAfterNav = false;
    for (const selector of mariaSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          mariaAfterNav = true;
          break;
        }
      } catch (e) {}
    }
    
    console.log(`👩‍💼 Maria after navigation: ${mariaAfterNav ? '✅ FOUND' : '❌ LOST'}`);
    
    // Step 10: Test page refresh persistence
    console.log('🔄 Testing page refresh...');
    await page.reload();
    await page.waitForTimeout(5000);
    
    // Navigate back to Staff after refresh
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'step6-staff-after-refresh.png', fullPage: true });
    
    // Final counts
    const staffCountAfterRefresh = await page.$$eval(bestSelector, elements => elements.length);
    console.log(`📊 Staff count after refresh: ${staffCountAfterRefresh}`);
    
    let mariaAfterRefresh = false;
    for (const selector of mariaSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          mariaAfterRefresh = true;
          break;
        }
      } catch (e) {}
    }
    
    console.log(`👩‍💼 Maria after refresh: ${mariaAfterRefresh ? '✅ FOUND' : '❌ LOST'}`);
    
    // Step 11: Results
    console.log('\n🎯 COMPREHENSIVE TEST RESULTS:');
    console.log('===============================');
    console.log(`Initial staff count: ${staffCount}`);
    console.log(`After navigation: ${staffCountAfterNav}`);
    console.log(`After refresh: ${staffCountAfterRefresh}`);
    console.log(`Maria Rodriguez initially: ${mariaFound ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`Maria Rodriguez after navigation: ${mariaAfterNav ? '✅ FOUND' : '❌ LOST'}`);
    console.log(`Maria Rodriguez after refresh: ${mariaAfterRefresh ? '✅ FOUND' : '❌ LOST'}`);
    
    const testPassed = (
      staffCount > 0 &&
      staffCountAfterNav === staffCount &&
      staffCountAfterRefresh === staffCount &&
      mariaFound &&
      mariaAfterNav &&
      mariaAfterRefresh
    );
    
    if (testPassed) {
      console.log('\n🎉 STAFF PERSISTENCE TEST: PASSED!');
      console.log('✅ All staff data persists correctly across navigation and refresh');
    } else {
      console.log('\n❌ STAFF PERSISTENCE TEST: FAILED!');
      console.log('🐛 Issues detected:');
      if (staffCountAfterNav !== staffCount) {
        console.log('   → Staff count changed after navigation');
      }
      if (staffCountAfterRefresh !== staffCount) {
        console.log('   → Staff count changed after refresh');
      }
      if (!mariaAfterNav) {
        console.log('   → Maria Rodriguez disappeared after navigation');
      }
      if (!mariaAfterRefresh) {
        console.log('   → Maria Rodriguez disappeared after refresh');
      }
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('   1. step1-initial.png - Initial page load');
    console.log('   2. step2-after-auth.png - After authentication');
    console.log('   3. step3-staff-page.png - Staff page first visit');
    console.log('   4. step4-home-page.png - Home page');
    console.log('   5. step5-staff-after-nav.png - Staff page after navigation');
    console.log('   6. step6-staff-after-refresh.png - Staff page after refresh');
    
    console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'test-error-final.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testWithAuth().catch(console.error);