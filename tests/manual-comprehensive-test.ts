/**
 * Manual Comprehensive Testing Script
 * Run this to systematically test all pages and functions
 *
 * Usage: npx tsx tests/manual-comprehensive-test.ts
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'jelidiadam12@gmail.com',
  password: 'Prestige2026!',
};

interface TestResult {
  page: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: string[];
}

const results: TestResult[] = [];

async function login(page: Page): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for either dashboard or 2FA page
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes('/verify-2fa')) {
      console.log('⚠️  2FA required - skipping automated tests');
      return false;
    }

    if (url.includes('/dashboard')) {
      console.log('✅ Login successful');
      return true;
    }

    console.log('❌ Login failed - unexpected URL:', url);
    return false;
  } catch (error) {
    console.log('❌ Login error:', error);
    return false;
  }
}

async function testScrolling(page: Page): Promise<TestResult> {
  console.log('\n🔍 Testing: Page Scrolling');

  try {
    const isScrollable = await page.evaluate(() => {
      const body = document.querySelector('.app-body');
      if (!body) return false;
      const style = window.getComputedStyle(body);
      return style.overflowY === 'auto' || style.overflowY === 'scroll';
    });

    if (!isScrollable) {
      return {
        page: 'Global',
        status: 'FAIL',
        message: 'Page is not scrollable - overflow-y not set',
      };
    }

    // Try scrolling
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollY = await page.evaluate(() => window.scrollY);

    // Check if content is taller than viewport
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

    if (bodyHeight > viewportHeight && scrollY === 0) {
      return {
        page: 'Global',
        status: 'FAIL',
        message: 'Page has scrollable content but scrolling does not work',
      };
    }

    return {
      page: 'Global',
      status: 'PASS',
      message: 'Scrolling works correctly',
    };
  } catch (error) {
    return {
      page: 'Global',
      status: 'FAIL',
      message: 'Error testing scrolling: ' + (error as Error).message,
    };
  }
}

async function testBottomNav(page: Page): Promise<TestResult> {
  console.log('\n🔍 Testing: Bottom Navigation');

  try {
    const bottomNav = page.locator('.bottom-nav');
    const isVisible = await bottomNav.isVisible();

    if (!isVisible) {
      return {
        page: 'Global',
        status: 'FAIL',
        message: 'Bottom navigation is not visible',
      };
    }

    const navItems = bottomNav.locator('.bottom-nav-item');
    const count = await navItems.count();

    if (count !== 5) {
      return {
        page: 'Global',
        status: 'WARNING',
        message: `Bottom nav has ${count} items (expected 5)`,
      };
    }

    // Get all nav item labels
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await navItems.nth(i).textContent();
      labels.push(text?.trim() || '');
    }

    return {
      page: 'Global',
      status: 'PASS',
      message: 'Bottom navigation is correct',
      details: labels,
    };
  } catch (error) {
    return {
      page: 'Global',
      status: 'FAIL',
      message: 'Error testing bottom nav: ' + (error as Error).message,
    };
  }
}

async function testPage(page: Page, url: string, pageName: string): Promise<TestResult> {
  console.log(`\n🔍 Testing: ${pageName}`);

  try {
    await page.goto(`${BASE_URL}${url}`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check for error messages
    const errorCount = await page.locator('text=/error|erreur/i').count();
    if (errorCount > 0) {
      const errorText = await page.locator('text=/error|erreur/i').first().textContent();
      return {
        page: pageName,
        status: 'FAIL',
        message: `Page shows error: ${errorText}`,
      };
    }

    // Check for main content
    const hasContent = await page.locator('.content').isVisible();
    if (!hasContent) {
      return {
        page: pageName,
        status: 'FAIL',
        message: 'Page is missing .content container',
      };
    }

    // Count buttons on page
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();

    // Get first 5 button texts
    const buttonTexts: string[] = [];
    const maxButtons = Math.min(buttonCount, 5);
    for (let i = 0; i < maxButtons; i++) {
      const text = await buttons.nth(i).textContent();
      buttonTexts.push(text?.trim() || 'unnamed');
    }

    return {
      page: pageName,
      status: 'PASS',
      message: `Page loaded successfully (${buttonCount} buttons found)`,
      details: buttonTexts.length > 0 ? buttonTexts : undefined,
    };
  } catch (error) {
    return {
      page: pageName,
      status: 'FAIL',
      message: 'Error loading page: ' + (error as Error).message,
    };
  }
}

async function testButtonClick(page: Page, buttonSelector: string, pageName: string, buttonName: string): Promise<TestResult> {
  console.log(`\n🔍 Testing: ${pageName} - ${buttonName}`);

  try {
    const button = page.locator(buttonSelector).first();
    const isVisible = await button.isVisible().catch(() => false);

    if (!isVisible) {
      return {
        page: pageName,
        status: 'WARNING',
        message: `Button not found: ${buttonName}`,
      };
    }

    await button.click();
    await page.waitForTimeout(1000);

    // Check if something happened (modal opened, navigation, etc)
    const currentUrl = page.url();

    return {
      page: pageName,
      status: 'PASS',
      message: `Button clicked successfully: ${buttonName}`,
      details: [`Current URL: ${currentUrl}`],
    };
  } catch (error) {
    return {
      page: pageName,
      status: 'FAIL',
      message: `Error clicking button ${buttonName}: ` + (error as Error).message,
    };
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Manual Tests\n');
  console.log('Server URL:', BASE_URL);
  console.log('Test User:', TEST_USER.email);
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12 Pro size
  });
  const page = await context.newPage();

  try {
    // Login
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed - login failed');
      await browser.close();
      return;
    }

    // Test scrolling
    results.push(await testScrolling(page));

    // Test bottom nav
    results.push(await testBottomNav(page));

    // Test all main pages
    const pages = [
      { url: '/dashboard', name: 'Dashboard' },
      { url: '/dispatch', name: 'Dispatch' },
      { url: '/customers', name: 'Customers' },
      { url: '/jobs', name: 'Jobs' },
      { url: '/invoices', name: 'Invoices' },
      { url: '/reports', name: 'Reports' },
      { url: '/sales/dashboard', name: 'Sales Dashboard' },
      { url: '/sales/leads', name: 'Sales Leads' },
      { url: '/team', name: 'Team' },
      { url: '/settings', name: 'Settings' },
      { url: '/sales/settings', name: 'Sales Settings' },
    ];

    for (const pageInfo of pages) {
      results.push(await testPage(page, pageInfo.url, pageInfo.name));
      await page.waitForTimeout(500);
    }

    // Keep browser open for manual inspection
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.status === 'WARNING').length;

    console.log(`✅ PASSED:  ${passed}`);
    console.log(`❌ FAILED:  ${failed}`);
    console.log(`⚠️  WARNINGS: ${warnings}`);
    console.log('\nDetailed Results:\n');

    for (const result of results) {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} [${result.page}] ${result.message}`);
      if (result.details) {
        result.details.forEach(detail => console.log(`   → ${detail}`));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n⏸️  Browser left open for manual inspection');
    console.log('Press Ctrl+C to close when done\n');

    // Keep process alive
    await new Promise(() => {});
  } catch (error) {
    console.error('Fatal error:', error);
    await browser.close();
  }
}

runTests().catch(console.error);
