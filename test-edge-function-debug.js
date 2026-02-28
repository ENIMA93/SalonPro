const { chromium } = require('playwright');

async function testEdgeFunctionDebug() {
  console.log('🔍 DEBUGGING EDGE FUNCTION AUTHENTICATION');
  console.log('=========================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const page = await browser.newPage();
  
  try {
    // Capture all network requests to see what's happening
    page.on('response', response => {
      if (response.url().includes('create-staff-user')) {
        console.log(`🌐 Edge Function Response: ${response.status()} ${response.statusText()}`);
      }
    });
    
    page.on('console', msg => {
      if (msg.text().includes('[Staff]') || msg.text().includes('Edge Function')) {
        console.log('🖥️', msg.text());
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
    
    // Look for staff without login accounts
    const staffWithoutLogin = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => 
        el.textContent && el.textContent.includes('No login')
      ).length;
    });
    
    console.log(`👤 Staff without login accounts: ${staffWithoutLogin}`);
    
    if (staffWithoutLogin > 0) {
      console.log('🔧 Testing Create Login with detailed debugging...');
      
      const createButtons = await page.$$('button[aria-label="Create login account"]');
      
      if (createButtons.length > 0) {
        console.log('➕ Clicking Create Login button...');
        
        let alertMessage = '';
        page.on('dialog', async dialog => {
          alertMessage = dialog.message();
          console.log('📢 Full Alert Message:');
          console.log(alertMessage);
          await dialog.accept();
        });
        
        // Get current session info before clicking
        const sessionInfo = await page.evaluate(async () => {
          // @ts-ignore - accessing global supabase
          const { data: { session } } = await window.supabase?.auth?.getSession() || {};
          return {
            hasSession: !!session,
            userId: session?.user?.id,
            tokenLength: session?.access_token?.length,
            expiresAt: session?.expires_at,
            now: Math.floor(Date.now() / 1000)
          };
        });
        
        console.log('🔑 Session Info Before Create Login:');
        console.log(sessionInfo);
        
        await createButtons[0].click();
        await page.waitForTimeout(12000); // Wait longer for response
        
        if (alertMessage.includes('Login created successfully')) {
          console.log('✅ SUCCESS: Login creation worked!');
        } else if (alertMessage.includes('401')) {
          console.log('❌ AUTHENTICATION ERROR: HTTP 401');
          console.log('🔍 This means the Edge Function rejected our JWT token');
        } else if (alertMessage.includes('404')) {
          console.log('❌ FUNCTION NOT FOUND: HTTP 404');
          console.log('🔍 Edge Function may not be deployed properly');
        } else if (alertMessage.includes('Failed')) {
          console.log('❌ CREATION FAILED:', alertMessage);
        } else {
          console.log('⚠️ No response or unexpected response');
        }
      } else {
        console.log('❌ No Create Login buttons found');
      }
    } else {
      console.log('ℹ️ All staff already have login accounts - cannot test creation');
    }
    
    await page.screenshot({ path: 'edge-function-debug.png', fullPage: true });
    
    console.log('\n⏳ Keeping browser open for inspection...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await page.screenshot({ path: 'edge-function-debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testEdgeFunctionDebug().catch(console.error);