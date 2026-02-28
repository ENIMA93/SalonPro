const { chromium } = require('playwright');

async function testEdgeFunctionDirect() {
  console.log('🔧 TESTING EDGE FUNCTION DIRECTLY');
  console.log('==================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📱 Getting authentication token...');
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
    
    // Get the current session token
    const tokenInfo = await page.evaluate(async () => {
      // @ts-ignore
      const { data: { session } } = await window.supabase?.auth?.getSession();
      return {
        hasSession: !!session,
        token: session?.access_token,
        userId: session?.user?.id,
        expiresAt: session?.expires_at
      };
    });
    
    console.log('🔑 Token Info:', {
      hasSession: tokenInfo.hasSession,
      hasToken: !!tokenInfo.token,
      tokenLength: tokenInfo.token?.length,
      userId: tokenInfo.userId,
      expiresAt: tokenInfo.expiresAt
    });
    
    if (!tokenInfo.token) {
      console.log('❌ No token available');
      return;
    }
    
    // Test the Edge Function directly with fetch
    console.log('🌐 Testing Edge Function directly...');
    
    const testResponse = await page.evaluate(async (token) => {
      try {
        const response = await fetch('https://ngqyfjhcxtimnebdqxen.supabase.co/functions/v1/create-staff-user', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            staff_id: 'test-id-123',
            email: 'test@example.com',
            password: 'TestPass123!'
          })
        });
        
        const responseText = await response.text();
        
        return {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    }, tokenInfo.token);
    
    console.log('\n📊 EDGE FUNCTION RESPONSE:');
    console.log('==========================');
    console.log('Status:', testResponse.status);
    console.log('Status Text:', testResponse.statusText);
    console.log('OK:', testResponse.ok);
    console.log('Body:', testResponse.body);
    
    if (testResponse.error) {
      console.log('❌ Network Error:', testResponse.error);
    } else if (testResponse.status === 401) {
      console.log('❌ HTTP 401: Authentication failed');
      console.log('💡 The Edge Function is rejecting our JWT token');
      
      try {
        const errorBody = JSON.parse(testResponse.body);
        console.log('🔍 Error Details:', errorBody);
      } catch (e) {
        console.log('🔍 Raw Error Body:', testResponse.body);
      }
    } else if (testResponse.status === 200) {
      console.log('✅ SUCCESS: Edge Function worked!');
    } else {
      console.log('⚠️ Unexpected status:', testResponse.status);
    }
    
    console.log('\n⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testEdgeFunctionDirect().catch(console.error);