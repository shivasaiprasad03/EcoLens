/**
 * EcoLens — Lightweight Test Runner
 * Browser-based test framework with assertions and reporting.
 * @module tests/test-runner
 */

const TestRunner = (() => {
  'use strict';

  let suites = [];
  let currentSuite = null;

  /**
   * Defines a test suite.
   * @param {string} name - Suite name.
   * @param {Function} fn - Function containing test definitions.
   */
  function describe(name, fn) {
    currentSuite = { name, tests: [], passed: 0, failed: 0, errors: [] };
    suites.push(currentSuite);
    fn();
    currentSuite = null;
  }

  /**
   * Defines a test case within a suite.
   * @param {string} name - Test name.
   * @param {Function} fn - Test function.
   */
  function it(name, fn) {
    if (!currentSuite) {
      console.error('[TestRunner] it() must be called inside describe()');
      return;
    }
    const test = { name, passed: false, error: null };
    currentSuite.tests.push(test);
    try {
      fn();
      test.passed = true;
      currentSuite.passed++;
    } catch (err) {
      test.error = err.message || String(err);
      currentSuite.failed++;
      currentSuite.errors.push({ test: name, error: test.error });
    }
  }

  // ---- Assertions ----

  /**
   * Asserts strict equality.
   * @param {*} actual
   * @param {*} expected
   * @param {string} [message]
   */
  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  }

  /**
   * Asserts deep equality for objects/arrays.
   * @param {*} actual
   * @param {*} expected
   * @param {string} [message]
   */
  function assertDeepEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(
        message || `Deep equality failed.\nExpected: ${expectedStr}\nGot: ${actualStr}`
      );
    }
  }

  /**
   * Asserts that a value is truthy.
   * @param {*} value
   * @param {string} [message]
   */
  function assertTrue(value, message) {
    if (!value) {
      throw new Error(message || `Expected truthy value, got ${JSON.stringify(value)}`);
    }
  }

  /**
   * Asserts that a value is falsy.
   * @param {*} value
   * @param {string} [message]
   */
  function assertFalse(value, message) {
    if (value) {
      throw new Error(message || `Expected falsy value, got ${JSON.stringify(value)}`);
    }
  }

  /**
   * Asserts that a function throws an error.
   * @param {Function} fn
   * @param {string} [message]
   */
  function assertThrows(fn, message) {
    let threw = false;
    try {
      fn();
    } catch {
      threw = true;
    }
    if (!threw) {
      throw new Error(message || 'Expected function to throw, but it did not');
    }
  }

  /**
   * Asserts a number is within a range.
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @param {string} [message]
   */
  function assertInRange(value, min, max, message) {
    if (typeof value !== 'number' || value < min || value > max) {
      throw new Error(
        message || `Expected ${value} to be in range [${min}, ${max}]`
      );
    }
  }

  /**
   * Asserts approximate equality for floating point.
   * @param {number} actual
   * @param {number} expected
   * @param {number} [tolerance=0.01]
   * @param {string} [message]
   */
  function assertApproxEqual(actual, expected, tolerance = 0.01, message) {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(
        message || `Expected ~${expected} (±${tolerance}), got ${actual}`
      );
    }
  }

  // ---- Reporting ----

  /**
   * Runs all tests and renders results to the page.
   */
  function run() {
    const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0);
    const totalFailed = suites.reduce((sum, s) => sum + s.failed, 0);
    const totalTests = totalPassed + totalFailed;

    const container = document.getElementById('test-results') || document.body;

    let html = `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
        <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">🧪 EcoLens Test Results</h1>
        <div style="padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; background: ${totalFailed === 0 ? '#dcfce7' : '#fef2f2'}; color: ${totalFailed === 0 ? '#166534' : '#991b1b'}; font-weight: 600;">
          ${totalFailed === 0 ? '✅ All tests passed!' : `❌ ${totalFailed} test(s) failed`}
          &nbsp;—&nbsp; ${totalPassed}/${totalTests} passed
        </div>
    `;

    suites.forEach((suite) => {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: #374151;">
            ${suite.failed === 0 ? '✅' : '❌'} ${escapeHtml(suite.name)}
            <span style="font-size: 0.8rem; color: #9ca3af; font-weight: normal;">(${suite.passed}/${suite.tests.length})</span>
          </h2>
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      `;

      suite.tests.forEach((test, i) => {
        html += `
          <div style="padding: 0.5rem 1rem; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 0.5rem; ${i % 2 === 0 ? '' : 'background: #f9fafb;'}">
            <span>${test.passed ? '✓' : '✗'}</span>
            <span style="flex: 1; font-size: 0.875rem; color: ${test.passed ? '#374151' : '#991b1b'};">${escapeHtml(test.name)}</span>
            ${test.error ? `<span style="font-size: 0.75rem; color: #991b1b; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(test.error)}">${escapeHtml(test.error)}</span>` : ''}
          </div>
        `;
      });

      html += `</div></div>`;
    });

    html += `
        <p style="font-size: 0.75rem; color: #9ca3af; text-align: center; margin-top: 2rem;">
          Tests run at ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Simple HTML escape for test output.
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    describe,
    it,
    assertEqual,
    assertDeepEqual,
    assertTrue,
    assertFalse,
    assertThrows,
    assertInRange,
    assertApproxEqual,
    run,
  };
})();
