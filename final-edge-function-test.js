const { chromium } = require('playwright');

async function finalEdgeFunctionTest() {
  console.log('🎯 FINAL EDGE FUNCTION TEST');
  console.log('===========================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
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
    await page.waitForTimeout(3000);
    
    // First, let's create a new staff member through the UI
    console.log('➕ Creating a new staff member through the UI...');
    await page.click('button:has-text("Add Staff")');
    await page.waitForTimeout(2000);
    
    // Fill in the form
    const testName = `Edge Test ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Ahmed"]', testName);
    await page.fill('input[placeholder="e.g. Stylist, Barber"]', 'Test Barber');
    
    // Capture any alerts during staff creation
    let staffCreationAlert = '';
    page.on('dialog', async dialog => {
      staffCreationAlert = dialog.message();
      console.log('📢 Staff Creation Alert:', staffCreationAlert.substring(0, 100));
      await dialog.accept();
    });
    
    // Submit the form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(8000); // Wait for staff creation
    
    if (staffCreationAlert.includes('successfully added')) {
      console.log('✅ New staff member created successfully');
      
      // Click Done to close the success screen
      await page.click('button:has-text("Done")');
      await page.waitForTimeout(2000);
      
      // Now look for Create Login buttons
      const createButtons = await page.$$('button[aria-label="Create login account"]');
      console.log(`🔍 Found ${createButtons.length} Create Login buttons`);
      
      if (createButtons.length > 0) {
        console.log('🔧 Testing Create Login on the newly created staff...');
        
        // Capture network response
        let networkResponse = null;
        page.on('response', async (response) => {
          if (response.url().includes('create-staff-user')) {
            try {
              const responseBody = await response.text();
              networkResponse = {
                status: response.status(),
                body: responseBody
              };
              console.log('\n🌐 EDGE FUNCTION RESPONSE:');
              console.log('Status:', networkResponse.status);
              console.log('Body:', networkResponse.body);
            } catch (e) {
              console.log('Failed to capture response:', e.message);
            }
          }
        });
        
        let loginAlert = '';
        page.on('dialog', async dialog => {
          loginAlert = dialog.message();
          console.log('\n📢 LOGIN CREATION RESULT:');
          console.log(loginAlert);
          await dialog.accept();
        });
        
        await createButtons[0].click();
        console.log('⏳ Waiting for Edge Function response...');
        await page.waitForTimeout(15000);
        
        if (networkResponse) {
          if (networkResponse.status === 200) {
            console.log('\n🎉 SUCCESS! Edge Function worked!');
            console.log('✅ User account created in Supabase Auth');
            
            try {
              const successData = JSON.parse(networkResponse.body);
              console.log('✅ Response data:', successData);
            } catch (e) {
              console.log('✅ Raw response:', networkResponse.body);
            }
          } else if (networkResponse.status === 401) {
            console.log('\n❌ STILL FAILING: HTTP 401');
            console.log('🔍 The JWT authentication is still not working');
            
            try {
              const errorData = JSON.parse(networkResponse.body);
              console.log('❌ Error details:', errorData);
            } catch (e) {
              console.log('❌ Raw error:', networkResponse.body);
            }
          } else {
            console.log(`\n⚠️ Unexpected status: ${networkResponse.status}`);
          }
        }
        
      } else {
        console.log('❌ No Create Login buttons found after creating staff');
      }
      
    } else {
      console.log('❌ Staff creation failed or no success message');
    }
    
    await page.screenshot({ path: 'final-edge-function-test.png', fullPage: true });
    
    console.log('\n⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'final-edge-function-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

finalEdgeFunctionTest().catch(console.error);