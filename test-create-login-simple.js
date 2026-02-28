const { chromium } = require('playwright');

async function testCreateLoginSimple() {
  console.log('🔧 SIMPLE CREATE LOGIN TEST');
  console.log('===========================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 3000
  });
  
  const page = await browser.newPage();
  
  try {
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
    await page.waitForTimeout(4000);
    
    // Look for Create Login buttons
    const createButtons = await page.$$('button[aria-label="Create login account"]');
    console.log(`🔍 Found ${createButtons.length} Create Login buttons`);
    
    if (createButtons.length > 0) {
      console.log('➕ Attempting to create login account...');
      
      let alertMessage = '';
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        console.log('\n📢 ALERT MESSAGE:');
        console.log('================');
        console.log(alertMessage);
        console.log('================\n');
        await dialog.accept();
      });
      
      await createButtons[0].click();
      console.log('⏳ Waiting for Edge Function response...');
      await page.waitForTimeout(15000);
      
      if (alertMessage) {
        if (alertMessage.includes('Login created successfully')) {
          console.log('✅ SUCCESS! User account created in Supabase Auth');
        } else if (alertMessage.includes('401')) {
          console.log('❌ HTTP 401 - Authentication failed');
          console.log('💡 The Edge Function is rejecting our JWT token');
        } else if (alertMessage.includes('404')) {
          console.log('❌ HTTP 404 - Edge Function not found');
        } else if (alertMessage.includes('500')) {
          console.log('❌ HTTP 500 - Server error in Edge Function');
        } else {
          console.log('❌ Other error occurred');
        }
      } else {
        console.log('⚠️ No alert received - function may have failed silently');
      }
    } else {
      console.log('ℹ️ No staff without login accounts found to test with');
    }
    
    await page.screenshot({ path: 'create-login-test.png', fullPage: true });
    
    console.log('\n⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'create-login-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testCreateLoginSimple().catch(console.error);