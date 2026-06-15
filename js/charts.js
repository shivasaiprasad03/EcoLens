/**
 * EcoLens — Canvas-based Charts Library
 * Lightweight charting with donut, bar, line, and progress ring charts.
 * Responsive, animated, theme-aware, and accessibility-friendly.
 * @module charts
 */

const Charts = (() => {
  'use strict';

  /**
   * Gets computed CSS variable value.
   * @param {string} varName
   * @returns {string}
   */
  function getCSSVar(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  /**
   * Checks if reduced motion is preferred.
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Easing function (ease-out cubic).
   * @param {number} t - Progress [0, 1]
   * @returns {number}
   */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // ============================================
  //  DONUT CHART
  // ============================================

  /**
   * Draws an animated donut chart on a canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {Array<{label: string, value: number, color: string}>} data
   * @param {Object} options
   */
  function drawDonut(canvas, data, options = {}) {
    const {
      size = 240,
      lineWidth = 32,
      animationDuration = 800,
      centerText = '',
      centerSubtext = '',
    } = options;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - lineWidth) / 2;
    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (total === 0) {
      // Draw empty state
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = getCSSVar('--color-bg-tertiary') || '#e5e7eb';
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      drawCenterText(ctx, centerX, centerY, '0', 'No data yet');
      return;
    }

    const reduced = prefersReducedMotion();
    const duration = reduced ? 0 : animationDuration;
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
      const easedProgress = easeOutCubic(progress);

      ctx.clearRect(0, 0, size, size);

      // Draw background circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = getCSSVar('--color-bg-tertiary') || '#e5e7eb';
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Draw segments
      let currentAngle = -Math.PI / 2;
      const totalAngle = Math.PI * 2 * easedProgress;

      data.forEach((segment) => {
        const segmentAngle = (segment.value / total) * totalAngle;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle);
        ctx.strokeStyle = segment.color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        currentAngle += segmentAngle;
      });

      // Center text
      drawCenterText(ctx, centerX, centerY, centerText, centerSubtext);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  /**
   * Draws center text for donut chart.
   */
  function drawCenterText(ctx, x, y, mainText, subText) {
    const textColor = getCSSVar('--color-text-primary') || '#1a1a1a';
    const subColor = getCSSVar('--color-text-secondary') || '#666';

    ctx.fillStyle = textColor;
    ctx.font = `700 ${24}px "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mainText, x, subText ? y - 10 : y);

    if (subText) {
      ctx.fillStyle = subColor;
      ctx.font = `500 ${12}px "Inter", sans-serif`;
      ctx.fillText(subText, x, y + 14);
    }
  }

  // ============================================
  //  BAR CHART
  // ============================================

  /**
   * Draws an animated bar chart on a canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {Array<{label: string, value: number, color: string}>} data
   * @param {Object} options
   */
  function drawBarChart(canvas, data, options = {}) {
    const {
      width = 500,
      height = 260,
      animationDuration = 600,
      barRadius = 6,
      showValues = true,
    } = options;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Actual rendered width
    const actualWidth = canvas.clientWidth || width;

    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
    const chartWidth = actualWidth - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const barWidth = Math.min(40, (chartWidth / data.length) * 0.6);
    const gap = (chartWidth - barWidth * data.length) / (data.length + 1);

    const reduced = prefersReducedMotion();
    const duration = reduced ? 0 : animationDuration;
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
      const easedProgress = easeOutCubic(progress);

      ctx.clearRect(0, 0, actualWidth, height);

      const textColor = getCSSVar('--color-text-secondary') || '#666';
      const gridColor = getCSSVar('--color-divider') || '#e5e7eb';

      // Draw grid lines
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();

        // Y-axis labels
        const val = maxValue - (maxValue / 4) * i;
        ctx.fillStyle = textColor;
        ctx.font = '500 11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(Utils.formatNumber(val, 0), padding.left - 8, y);
      }

      // Draw bars
      data.forEach((item, i) => {
        const x = padding.left + gap + i * (barWidth + gap);
        const barHeight = (item.value / maxValue) * chartHeight * easedProgress;
        const y = padding.top + chartHeight - barHeight;

        // Rounded bar
        ctx.fillStyle = item.color;
        ctx.beginPath();
        if (barHeight > barRadius * 2) {
          ctx.moveTo(x, y + barRadius);
          ctx.arcTo(x, y, x + barWidth, y, barRadius);
          ctx.arcTo(x + barWidth, y, x + barWidth, y + barHeight, barRadius);
          ctx.lineTo(x + barWidth, padding.top + chartHeight);
          ctx.lineTo(x, padding.top + chartHeight);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();

        // Value on top
        if (showValues && progress >= 1) {
          ctx.fillStyle = textColor;
          ctx.font = '600 11px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(Utils.formatNumber(item.value, 1), x + barWidth / 2, y - 4);
        }

        // X-axis label
        ctx.fillStyle = textColor;
        ctx.font = '500 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(item.label, x + barWidth / 2, padding.top + chartHeight + 8);
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  // ============================================
  //  LINE CHART
  // ============================================

  /**
   * Draws an animated line chart on a canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {Array<{label: string, value: number}>} data
   * @param {Object} options
   */
  function drawLineChart(canvas, data, options = {}) {
    const {
      width = 500,
      height = 260,
      animationDuration = 800,
      lineColor = null,
      fillGradient = true,
      showDots = true,
    } = options;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const actualWidth = canvas.clientWidth || width;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = actualWidth - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (data.length < 2) {
      ctx.fillStyle = getCSSVar('--color-text-tertiary') || '#999';
      ctx.font = '500 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Not enough data to show trend', actualWidth / 2, height / 2);
      return;
    }

    const maxValue = Math.max(...data.map((d) => d.value), 1) * 1.1;
    const stepX = chartWidth / (data.length - 1);
    const color = lineColor || getCSSVar('--color-primary-500') || '#2d9a6b';

    const reduced = prefersReducedMotion();
    const duration = reduced ? 0 : animationDuration;
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
      const easedProgress = easeOutCubic(progress);

      ctx.clearRect(0, 0, actualWidth, height);

      const textColor = getCSSVar('--color-text-secondary') || '#666';
      const gridColor = getCSSVar('--color-divider') || '#e5e7eb';

      // Grid lines
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();

        const val = maxValue - (maxValue / 4) * i;
        ctx.fillStyle = textColor;
        ctx.font = '500 11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(Utils.formatNumber(val, 0), padding.left - 8, y);
      }

      // Calculate points
      const points = data.map((d, i) => ({
        x: padding.left + i * stepX,
        y: padding.top + chartHeight - (d.value / maxValue) * chartHeight * easedProgress,
      }));

      // Draw gradient fill
      if (fillGradient) {
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, color + '30');
        gradient.addColorStop(1, color + '05');

        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartHeight);
        points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        // Smooth curve using quadratic bezier
        const prevPoint = points[i - 1];
        const currPoint = points[i];
        const cpX = (prevPoint.x + currPoint.x) / 2;
        ctx.quadraticCurveTo(prevPoint.x + (cpX - prevPoint.x) * 0.8, prevPoint.y, cpX, (prevPoint.y + currPoint.y) / 2);
        ctx.quadraticCurveTo(currPoint.x - (currPoint.x - cpX) * 0.8, currPoint.y, currPoint.x, currPoint.y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw dots
      if (showDots && progress >= 0.8) {
        const bgColor = getCSSVar('--color-bg-card') || '#fff';
        points.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = bgColor;
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      // X-axis labels
      const labelStep = Math.max(1, Math.floor(data.length / 7));
      data.forEach((d, i) => {
        if (i % labelStep === 0 || i === data.length - 1) {
          ctx.fillStyle = textColor;
          ctx.font = '500 10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(d.label, padding.left + i * stepX, padding.top + chartHeight + 8);
        }
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  // ============================================
  //  PROGRESS RING
  // ============================================

  /**
   * Draws an animated progress ring.
   * @param {HTMLCanvasElement} canvas
   * @param {number} percent - 0-100
   * @param {Object} options
   */
  function drawProgressRing(canvas, percent, options = {}) {
    const {
      size = 120,
      lineWidth = 10,
      color = null,
      animationDuration = 600,
    } = options;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - lineWidth) / 2;
    const ringColor = color || getCSSVar('--color-primary-500') || '#2d9a6b';
    const bgColor = getCSSVar('--color-bg-tertiary') || '#e5e7eb';

    const reduced = prefersReducedMotion();
    const duration = reduced ? 0 : animationDuration;
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
      const easedProgress = easeOutCubic(progress);

      ctx.clearRect(0, 0, size, size);

      // Background ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = bgColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Progress ring
      const angle = (percent / 100) * Math.PI * 2 * easedProgress;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + angle);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  /**
   * Generates an accessible data table from chart data.
   * @param {Array<{label: string, value: number}>} data
   * @param {string} valueLabel
   * @returns {string} HTML table string
   */
  function generateDataTable(data, valueLabel = 'Value') {
    const rows = data
      .map((d) => `<tr><td>${Utils.sanitize(d.label)}</td><td>${Utils.formatNumber(d.value)}</td></tr>`)
      .join('');
    return `
      <table class="chart-data-table sr-only" role="table">
        <caption>Chart data</caption>
        <thead><tr><th>Category</th><th>${Utils.sanitize(valueLabel)}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  // Public API
  return Object.freeze({
    drawDonut,
    drawBarChart,
    drawLineChart,
    drawProgressRing,
    generateDataTable,
  });
})();
