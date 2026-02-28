const { chromium } = require('playwright');

async function testCleanStart() {
  console.log('🧹 Testing with Clean Start (clearing cache)...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate and clear localStorage
    console.log('📱 Opening app and clearing cache...');
    await page.goto('http://localhost:5176/');
    
    // Clear localStorage to remove any cached duplicates
    await page.evaluate(() => {
      localStorage.clear();
      console.log('Cleared localStorage');
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
    
    // Step 2: Navigate to Staff page
    console.log('📋 Navigating to Staff page...');
    await page.click('text=Staff');
    await page.waitForTimeout(4000); // Give more time for fresh load
    
    // Step 3: Count staff - should be 9 now
    const staffCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 Staff count after clean start: ${staffCount} (expected: 9)`);
    
    if (staffCount === 9) {
      console.log('✅ PERFECT! Staff count matches database - duplication fixed!');
    } else {
      console.log('❌ Still showing wrong count - need to investigate further');
    }
    
    // Step 4: Test Force Refresh
    console.log('🔄 Testing Force Refresh...');
    await page.click('button:has-text("Force Refresh")');
    await page.waitForTimeout(4000);
    
    const afterRefreshCount = await page.$$eval('div:has-text("@")', (elements) => elements.length);
    console.log(`📊 After Force Refresh: ${afterRefreshCount}`);
    
    if (afterRefreshCount === staffCount) {
      console.log('✅ Force Refresh maintains correct count!');
    } else {
      console.log('❌ Force Refresh changed the count');
    }
    
    // Step 5: Count staff without login
    const withoutLogin = await page.$$eval('span:has-text("No login")', (elements) => elements.length);
    console.log(`👤 Staff without login: ${withoutLogin} (expected: 5)`);
    
    // Step 6: Test Create Login with better error handling
    if (withoutLogin > 0) {
      console.log('🔧 Testing Create Login with improved authentication...');
      
      const createButtons = await page.$$('button[aria-label="Create login account"]');
      
      if (createButtons.length > 0) {
        console.log('➕ Attempting to create login account...');
        
        let alertMessage = '';
        page.on('dialog', async dialog => {
          alertMessage = dialog.message();
          console.log('📢 Alert received:', alertMessage.substring(0, 150));
          await dialog.accept();
        });
        
        await createButtons[0].click();
        await page.waitForTimeout(10000); // Wait longer for Edge Function
        
        if (alertMessage.includes('Login created successfully')) {
          console.log('✅ Login creation successful!');
          
          const withoutLoginAfter = await page.$$eval('span:has-text("No login")', (elements) => elements.length);
          console.log(`👤 Staff without login after creation: ${withoutLoginAfter}`);
          
          if (withoutLoginAfter < withoutLogin) {
            console.log('✅ Login count correctly decreased!');
          }
        } else if (alertMessage) {
          console.log('❌ Login creation failed:', alertMessage);
        } else {
          console.log('⚠️ No response - may still be processing or failed silently');
        }
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test-clean-final.png', fullPage: true });
    
    console.log('\n🎯 CLEAN START TEST RESULTS:');
    console.log('=============================');
    console.log(`Staff count: ${staffCount} (expected: 9) - ${staffCount === 9 ? '✅ CORRECT' : '❌ WRONG'}`);
    console.log(`Force Refresh: ${afterRefreshCount === staffCount ? '✅ WORKING' : '❌ BROKEN'}`);
    console.log(`Staff without login: ${withoutLogin} (expected: 5) - ${withoutLogin === 5 ? '✅ CORRECT' : '❌ WRONG'}`);
    
    if (staffCount === 9 && afterRefreshCount === staffCount) {
      console.log('\n🎉 DUPLICATION ISSUE FIXED!');
      console.log('✅ Staff persistence working correctly');
      console.log('✅ Force Refresh working correctly');
    } else {
      console.log('\n❌ Issues still remain - need further investigation');
    }
    
    console.log('\n⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-clean-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testCleanStart().catch(console.error);