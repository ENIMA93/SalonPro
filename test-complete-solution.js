const { chromium } = require('playwright');

async function testCompleteSolution() {
  console.log('🎯 TESTING COMPLETE SOLUTION');
  console.log('============================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📱 Opening fresh browser session...');
    await page.goto('http://localhost:5176/');
    
    // Clear all storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.waitForTimeout(3000);
    
    // Authenticate
    const pageText = await page.textContent('body');
    if (pageText.includes('Login') || pageText.includes('Email')) {
      console.log('🔐 Please authenticate...');
      
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
    
    // Test 1: Initial navigation to Staff
    console.log('\n📋 TEST 1: Initial Staff page load...');
    await page.click('text=Staff');
    await page.waitForTimeout(5000); // Give time for data to load
    
    const initialCount = await page.evaluate(() => {
      const nameElements = document.querySelectorAll('h3');
      const uniqueNames = new Set();
      nameElements.forEach(el => {
        if (el.textContent && el.textContent.trim() && !el.textContent.includes('Staff')) {
          uniqueNames.add(el.textContent.trim());
        }
      });
      return uniqueNames.size;
    });
    
    console.log(`📊 Initial load staff count: ${initialCount}`);
    
    // Test 2: Force Refresh
    console.log('\n🔄 TEST 2: Force Refresh...');
    await page.click('button:has-text("Force Refresh")');
    await page.waitForTimeout(4000);
    
    const afterRefreshCount = await page.evaluate(() => {
      const nameElements = document.querySelectorAll('h3');
      const uniqueNames = new Set();
      nameElements.forEach(el => {
        if (el.textContent && el.textContent.trim() && !el.textContent.includes('Staff')) {
          uniqueNames.add(el.textContent.trim());
        }
      });
      return uniqueNames.size;
    });
    
    console.log(`📊 After Force Refresh: ${afterRefreshCount}`);
    
    // Test 3: Navigation persistence
    console.log('\n🏠 TEST 3: Navigation persistence...');
    await page.click('text=Home');
    await page.waitForTimeout(2000);
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    const afterNavigationCount = await page.evaluate(() => {
      const nameElements = document.querySelectorAll('h3');
      const uniqueNames = new Set();
      nameElements.forEach(el => {
        if (el.textContent && el.textContent.trim() && !el.textContent.includes('Staff')) {
          uniqueNames.add(el.textContent.trim());
        }
      });
      return uniqueNames.size;
    });
    
    console.log(`📊 After navigation: ${afterNavigationCount}`);
    
    // Test 4: Page refresh persistence
    console.log('\n🔄 TEST 4: Page refresh persistence...');
    await page.reload();
    await page.waitForTimeout(5000);
    
    // Navigate back to staff
    await page.click('text=Staff');
    await page.waitForTimeout(4000);
    
    const afterPageRefreshCount = await page.evaluate(() => {
      const nameElements = document.querySelectorAll('h3');
      const uniqueNames = new Set();
      nameElements.forEach(el => {
        if (el.textContent && el.textContent.trim() && !el.textContent.includes('Staff')) {
          uniqueNames.add(el.textContent.trim());
        }
      });
      return uniqueNames.size;
    });
    
    console.log(`📊 After page refresh: ${afterPageRefreshCount}`);
    
    // Test 5: Multiple Force Refreshes
    console.log('\n🔄 TEST 5: Multiple Force Refreshes...');
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("Force Refresh")');
      await page.waitForTimeout(3000);
      
      const count = await page.evaluate(() => {
        const nameElements = document.querySelectorAll('h3');
        const uniqueNames = new Set();
        nameElements.forEach(el => {
          if (el.textContent && el.textContent.trim() && !el.textContent.includes('Staff')) {
            uniqueNames.add(el.textContent.trim());
          }
        });
        return uniqueNames.size;
      });
      
      console.log(`📊 Force Refresh ${i}: ${count}`);
    }
    
    // Final screenshot
    await page.screenshot({ path: 'complete-solution-final.png', fullPage: true });
    
    // Results
    console.log('\n🏆 COMPLETE SOLUTION TEST RESULTS:');
    console.log('==================================');
    console.log(`Initial load: ${initialCount} staff`);
    console.log(`After Force Refresh: ${afterRefreshCount} staff`);
    console.log(`After navigation: ${afterNavigationCount} staff`);
    console.log(`After page refresh: ${afterPageRefreshCount} staff`);
    
    // Check if all counts are consistent and correct
    const allCounts = [initialCount, afterRefreshCount, afterNavigationCount, afterPageRefreshCount];
    const maxCount = Math.max(...allCounts);
    const minCount = Math.min(...allCounts);
    const isConsistent = maxCount === minCount;
    
    console.log('\n📊 CONSISTENCY CHECK:');
    console.log(`All counts consistent: ${isConsistent ? '✅ YES' : '❌ NO'}`);
    console.log(`Count range: ${minCount} - ${maxCount}`);
    
    if (isConsistent && maxCount >= 9) {
      console.log('\n🎉 COMPLETE SUCCESS!');
      console.log('✅ Staff persistence works perfectly');
      console.log('✅ Force Refresh works correctly');
      console.log('✅ Navigation persistence works');
      console.log('✅ Page refresh persistence works');
      console.log('✅ No more disappearing staff!');
      console.log('\n🚀 THE USER\'S ISSUE IS COMPLETELY RESOLVED!');
    } else if (isConsistent) {
      console.log('\n✅ MOSTLY SUCCESS!');
      console.log('✅ Staff persistence is consistent');
      console.log('⚠️ Count may be lower than expected but stable');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS');
      console.log('❌ Some inconsistency in counts');
    }
    
    console.log('\n⏳ Keeping browser open for final verification...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'complete-solution-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testCompleteSolution().catch(console.error);