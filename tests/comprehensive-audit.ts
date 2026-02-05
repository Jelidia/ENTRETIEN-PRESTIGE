/**
 * Comprehensive Audit Script
 * Tests all pages, buttons, and workflows
 * Generates detailed report of findings
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'jelidiadam12@gmail.com',
  password: process.env.PLAYWRIGHT_PASSWORD ?? 'DemoPassword2026!',
  role: 'admin'
};

interface AuditResult {
  page: string;
  url: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INFO';
  category: string;
  message: string;
  details?: string[];
  timestamp: string;
}

const results: AuditResult[] = [];
let browser: Browser;
let context: BrowserContext;
let page: Page;

function log(category: string, page: string, url: string, status: 'PASS' | 'FAIL' | 'WARNING' | 'INFO', message: string, details?: string[]) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARNING' ? '⚠️' : 'ℹ️';
  console.log(`${icon} [${category}] ${page}: ${message}`);
  if (details && details.length > 0) {
    details.forEach(d => console.log(`   → ${d}`));
  }

  results.push({
    page,
    url,
    status,
    category,
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

async function setup() {
  console.log('🚀 Starting Comprehensive Audit\n');
  console.log('Server:', BASE_URL);
  console.log('User:', TEST_USER.email);
  console.log('Role:', TEST_USER.role);
  console.log('='.repeat(70) + '\n');

  browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  page = await context.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('🔴 Console Error:', msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('🔴 Page Error:', error.message);
  });
}

async function login(): Promise<boolean> {
  console.log('\n📝 Testing Login Flow...\n');

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    // Check if login page loaded
    const emailInput = await page.locator('input[type="email"]').count();
    if (emailInput === 0) {
      log('Auth', 'Login', '/login', 'FAIL', 'Login page missing email input');
      return false;
    }

    log('Auth', 'Login', '/login', 'PASS', 'Login page loaded correctly');

    // Fill credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();

    // Check if 2FA required
    if (currentUrl.includes('/verify-2fa')) {
      log('Auth', 'Login', currentUrl, 'WARNING', '2FA required - cannot proceed with automated tests');
      return false;
    }

    // Check if redirected to dashboard
    if (currentUrl.includes('/dashboard')) {
      log('Auth', 'Login', currentUrl, 'PASS', 'Login successful - redirected to dashboard');
      return true;
    }

    log('Auth', 'Login', currentUrl, 'FAIL', 'Login failed - unexpected redirect', [currentUrl]);
    return false;

  } catch (error) {
    log('Auth', 'Login', '/login', 'FAIL', 'Login error: ' + (error as Error).message);
    return false;
  }
}

async function testScrolling(): Promise<void> {
  console.log('\n🔍 Testing Scrolling...\n');

  try {
    // Check CSS
    const hasOverflowY = await page.evaluate(() => {
      const content = document.querySelector('.content');
      if (!content) return false;
      const style = window.getComputedStyle(content);
      return style.overflowY === 'auto' || style.overflowY === 'scroll';
    });

    if (!hasOverflowY) {
      log('UI', 'Global', page.url(), 'FAIL', 'overflow-y not set on .content');
      return;
    }

    log('UI', 'Global', page.url(), 'PASS', 'overflow-y is set correctly');

    const scrollState = await page.evaluate(() => {
      const content = document.querySelector('.content') as HTMLElement | null;
      if (!content) {
        return { exists: false, before: 0, after: 0, scrollHeight: 0, clientHeight: 0 };
      }
      const before = content.scrollTop;
      content.scrollTop = before + 500;
      const after = content.scrollTop;
      return { exists: true, before, after, scrollHeight: content.scrollHeight, clientHeight: content.clientHeight };
    });

    if (!scrollState.exists) {
      log('UI', 'Global', page.url(), 'FAIL', 'Missing .content container');
      return;
    }

    const { scrollHeight, clientHeight, before, after } = scrollState;

    if (scrollHeight > clientHeight) {
      if (after > before) {
        log('UI', 'Global', page.url(), 'PASS', 'Page scrolls correctly', [
          `Content height: ${scrollHeight}px`,
          `Viewport: ${clientHeight}px`,
          `Scrolled: ${after}px`
        ]);
      } else {
        log('UI', 'Global', page.url(), 'WARNING', 'Content is scrollable but scroll did not move', [
          `Before: ${before}px`,
          `After: ${after}px`
        ]);
      }
    } else {
      log('UI', 'Global', page.url(), 'INFO', 'Page content fits in viewport - no scroll needed');
    }

  } catch (error) {
    log('UI', 'Global', page.url(), 'FAIL', 'Error testing scrolling: ' + (error as Error).message);
  }
}

async function testBottomNav(): Promise<void> {
  console.log('\n🔍 Testing Bottom Navigation...\n');

  try {
    const bottomNav = page.locator('.bottom-nav');
    const isVisible = await bottomNav.isVisible();

    if (!isVisible) {
      log('UI', 'Bottom Nav', page.url(), 'FAIL', 'Bottom navigation not visible');
      return;
    }

    const navItems = bottomNav.locator('.bottom-nav-item');
    const count = await navItems.count();

    if (count !== 5) {
      log('UI', 'Bottom Nav', page.url(), 'WARNING', `Has ${count} tabs (expected 5)`);
    } else {
      log('UI', 'Bottom Nav', page.url(), 'PASS', 'Exactly 5 navigation tabs');
    }

    // Get tab labels
    const labels: string[] = [];
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await navItems.nth(i).textContent();
      labels.push(text?.trim() || 'unnamed');
    }

    log('UI', 'Bottom Nav', page.url(), 'INFO', 'Navigation tabs', labels);

  } catch (error) {
    log('UI', 'Bottom Nav', page.url(), 'FAIL', 'Error testing bottom nav: ' + (error as Error).message);
  }
}

async function testPage(url: string, pageName: string): Promise<void> {
  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 15000 });

    // Check for errors
    const errorCount = await page.locator('text=/error|erreur|404|500/i').count();
    if (errorCount > 0) {
      const errorText = await page.locator('text=/error|erreur|404|500/i').first().textContent();
      log('Page', pageName, url, 'FAIL', 'Page shows error', [errorText || 'unknown error']);
      return;
    }

    // Check for content
    const hasContent = await page.locator('.content').isVisible();
    if (!hasContent) {
      log('Page', pageName, url, 'WARNING', 'Missing .content container');
    }

    // Count interactive elements
    const buttons = await page.locator('button:visible').count();
    const links = await page.locator('a:visible').count();
    const inputs = await page.locator('input:visible, select:visible, textarea:visible').count();

    log('Page', pageName, url, 'PASS', 'Page loaded successfully', [
      `Buttons: ${buttons}`,
      `Links: ${links}`,
      `Inputs: ${inputs}`
    ]);

    // Get button texts (first 5)
    const buttonTexts: string[] = [];
    const buttonLocator = page.locator('button:visible');
    const buttonCount = await buttonLocator.count();
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const text = await buttonLocator.nth(i).textContent();
      if (text) buttonTexts.push(text.trim());
    }

    if (buttonTexts.length > 0) {
      log('Page', pageName, url, 'INFO', 'Sample buttons', buttonTexts);
    }

  } catch (error) {
    log('Page', pageName, url, 'FAIL', 'Error loading page: ' + (error as Error).message);
  }
}

async function testAllPages(): Promise<void> {
  console.log('\n📄 Testing All Pages...\n');

  const pages = [
    { url: '/dashboard', name: 'Dashboard' },
    { url: '/dispatch', name: 'Dispatch' },
    { url: '/customers', name: 'Customers' },
    { url: '/jobs', name: 'Jobs' },
    { url: '/invoices', name: 'Invoices' },
    { url: '/reports', name: 'Reports' },
    { url: '/team', name: 'Team' },
    { url: '/settings', name: 'Settings' },
    { url: '/sales/dashboard', name: 'Sales Dashboard' },
    { url: '/sales/leads', name: 'Sales Leads' },
    { url: '/sales/settings', name: 'Sales Settings' },
    { url: '/sales/schedule', name: 'Sales Schedule' },
    { url: '/sales/earnings', name: 'Sales Earnings' },
    { url: '/admin/users', name: 'Admin Users' },
    { url: '/admin/manage', name: 'Admin Manage' },
    { url: '/operations', name: 'Operations' },
    { url: '/notifications', name: 'Notifications' },
    { url: '/inbox', name: 'Inbox' },
    { url: '/profile', name: 'Profile' },
  ];

  for (const pageInfo of pages) {
    await testPage(pageInfo.url, pageInfo.name);
    await page.waitForTimeout(500);
  }
}

async function testCreateCustomer(): Promise<void> {
  console.log('\n👤 Testing Customer Creation...\n');

  try {
    await page.goto(`${BASE_URL}/customers`, { waitUntil: 'networkidle' });

    // Look for add button
    const addButton = page.locator('button', { hasText: /ajouter|add|nouveau|new|create|créer/i }).first();
    const hasAddButton = await addButton.count() > 0;

    if (!hasAddButton) {
      log('Workflow', 'Create Customer', '/customers', 'WARNING', 'No add button found on customers page');
      return;
    }

    log('Workflow', 'Create Customer', '/customers', 'INFO', 'Add button found - clicking...');

    await addButton.click();
    await page.waitForTimeout(1000);

    // Check if modal or form appeared
    const hasModal = await page.locator('[role="dialog"], .modal, .modal-overlay').count() > 0;
    const hasForm = await page.locator('form').count() > 0;

    if (hasModal || hasForm) {
      log('Workflow', 'Create Customer', '/customers', 'PASS', 'Customer creation form opened', [
        `Modal: ${hasModal}`,
        `Form: ${hasForm}`
      ]);

      // Check for required fields
      const nameField = await page.locator('input[name*="name" i], input[placeholder*="nom" i]').count();
      const phoneField = await page.locator('input[name*="phone" i], input[name*="tel" i]').count();
      const emailField = await page.locator('input[type="email"]').count();

      log('Workflow', 'Create Customer', '/customers', 'INFO', 'Form fields detected', [
        `Name field: ${nameField > 0 ? '✅' : '❌'}`,
        `Phone field: ${phoneField > 0 ? '✅' : '❌'}`,
        `Email field: ${emailField > 0 ? '✅' : '❌'}`
      ]);
    } else {
      log('Workflow', 'Create Customer', '/customers', 'WARNING', 'Add button clicked but no form appeared');
    }

  } catch (error) {
    log('Workflow', 'Create Customer', '/customers', 'FAIL', 'Error: ' + (error as Error).message);
  }
}

async function testCreateLead(): Promise<void> {
  console.log('\n🎯 Testing Lead Creation...\n');

  try {
    await page.goto(`${BASE_URL}/sales/leads`, { waitUntil: 'networkidle' });

    const addButton = page.locator('button', { hasText: /ajouter|add|nouveau|new|create|créer/i }).first();
    const hasAddButton = await addButton.count() > 0;

    if (!hasAddButton) {
      log('Workflow', 'Create Lead', '/sales/leads', 'WARNING', 'No add button found on leads page');
      return;
    }

    log('Workflow', 'Create Lead', '/sales/leads', 'INFO', 'Add button found - clicking...');

    await addButton.click();
    await page.waitForTimeout(1000);

    const hasModal = await page.locator('[role="dialog"], .modal, .modal-overlay').count() > 0;
    const hasForm = await page.locator('form').count() > 0;

    if (hasModal || hasForm) {
      log('Workflow', 'Create Lead', '/sales/leads', 'PASS', 'Lead creation form opened');
    } else {
      log('Workflow', 'Create Lead', '/sales/leads', 'WARNING', 'Add button clicked but no form appeared');
    }

  } catch (error) {
    log('Workflow', 'Create Lead', '/sales/leads', 'FAIL', 'Error: ' + (error as Error).message);
  }
}

async function testCreateJob(): Promise<void> {
  console.log('\n🔧 Testing Job Creation...\n');

  try {
    await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle' });

    const addButton = page.locator('button', { hasText: /créer|create|ajouter|add|nouveau|new/i }).first();
    const hasAddButton = await addButton.count() > 0;

    if (!hasAddButton) {
      log('Workflow', 'Create Job', '/jobs', 'WARNING', 'No add button found on jobs page');
      return;
    }

    log('Workflow', 'Create Job', '/jobs', 'INFO', 'Add button found - clicking...');

    await addButton.click();
    await page.waitForTimeout(1000);

    const hasModal = await page.locator('[role="dialog"], .modal, .modal-overlay').count() > 0;
    const hasForm = await page.locator('form').count() > 0;

    if (hasModal || hasForm) {
      log('Workflow', 'Create Job', '/jobs', 'PASS', 'Job creation form opened');
    } else {
      log('Workflow', 'Create Job', '/jobs', 'WARNING', 'Add button clicked but no form appeared');
    }

  } catch (error) {
    log('Workflow', 'Create Job', '/jobs', 'FAIL', 'Error: ' + (error as Error).message);
  }
}

async function testDispatch(): Promise<void> {
  console.log('\n📅 Testing Dispatch Calendar...\n');

  try {
    await page.goto(`${BASE_URL}/dispatch`, { waitUntil: 'networkidle' });

    // Check for calendar structure
    const hasCalendar = await page.locator('.calendar-shell, .dispatch-calendar').count() > 0;

    if (!hasCalendar) {
      log('Workflow', 'Dispatch', '/dispatch', 'WARNING', 'Calendar structure not found');
      return;
    }

    log('Workflow', 'Dispatch', '/dispatch', 'PASS', 'Calendar structure present');

    // Check for auto-assign button
    const autoAssign = await page.locator('button', { hasText: /auto-assign|affectation auto/i }).count() > 0;
    if (autoAssign) {
      log('Workflow', 'Dispatch', '/dispatch', 'INFO', 'Auto-assign button found');
    } else {
      log('Workflow', 'Dispatch', '/dispatch', 'WARNING', 'Auto-assign button not found');
    }

    // Check for calendar events
    const events = await page.locator('.calendar-event').count();
    log('Workflow', 'Dispatch', '/dispatch', 'INFO', `Found ${events} calendar events`);

  } catch (error) {
    log('Workflow', 'Dispatch', '/dispatch', 'FAIL', 'Error: ' + (error as Error).message);
  }
}

function generateReport(): string {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;
  const info = results.filter(r => r.status === 'INFO').length;

  let report = '# Comprehensive Audit Report\n\n';
  report += `**Date:** ${new Date().toISOString()}\n`;
  report += `**Server:** ${BASE_URL}\n`;
  report += `**User:** ${TEST_USER.email} (${TEST_USER.role})\n\n`;
  report += '---\n\n';
  report += '## Summary\n\n';
  report += `- ✅ **PASSED:** ${passed}\n`;
  report += `- ❌ **FAILED:** ${failed}\n`;
  report += `- ⚠️ **WARNINGS:** ${warnings}\n`;
  report += `- ℹ️ **INFO:** ${info}\n`;
  report += `- **TOTAL:** ${results.length}\n\n`;
  report += '---\n\n';

  // Group by category
  const categories = [...new Set(results.map(r => r.category))];

  for (const category of categories) {
    report += `## ${category}\n\n`;
    const categoryResults = results.filter(r => r.category === category);

    for (const result of categoryResults) {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : result.status === 'WARNING' ? '⚠️' : 'ℹ️';
      report += `### ${icon} ${result.page}\n\n`;
      report += `**URL:** \`${result.url}\`\n\n`;
      report += `**Status:** ${result.status}\n\n`;
      report += `**Message:** ${result.message}\n\n`;

      if (result.details && result.details.length > 0) {
        report += '**Details:**\n';
        result.details.forEach(d => {
          report += `- ${d}\n`;
        });
        report += '\n';
      }

      report += '---\n\n';
    }
  }

  return report;
}

async function runAudit() {
  try {
    await setup();

    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed - login failed or 2FA required\n');
      console.log('Please login manually or disable 2FA for test user\n');
      await browser.close();
      return;
    }

    await testScrolling();
    await testBottomNav();
    await testAllPages();
    await testCreateCustomer();
    await testCreateLead();
    await testCreateJob();
    await testDispatch();

    // Generate report
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Generating Report...\n');

    const report = generateReport();
    const reportPath = path.join(process.cwd(), 'AUDIT_RESULTS.md');
    fs.writeFileSync(reportPath, report);

    console.log(`✅ Report saved to: ${reportPath}\n`);
    console.log('='.repeat(70));
    console.log('\n📊 Summary:\n');
    console.log(`✅ PASSED:  ${results.filter(r => r.status === 'PASS').length}`);
    console.log(`❌ FAILED:  ${results.filter(r => r.status === 'FAIL').length}`);
    console.log(`⚠️  WARNINGS: ${results.filter(r => r.status === 'WARNING').length}`);
    console.log(`ℹ️  INFO:    ${results.filter(r => r.status === 'INFO').length}`);
    console.log('\n' + '='.repeat(70));
    console.log('\n⏸️  Browser left open for manual inspection');
    console.log('Press Ctrl+C when done\n');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.error('Fatal error:', error);
    if (browser) {
      await browser.close();
    }
  }
}

runAudit().catch(console.error);
