#!/usr/bin/env node

/**
 * Test script to verify all fixes applied on 2026-02-02
 * Tests: scrolling, Team page, Admin Users page, Profile page
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🧪 Testing fixes applied on 2026-02-02\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 640, height: 1000 },
  });
  const page = await context.newPage();

  const results = {
    passed: [],
    failed: [],
  };

  try {
    // ===== TEST 1: Login =====
    console.log('📝 Test 1: Login');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    console.log('✅ Login successful\n');
    results.passed.push('Login');

    // ===== TEST 2: Scrolling on Dashboard =====
    console.log('📝 Test 2: Scrolling on Dashboard');
    const dashboardScrollable = await page.evaluate(() => {
      const content = document.querySelector('.content');
      if (!content) return { error: '.content not found' };

      const styles = window.getComputedStyle(content);
      const hasScroll = styles.overflowY === 'auto' || styles.overflowY === 'scroll';
      const scrollHeight = content.scrollHeight;
      const clientHeight = content.clientHeight;
      const canScroll = scrollHeight > clientHeight;

      return {
        overflowY: styles.overflowY,
        hasScroll,
        scrollHeight,
        clientHeight,
        canScroll,
        isScrollable: hasScroll && canScroll,
      };
    });

    if (dashboardScrollable.error) {
      console.log(`❌ Dashboard scrolling: ${dashboardScrollable.error}\n`);
      results.failed.push(`Dashboard scrolling: ${dashboardScrollable.error}`);
    } else {
      console.log(`   overflow-y: ${dashboardScrollable.overflowY}`);
      console.log(`   scroll height: ${dashboardScrollable.scrollHeight}px`);
      console.log(`   client height: ${dashboardScrollable.clientHeight}px`);
      console.log(`   can scroll: ${dashboardScrollable.canScroll}`);

      if (dashboardScrollable.hasScroll) {
        console.log('✅ Dashboard has scrollable content\n');
        results.passed.push('Dashboard scrolling');
      } else {
        console.log('❌ Dashboard is not scrollable\n');
        results.failed.push('Dashboard scrolling: overflow-y not set to auto/scroll');
      }
    }

    // ===== TEST 3: Team Page Loads =====
    console.log('📝 Test 3: Team page loads without errors');

    let teamPageError = null;
    page.on('response', (response) => {
      if (response.url().includes('/api/users') && response.status() >= 400) {
        teamPageError = `${response.status()} ${response.statusText()}`;
      }
    });

    await page.goto(`${BASE_URL}/team`);
    await page.waitForTimeout(2000); // Wait for API calls

    const teamPageLoaded = await page.evaluate(() => {
      const title = document.querySelector('h1, h2');
      const hasError = document.body.textContent?.includes('Unable to load') ||
                       document.body.textContent?.includes('400') ||
                       document.body.textContent?.includes('Forbidden');

      return {
        title: title?.textContent || null,
        hasError,
        bodyText: document.body.textContent?.substring(0, 200),
      };
    });

    if (teamPageError) {
      console.log(`❌ Team page API error: ${teamPageError}\n`);
      results.failed.push(`Team page: API returned ${teamPageError}`);
    } else if (teamPageLoaded.hasError) {
      console.log(`❌ Team page has error: ${teamPageLoaded.bodyText}\n`);
      results.failed.push(`Team page: ${teamPageLoaded.bodyText}`);
    } else {
      console.log(`✅ Team page loaded successfully: "${teamPageLoaded.title}"\n`);
      results.passed.push('Team page loads');
    }

    // ===== TEST 4: Team Page Scrolling =====
    console.log('📝 Test 4: Team page scrolling');
    const teamScrollable = await page.evaluate(() => {
      const content = document.querySelector('.content');
      if (!content) return { error: '.content not found' };

      const styles = window.getComputedStyle(content);
      return {
        overflowY: styles.overflowY,
        hasScroll: styles.overflowY === 'auto' || styles.overflowY === 'scroll',
      };
    });

    if (teamScrollable.error) {
      console.log(`❌ ${teamScrollable.error}\n`);
      results.failed.push(`Team scrolling: ${teamScrollable.error}`);
    } else if (teamScrollable.hasScroll) {
      console.log(`✅ Team page is scrollable (overflow-y: ${teamScrollable.overflowY})\n`);
      results.passed.push('Team page scrolling');
    } else {
      console.log(`❌ Team page not scrollable (overflow-y: ${teamScrollable.overflowY})\n`);
      results.failed.push(`Team page scrolling: overflow-y = ${teamScrollable.overflowY}`);
    }

    // ===== TEST 5: Admin Users Page =====
    console.log('📝 Test 5: Admin Users page (no duplicate .content)');
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForTimeout(2000);

    const adminUsersCheck = await page.evaluate(() => {
      const contents = document.querySelectorAll('.content');
      const nestedContent = document.querySelector('.content .content');

      return {
        contentCount: contents.length,
        hasNested: !!nestedContent,
        title: document.querySelector('h1, h2')?.textContent || null,
      };
    });

    if (adminUsersCheck.hasNested) {
      console.log(`❌ Admin Users has nested .content elements\n`);
      results.failed.push('Admin Users: duplicate .content elements');
    } else if (adminUsersCheck.contentCount === 1) {
      console.log(`✅ Admin Users has exactly 1 .content element (no duplicates)\n`);
      results.passed.push('Admin Users no duplicates');
    } else {
      console.log(`⚠️  Admin Users has ${adminUsersCheck.contentCount} .content elements\n`);
      results.failed.push(`Admin Users: ${adminUsersCheck.contentCount} .content elements`);
    }

    // ===== TEST 6: Profile Page =====
    console.log('📝 Test 6: Profile page (no duplicate .content)');
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForTimeout(2000);

    const profileCheck = await page.evaluate(() => {
      const contents = document.querySelectorAll('.content');
      const nestedContent = document.querySelector('.content .content');

      return {
        contentCount: contents.length,
        hasNested: !!nestedContent,
        title: document.querySelector('h1, h2')?.textContent || null,
      };
    });

    if (profileCheck.hasNested) {
      console.log(`❌ Profile has nested .content elements\n`);
      results.failed.push('Profile: duplicate .content elements');
    } else if (profileCheck.contentCount === 1) {
      console.log(`✅ Profile has exactly 1 .content element (no duplicates)\n`);
      results.passed.push('Profile no duplicates');
    } else {
      console.log(`⚠️  Profile has ${profileCheck.contentCount} .content elements\n`);
      results.failed.push(`Profile: ${profileCheck.contentCount} .content elements`);
    }

    // ===== TEST 7: Profile Page Scrolling =====
    console.log('📝 Test 7: Profile page scrolling');
    const profileScrollable = await page.evaluate(() => {
      const content = document.querySelector('.content');
      if (!content) return { error: '.content not found' };

      const styles = window.getComputedStyle(content);
      return {
        overflowY: styles.overflowY,
        hasScroll: styles.overflowY === 'auto' || styles.overflowY === 'scroll',
      };
    });

    if (profileScrollable.hasScroll) {
      console.log(`✅ Profile page is scrollable (overflow-y: ${profileScrollable.overflowY})\n`);
      results.passed.push('Profile page scrolling');
    } else {
      console.log(`❌ Profile page not scrollable (overflow-y: ${profileScrollable.overflowY})\n`);
      results.failed.push(`Profile scrolling: overflow-y = ${profileScrollable.overflowY}`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    results.failed.push(`Test error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // ===== SUMMARY =====
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`   - ${test}`));
  console.log(`\n❌ Failed: ${results.failed.length}`);
  results.failed.forEach(test => console.log(`   - ${test}`));
  console.log('='.repeat(60));

  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch(console.error);
