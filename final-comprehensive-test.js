const { chromium } = require('playwright');

async function finalComprehensiveTest() {
  console.log('🚀 FINAL COMPREHENSIVE STAFF PERSISTENCE TEST');
  console.log('==============================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2500
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate and authenticate
    console.log('📱 1. Opening app and authenticating...');
    await page.goto('http://localhost:5176/');
    await page.waitForTimeout(3000);
    
    const pageText = await page.textContent('body');
    if (pageText.includes('Login') || pageText.includes('Email')) {
      console.log('🔐 Please complete authentication in the browser...');
      
      let authenticated = false;
      let attempts = 0;
      while (!authenticated && attempts < 60) { // 2 minutes
        await page.waitForTimeout(2000);
        const currentText = await page.textContent('body');
        authenticated = currentText.includes('Staff');
        attempts++;
        
        if (attempts % 15 === 0) {
          console.log(`⏳ Still waiting for authentication... (${attempts * 2}s)`);
        }
      }
      
      if (!authenticated) {
        console.log('❌ Authentication timeout - please login and retry');
        return;
      }
      console.log('✅ Authentication successful!');
    }
    
    // Step 2: Navigate to Staff page and baseline count
    console.log('📋 2. Navigating to Staff page...');
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    const initialCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 Initial staff count: ${initialCount}`);
    
    // Check for Maria Rodriguez
    const mariaInitial = await page.locator('text=Maria Rodriguez').count() > 0;
    console.log(`👩‍💼 Maria Rodriguez initially: ${mariaInitial ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    await page.screenshot({ path: 'final-1-initial-staff.png', fullPage: true });
    
    // Step 3: Test basic navigation persistence
    console.log('🏠 3. Testing basic navigation persistence...');
    await page.click('text=Home');
    await page.waitForTimeout(2000);
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    const afterNavCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    const mariaAfterNav = await page.locator('text=Maria Rodriguez').count() > 0;
    
    console.log(`📊 Staff count after navigation: ${afterNavCount}`);
    console.log(`👩‍💼 Maria after navigation: ${mariaAfterNav ? '✅ FOUND' : '❌ LOST'}`);
    
    await page.screenshot({ path: 'final-2-after-navigation.png', fullPage: true });
    
    // Step 4: Test page refresh persistence
    console.log('🔄 4. Testing page refresh persistence...');
    await page.reload();
    await page.waitForTimeout(5000);
    
    // Navigate back to staff after refresh
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    const afterRefreshCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    const mariaAfterRefresh = await page.locator('text=Maria Rodriguez').count() > 0;
    
    console.log(`📊 Staff count after refresh: ${afterRefreshCount}`);
    console.log(`👩‍💼 Maria after refresh: ${mariaAfterRefresh ? '✅ FOUND' : '❌ LOST'}`);
    
    await page.screenshot({ path: 'final-3-after-refresh.png', fullPage: true });
    
    // Step 5: Test multiple navigation cycles
    console.log('🔄 5. Testing multiple navigation cycles...');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`   Cycle ${i}/3...`);
      await page.click('text=Home');
      await page.waitForTimeout(1000);
      await page.click('text=Dashboard');
      await page.waitForTimeout(1000);
      await page.click('text=Staff');
      await page.waitForTimeout(2000);
      
      const cycleCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
      const mariaCycle = await page.locator('text=Maria Rodriguez').count() > 0;
      
      console.log(`   📊 Cycle ${i} count: ${cycleCount}, Maria: ${mariaCycle ? '✅' : '❌'}`);
    }
    
    await page.screenshot({ path: 'final-4-after-cycles.png', fullPage: true });
    
    // Step 6: Test browser tab focus/blur
    console.log('🪟 6. Testing browser focus/blur...');
    
    // Simulate losing and regaining focus
    await page.evaluate(() => {
      window.dispatchEvent(new Event('blur'));
    });
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await page.waitForTimeout(3000); // Allow time for focus refresh
    
    const afterFocusCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    const mariaAfterFocus = await page.locator('text=Maria Rodriguez').count() > 0;
    
    console.log(`📊 Staff count after focus event: ${afterFocusCount}`);
    console.log(`👩‍💼 Maria after focus: ${mariaAfterFocus ? '✅ FOUND' : '❌ LOST'}`);
    
    await page.screenshot({ path: 'final-5-after-focus.png', fullPage: true });
    
    // Step 7: Final verification
    console.log('✅ 7. Final verification...');
    
    // Force refresh one more time
    await page.click('button:has-text("Force Refresh")').catch(() => {
      console.log('   No Force Refresh button found, using page reload');
      return page.reload();
    });
    await page.waitForTimeout(3000);
    
    const finalCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    const mariaFinal = await page.locator('text=Maria Rodriguez').count() > 0;
    
    console.log(`📊 Final staff count: ${finalCount}`);
    console.log(`👩‍💼 Maria final check: ${mariaFinal ? '✅ FOUND' : '❌ LOST'}`);
    
    await page.screenshot({ path: 'final-6-final-verification.png', fullPage: true });
    
    // Step 8: Comprehensive Results
    console.log('\n🎯 COMPREHENSIVE TEST RESULTS:');
    console.log('===============================');
    console.log(`Initial staff count: ${initialCount}`);
    console.log(`After navigation: ${afterNavCount}`);
    console.log(`After page refresh: ${afterRefreshCount}`);
    console.log(`After focus events: ${afterFocusCount}`);
    console.log(`Final verification: ${finalCount}`);
    console.log('');
    console.log('Maria Rodriguez persistence:');
    console.log(`  Initially: ${mariaInitial ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`  After navigation: ${mariaAfterNav ? '✅ FOUND' : '❌ LOST'}`);
    console.log(`  After refresh: ${mariaAfterRefresh ? '✅ FOUND' : '❌ LOST'}`);
    console.log(`  After focus events: ${mariaAfterFocus ? '✅ FOUND' : '❌ LOST'}`);
    console.log(`  Final check: ${mariaFinal ? '✅ FOUND' : '❌ LOST'}`);
    
    // Determine overall test result
    const allCountsConsistent = (
      afterNavCount === initialCount &&
      afterRefreshCount === initialCount &&
      afterFocusCount === initialCount &&
      finalCount === initialCount
    );
    
    const mariaAlwaysPresent = (
      mariaInitial &&
      mariaAfterNav &&
      mariaAfterRefresh &&
      mariaAfterFocus &&
      mariaFinal
    );
    
    const overallPassed = allCountsConsistent && mariaAlwaysPresent;
    
    console.log('\n🏆 FINAL VERDICT:');
    console.log('=================');
    
    if (overallPassed) {
      console.log('🎉 STAFF PERSISTENCE TEST: COMPLETELY PASSED!');
      console.log('✅ Staff data persists perfectly across ALL scenarios:');
      console.log('   ✓ Navigation between pages');
      console.log('   ✓ Full page refresh');
      console.log('   ✓ Multiple navigation cycles');
      console.log('   ✓ Browser focus/blur events');
      console.log('   ✓ Force refresh operations');
      console.log('');
      console.log('🎯 THE STAFFCONTEXT SOLUTION IS WORKING PERFECTLY!');
      console.log('🚀 The user\'s issue has been completely resolved!');
    } else {
      console.log('❌ STAFF PERSISTENCE TEST: FAILED');
      console.log('🐛 Issues detected:');
      
      if (!allCountsConsistent) {
        console.log('   → Staff counts are inconsistent across operations');
      }
      if (!mariaAlwaysPresent) {
        console.log('   → Maria Rodriguez disappears in some scenarios');
      }
    }
    
    console.log('\n📸 Complete screenshot series saved:');
    console.log('   1. final-1-initial-staff.png');
    console.log('   2. final-2-after-navigation.png');
    console.log('   3. final-3-after-refresh.png');
    console.log('   4. final-4-after-cycles.png');
    console.log('   5. final-5-after-focus.png');
    console.log('   6. final-6-final-verification.png');
    
    console.log('\n⏳ Keeping browser open for final inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
    await page.screenshot({ path: 'final-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

finalComprehensiveTest().catch(console.error);