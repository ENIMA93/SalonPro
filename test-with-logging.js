const { chromium } = require('playwright');

async function testWithLogging() {
  console.log('🔍 TESTING WITH DETAILED LOGGING');
  console.log('=================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const page = await browser.newPage();
  
  try {
    // Capture console logs from the page
    page.on('console', msg => {
      if (msg.text().includes('[Staff]') || msg.text().includes('Session') || msg.text().includes('Token')) {
        console.log('🖥️ Browser:', msg.text());
      }
    });
    
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
    
    console.log('📋 Navigating to Staff page...');
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    // Look for Create Login buttons
    const createButtons = await page.$$('button[aria-label="Create login account"]');
    console.log(`🔍 Found ${createButtons.length} Create Login buttons`);
    
    if (createButtons.length > 0) {
      console.log('➕ Testing Create Login with detailed logging...');
      
      let alertMessage = '';
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        console.log('\n📢 DETAILED ERROR MESSAGE:');
        console.log('==========================');
        console.log(alertMessage);
        console.log('==========================\n');
        await dialog.accept();
      });
      
      await createButtons[0].click();
      console.log('⏳ Waiting for Edge Function response with logging...');
      await page.waitForTimeout(15000);
      
      if (alertMessage) {
        console.log('\n🔍 ANALYSIS:');
        if (alertMessage.includes('Login created successfully')) {
          console.log('✅ SUCCESS! User account created successfully');
          
          // Verify the user was actually created in Supabase
          console.log('🔍 User should now appear in Supabase Dashboard → Authentication → Users');
        } else if (alertMessage.includes('JWT verification failed')) {
          console.log('❌ JWT VERIFICATION FAILED');
          console.log('💡 The Edge Function cannot verify our JWT token');
          console.log('🔧 Possible fixes:');
          console.log('   1. Sign out and sign in again');
          console.log('   2. Check if Edge Function has correct environment variables');
          console.log('   3. Verify Supabase project configuration');
        } else if (alertMessage.includes('401')) {
          console.log('❌ AUTHENTICATION ERROR (HTTP 401)');
          console.log('💡 The JWT token is being rejected');
        } else if (alertMessage.includes('403')) {
          console.log('❌ PERMISSION ERROR (HTTP 403)');
          console.log('💡 User is not an admin or profile check failed');
        } else if (alertMessage.includes('500')) {
          console.log('❌ SERVER ERROR (HTTP 500)');
          console.log('💡 Internal error in Edge Function');
        } else {
          console.log('❌ UNKNOWN ERROR');
          console.log('💡 Unexpected response from Edge Function');
        }
      } else {
        console.log('⚠️ No alert received - Edge Function may have failed silently');
      }
    } else {
      console.log('ℹ️ No staff without login accounts to test with');
    }
    
    await page.screenshot({ path: 'test-with-logging.png', fullPage: true });
    
    console.log('\n⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-with-logging-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testWithLogging().catch(console.error);