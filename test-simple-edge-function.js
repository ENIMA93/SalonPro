const { chromium } = require('playwright');

async function testSimpleEdgeFunction() {
  console.log('🔧 SIMPLE EDGE FUNCTION TEST');
  console.log('=============================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📱 Opening app and getting token...');
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
    
    console.log('📋 Navigating to Staff page to trigger session...');
    await page.click('text=Staff');
    await page.waitForTimeout(3000);
    
    // Now test creating a login account and capture the full response
    const createButtons = await page.$$('button[aria-label="Create login account"]');
    
    if (createButtons.length > 0) {
      console.log('🔧 Testing Create Login and capturing full response...');
      
      // Intercept the network request to see the actual response
      let networkResponse = null;
      
      page.on('response', async (response) => {
        if (response.url().includes('create-staff-user')) {
          try {
            const responseBody = await response.text();
            networkResponse = {
              status: response.status(),
              statusText: response.statusText(),
              headers: response.headers(),
              body: responseBody,
              url: response.url()
            };
            console.log('\n🌐 NETWORK RESPONSE CAPTURED:');
            console.log('============================');
            console.log('Status:', networkResponse.status);
            console.log('Status Text:', networkResponse.statusText);
            console.log('URL:', networkResponse.url);
            console.log('Body:', networkResponse.body);
          } catch (e) {
            console.log('Failed to capture response body:', e.message);
          }
        }
      });
      
      let alertMessage = '';
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        console.log('\n📢 ALERT MESSAGE:');
        console.log('=================');
        console.log(alertMessage);
        console.log('=================');
        await dialog.accept();
      });
      
      await createButtons[0].click();
      console.log('⏳ Waiting for response...');
      await page.waitForTimeout(15000);
      
      if (networkResponse) {
        console.log('\n🔍 ANALYSIS:');
        if (networkResponse.status === 401) {
          console.log('❌ HTTP 401 - JWT Authentication Failed');
          
          try {
            const errorData = JSON.parse(networkResponse.body);
            console.log('🔍 Error Details:', errorData);
            
            if (errorData.details) {
              console.log('🔍 Additional Details:', errorData.details);
            }
          } catch (e) {
            console.log('🔍 Raw Response:', networkResponse.body);
          }
        } else if (networkResponse.status === 200) {
          console.log('✅ SUCCESS! User account created');
          
          try {
            const successData = JSON.parse(networkResponse.body);
            console.log('✅ Success Data:', successData);
          } catch (e) {
            console.log('✅ Raw Success Response:', networkResponse.body);
          }
        } else {
          console.log(`⚠️ Unexpected status: ${networkResponse.status}`);
        }
      } else {
        console.log('❌ No network response captured');
      }
      
    } else {
      console.log('ℹ️ No Create Login buttons found');
    }
    
    await page.screenshot({ path: 'simple-edge-function-test.png', fullPage: true });
    
    console.log('\n⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'simple-edge-function-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testSimpleEdgeFunction().catch(console.error);