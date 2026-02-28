const { chromium } = require('playwright');

async function testStaffPersistence() {
  console.log('🚀 Starting Staff Persistence Test...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for visual confirmation
    slowMo: 1000 // Slow down for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to the app
    console.log('📱 Opening app at http://localhost:5176/');
    await page.goto('http://localhost:5176/');
    await page.waitForTimeout(3000);
    
    // Step 2: Check if we need to login (assuming you've already authenticated)
    console.log('🔐 Checking authentication state...');
    
    // Wait for either login form or staff page to load
    try {
      await page.waitForSelector('[data-testid="staff-page"], .staff-page, h1:has-text("Staff")', { timeout: 10000 });
      console.log('✅ Already authenticated, proceeding to staff page');
    } catch (e) {
      console.log('🔑 Need to navigate to staff page');
    }
    
    // Step 3: Navigate to Staff page
    console.log('📋 Navigating to Staff page...');
    await page.click('text=Staff').catch(() => {
      // Try alternative selectors
      return page.click('[href*="staff"], [data-tab="staff"], button:has-text("Staff")');
    });
    
    await page.waitForTimeout(2000);
    
    // Step 4: Count initial staff members
    console.log('🔍 Counting initial staff members...');
    await page.waitForSelector('.staff-card, [data-testid="staff-item"]', { timeout: 10000 });
    
    const initialStaffCount = await page.$$eval('.staff-card, [data-testid="staff-item"], .bg-gray-800', (elements) => {
      return elements.length;
    });
    
    console.log(`📊 Found ${initialStaffCount} staff members initially`);
    
    // Step 5: Look for Maria Rodriguez specifically
    console.log('👩‍💼 Looking for Maria Rodriguez...');
    const mariaExists = await page.locator('text=Maria Rodriguez').count() > 0;
    
    if (mariaExists) {
      console.log('✅ Maria Rodriguez found in staff list');
    } else {
      console.log('❌ Maria Rodriguez NOT found in staff list');
    }
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'staff-before-navigation.png', fullPage: true });
    console.log('📸 Screenshot saved: staff-before-navigation.png');
    
    // Step 6: Navigate away from Staff page
    console.log('🏠 Navigating to Home page...');
    await page.click('text=Home').catch(() => {
      return page.click('[href*="home"], [data-tab="home"], button:has-text("Home")');
    });
    
    await page.waitForTimeout(2000);
    
    // Step 7: Navigate back to Staff page
    console.log('📋 Navigating back to Staff page...');
    await page.click('text=Staff').catch(() => {
      return page.click('[href*="staff"], [data-tab="staff"], button:has-text("Staff")');
    });
    
    await page.waitForTimeout(3000);
    
    // Step 8: Count staff members after navigation
    console.log('🔍 Counting staff members after navigation...');
    const afterNavStaffCount = await page.$$eval('.staff-card, [data-testid="staff-item"], .bg-gray-800', (elements) => {
      return elements.length;
    });
    
    console.log(`📊 Found ${afterNavStaffCount} staff members after navigation`);
    
    // Step 9: Check if Maria Rodriguez still exists
    const mariaExistsAfterNav = await page.locator('text=Maria Rodriguez').count() > 0;
    
    if (mariaExistsAfterNav) {
      console.log('✅ Maria Rodriguez still found after navigation');
    } else {
      console.log('❌ Maria Rodriguez DISAPPEARED after navigation');
    }
    
    // Take screenshot after navigation
    await page.screenshot({ path: 'staff-after-navigation.png', fullPage: true });
    console.log('📸 Screenshot saved: staff-after-navigation.png');
    
    // Step 10: THE CRITICAL TEST - Page refresh
    console.log('🔄 CRITICAL TEST: Refreshing the page...');
    await page.reload();
    await page.waitForTimeout(5000);
    
    // Navigate back to staff page after refresh
    console.log('📋 Navigating to Staff page after refresh...');
    try {
      await page.click('text=Staff', { timeout: 10000 });
    } catch (e) {
      console.log('🔑 May need to re-authenticate after refresh');
      // Handle re-authentication if needed
    }
    
    await page.waitForTimeout(3000);
    
    // Step 11: Final count and Maria check
    console.log('🔍 Final count after page refresh...');
    const finalStaffCount = await page.$$eval('.staff-card, [data-testid="staff-item"], .bg-gray-800', (elements) => {
      return elements.length;
    });
    
    console.log(`📊 Found ${finalStaffCount} staff members after refresh`);
    
    const mariaExistsAfterRefresh = await page.locator('text=Maria Rodriguez').count() > 0;
    
    if (mariaExistsAfterRefresh) {
      console.log('✅ Maria Rodriguez SURVIVED page refresh!');
    } else {
      console.log('❌ Maria Rodriguez DISAPPEARED after page refresh');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'staff-after-refresh.png', fullPage: true });
    console.log('📸 Screenshot saved: staff-after-refresh.png');
    
    // Step 12: Results Summary
    console.log('\n🎯 TEST RESULTS SUMMARY:');
    console.log('========================');
    console.log(`Initial staff count: ${initialStaffCount}`);
    console.log(`After navigation: ${afterNavStaffCount}`);
    console.log(`After refresh: ${finalStaffCount}`);
    console.log(`Maria Rodriguez initially: ${mariaExists ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`Maria Rodriguez after navigation: ${mariaExistsAfterNav ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`Maria Rodriguez after refresh: ${mariaExistsAfterRefresh ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    // Determine overall test result
    const testPassed = (
      initialStaffCount > 0 &&
      afterNavStaffCount === initialStaffCount &&
      finalStaffCount === initialStaffCount &&
      mariaExists &&
      mariaExistsAfterNav &&
      mariaExistsAfterRefresh
    );
    
    if (testPassed) {
      console.log('\n🎉 STAFF PERSISTENCE TEST: PASSED!');
      console.log('✅ Staff data persists correctly across navigation and page refresh');
    } else {
      console.log('\n❌ STAFF PERSISTENCE TEST: FAILED!');
      console.log('🐛 Staff data is not persisting correctly');
      
      if (!mariaExistsAfterNav) {
        console.log('   → Issue: Data disappears after navigation');
      }
      if (!mariaExistsAfterRefresh) {
        console.log('   → Issue: Data disappears after page refresh');
      }
      if (finalStaffCount !== initialStaffCount) {
        console.log('   → Issue: Staff count changed');
      }
    }
    
    console.log('\n📸 Screenshots saved for review:');
    console.log('   - staff-before-navigation.png');
    console.log('   - staff-after-navigation.png');
    console.log('   - staff-after-refresh.png');
    
    // Wait for user to see results
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: test-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testStaffPersistence().catch(console.error);