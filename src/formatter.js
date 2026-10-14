/**
 * @adminuiux/calculator - Formatter Module
 * Zero-dependency numerical formatting, parsing, and symbol conversion utilities.
 *
 * @license MIT
 * @copyright AdminUIUX
 */

'use strict';

export const Formatter = {
    /**
     * Round a numeric value to a specified decimal precision, avoiding IEEE 754 floating point artifacts.
     * @param {number} value
     * @param {number} [precision=8]
     * @returns {number}
     */
    round(value, precision = 8) {
        if (!isFinite(value) || isNaN(value)) return 0;
        const p = Math.pow(10, precision);
        return Math.round((value + Number.EPSILON) * p) / p;
    },

    /**
     * Format a number or numeric string with thousand separators and optional currency symbol.
     * @param {number|string} num
     * @param {Object} [options={}]
     * @param {string} [options.currency=''] - Currency prefix (e.g., '$', '€', 'USD')
     * @param {number} [options.precision] - Optional fixed decimal places to round to
     * @returns {string}
     */
    format(num, options = {}) {
        if (num === null || num === undefined || num === '') return '';
        const parsed = typeof num === 'number' ? num : parseFloat(num);
        if (isNaN(parsed)) return 'Error';

        let targetNum = num;
        if (typeof options.precision === 'number') {
            targetNum = this.round(parsed, options.precision);
        }

        const str = String(targetNum);
        if (str.includes('e') || str.includes('E')) return str;

        const parts = str.split('.');
        const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const formatted = parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;

        if (options.currency) {
            return `${options.currency} ${formatted}`;
        }
        return formatted;
    },

    /**
     * Parse formatted string (e.g. "$ 1,234.56") into a standard JavaScript number.
     * @param {string|number} str
     * @returns {number}
     */
    parse(str) {
        if (typeof str === 'number') return isNaN(str) ? 0 : str;
        if (!str || typeof str !== 'string') return 0;
        const clean = str.replace(/[^0-9.-]/g, '');
        const val = parseFloat(clean);
        return isNaN(val) ? 0 : val;
    },

    /**
     * Convert standard code operators to human-readable math symbols.
     * @param {string} op
     * @returns {string}
     */
    getOperatorSymbol(op) {
        switch (op) {
            case '*':
            case 'x':
                return '×';
            case '/':
                return '÷';
            case '-':
                return '−';
            default:
                return op;
        }
    }
};

export default Formatter;
