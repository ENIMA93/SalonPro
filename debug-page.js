const { chromium } = require('playwright');

async function debugPage() {
  console.log('🔍 Debugging page structure...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5176/');
    await page.waitForTimeout(5000);
    
    console.log('📄 Page title:', await page.title());
    console.log('🔗 Current URL:', page.url());
    
    // Take full page screenshot
    await page.screenshot({ path: 'debug-full-page.png', fullPage: true });
    console.log('📸 Full page screenshot saved');
    
    // Try to find staff link
    const staffLinks = await page.$$('text=Staff');
    console.log(`🔍 Found ${staffLinks.length} "Staff" links`);
    
    if (staffLinks.length > 0) {
      console.log('📋 Clicking Staff link...');
      await page.click('text=Staff');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'debug-staff-page.png', fullPage: true });
      console.log('📸 Staff page screenshot saved');
      
      // Get page HTML to see structure
      const bodyHTML = await page.$eval('body', el => el.innerHTML);
      console.log('📝 Page HTML length:', bodyHTML.length);
      
      // Look for staff-related elements
      const allElements = await page.$$eval('*', elements => {
        return elements
          .filter(el => el.textContent && (
            el.textContent.includes('Maria') || 
            el.textContent.includes('Staff') ||
            el.className.includes('staff') ||
            el.className.includes('gray-800')
          ))
          .map(el => ({
            tag: el.tagName,
            class: el.className,
            text: el.textContent.substring(0, 100)
          }));
      });
      
      console.log('🎯 Found staff-related elements:', allElements.length);
      allElements.forEach((el, i) => {
        console.log(`  ${i + 1}. ${el.tag}.${el.class}: "${el.text}"`);
      });
    }
    
    await page.waitForTimeout(10000); // Keep browser open for inspection
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugPage().catch(console.error);