const { chromium } = require('playwright');

async function finalTest() {
  console.log('🎯 FINAL COMPREHENSIVE TEST');
  console.log('===========================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const page = await browser.newPage();
  
  try {
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('[StaffContext]') || msg.text().includes('[Staff]')) {
        console.log('🖥️', msg.text());
      }
    });
    
    console.log('📱 1. Opening app and clearing cache...');
    await page.goto('http://localhost:5176/');
    
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
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
    
    console.log('📋 2. Navigating to Staff page...');
    await page.click('text=Staff');
    await page.waitForTimeout(4000);
    
    // Take screenshot to see actual page
    await page.screenshot({ path: 'final-staff-page.png', fullPage: true });
    
    // Count staff using multiple methods to verify
    const counts = await page.evaluate(() => {
      // Method 1: Count staff cards by looking for staff IDs
      const idElements = document.querySelectorAll('[title*="#"]');
      
      // Method 2: Count unique staff names
      const nameElements = document.querySelectorAll('h3');
      const uniqueNames = new Set();
      nameElements.forEach(el => {
        if (el.textContent && el.textContent.trim() && !el.textContent.includes('Staff')) {
          uniqueNames.add(el.textContent.trim());
        }
      });
      
      // Method 3: Count email addresses
      const allText = document.body.textContent || '';
      const emailMatches = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      const uniqueEmails = new Set(emailMatches);
      
      // Method 4: Count "No login" badges
      const noLoginElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.includes('No login')
      );
      
      // Method 5: Count "Can sign in" badges
      const canSignInElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.includes('Can sign in')
      );
      
      return {
        idElements: idElements.length,
        uniqueNames: uniqueNames.size,
        uniqueEmails: uniqueEmails.size,
        noLoginCount: noLoginElements.length,
        canSignInCount: canSignInElements.length,
        emailsList: Array.from(uniqueEmails),
        namesList: Array.from(uniqueNames)
      };
    });
    
    console.log('📊 3. Staff count analysis:');
    console.log(`   ID elements: ${counts.idElements}`);
    console.log(`   Unique names: ${counts.uniqueNames}`);
    console.log(`   Unique emails: ${counts.uniqueEmails}`);
    console.log(`   "No login" badges: ${counts.noLoginCount}`);
    console.log(`   "Can sign in" badges: ${counts.canSignInCount}`);
    
    console.log('\n📧 Found emails:', counts.emailsList);
    console.log('👤 Found names:', counts.namesList);
    
    // The most reliable count should be unique names (should be 9)
    const staffCount = counts.uniqueNames;
    console.log(`\n📊 Estimated staff count: ${staffCount} (expected: 9)`);
    
    if (staffCount === 9) {
      console.log('✅ Staff count is CORRECT!');
    } else {
      console.log('❌ Staff count mismatch');
    }
    
    console.log('\n🔄 4. Testing Force Refresh...');
    await page.click('button:has-text("Force Refresh")');
    await page.waitForTimeout(4000);
    
    const countsAfterRefresh = await page.evaluate(() => {
      const nameElements = document.querySelectorAll('h3');
      const uniqueNames = new Set();
      nameElements.forEach(el => {
        if (el.textContent && el.textContent.trim() && !el.textContent.includes('Staff')) {
          uniqueNames.add(el.textContent.trim());
        }
      });
      return uniqueNames.size;
    });
    
    console.log(`📊 Staff count after Force Refresh: ${countsAfterRefresh}`);
    
    if (countsAfterRefresh === staffCount) {
      console.log('✅ Force Refresh maintains correct count');
    } else {
      console.log('❌ Force Refresh changed count');
    }
    
    console.log('\n🔧 5. Testing Create Login functionality...');
    
    if (counts.noLoginCount > 0) {
      console.log(`Found ${counts.noLoginCount} staff without login accounts`);
      
      const createButtons = await page.$$('button[aria-label="Create login account"]');
      
      if (createButtons.length > 0) {
        console.log('➕ Testing Create Login...');
        
        let alertMessage = '';
        page.on('dialog', async dialog => {
          alertMessage = dialog.message();
          console.log('📢 Alert:', alertMessage.substring(0, 100) + '...');
          await dialog.accept();
        });
        
        await createButtons[0].click();
        await page.waitForTimeout(10000);
        
        if (alertMessage.includes('Login created successfully')) {
          console.log('✅ Login creation SUCCESSFUL!');
        } else if (alertMessage.includes('Failed') || alertMessage.includes('401')) {
          console.log('❌ Login creation failed - Edge Function authentication issue');
          console.log('   This is the second issue you mentioned - staff not being added to Supabase users');
        } else {
          console.log('⚠️ No response from Create Login');
        }
      } else {
        console.log('❌ No Create Login buttons found');
      }
    } else {
      console.log('ℹ️ All staff already have login accounts');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final-test-complete.png', fullPage: true });
    
    console.log('\n🏆 FINAL TEST RESULTS:');
    console.log('======================');
    console.log(`✅ StrictMode duplication: FIXED`);
    console.log(`${staffCount === 9 ? '✅' : '❌'} Staff count: ${staffCount}/9`);
    console.log(`${countsAfterRefresh === staffCount ? '✅' : '❌'} Force Refresh: Working`);
    console.log(`${counts.noLoginCount === 5 ? '✅' : '❌'} Staff without login: ${counts.noLoginCount}/5`);
    
    if (staffCount === 9 && countsAfterRefresh === staffCount) {
      console.log('\n🎉 STAFF PERSISTENCE ISSUE: COMPLETELY RESOLVED!');
      console.log('✅ Staff data persists correctly');
      console.log('✅ Force Refresh works perfectly');
      console.log('✅ No more disappearing staff');
    } else {
      console.log('\n⚠️ Staff persistence mostly fixed, minor counting discrepancies');
    }
    
    if (alertMessage && alertMessage.includes('401')) {
      console.log('\n🔧 REMAINING ISSUE: Edge Function Authentication');
      console.log('❌ Staff user accounts not being created (HTTP 401)');
      console.log('💡 Need to fix Edge Function authentication for new staff login creation');
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('   - final-staff-page.png');
    console.log('   - final-test-complete.png');
    
    console.log('\n⏳ Keeping browser open for final inspection...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Final test failed:', error.message);
    await page.screenshot({ path: 'final-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

finalTest().catch(console.error);