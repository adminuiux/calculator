/**
 * @goadminuiux/calculator - Entry Point Module
 * Universal export of Calculator, Formatter, StreamCalculator, and AdminUIUXCalculator.
 *
 * @license MIT
 * @copyright AdminUIUX
 */

'use strict';

import { Formatter } from './formatter.js';
import { Calculator, StreamCalculator } from './calculator.js';

export class AdminUIUXCalculator {
    constructor(element, config = {}) {
        if (typeof element === 'string') {
            this.wrapper = document.querySelector(element);
        } else {
            this.wrapper = element;
        }

        if (!this.wrapper) return;
        if (this.wrapper._calculatorInstance) return;
        this.wrapper._calculatorInstance = this;

        this.config = Object.assign({
            type: this.wrapper.getAttribute('data-calculator-type') || this.wrapper.getAttribute('data-calendar-type') || this.wrapper.getAttribute('data-calc-mode') || 'basic',
            precision: parseInt(this.wrapper.getAttribute('data-calc-precision'), 10) || (config.precision ?? 8),
            angleMode: 'deg',
            currency: this.wrapper.getAttribute('data-calc-currency') || config.currency || '',
            taxRate: config.taxRate ?? 0.18,
            tipRates: config.tipRates ?? [10, 15, 20],
            quickPresets: config.quickPresets ?? [50, 100, 500, 1000],
            enableKeyboard: config.enableKeyboard ?? true,
            showTape: config.showTape ?? false,
            onCalculate: config.onCalculate || null
        }, config);

        this.engine = new StreamCalculator(this.config);
        this.hasInteracted = false;
        this.memory = 0;

        // Cache DOM Elements
        this.displayEl = this.wrapper.querySelector('.calculator-display, [data-calc-display]');
        this.historyEl = this.wrapper.querySelector('.calculator-history, [data-calc-history]');
        this.memoryBadge = this.wrapper.querySelector('[data-calc-memory-badge]');
        this.angleModeBtn = this.wrapper.querySelector('[data-calc-angle-toggle]');
        this.tapeListEl = this.wrapper.querySelector('.calculator-tape, [data-calc-tape]');

        this.initEventListeners();
        this.updateDisplay();
    }

    initEventListeners() {
        this.wrapper.querySelectorAll('[data-calc-action], [data-calculator-perfom], [data-calculator-perform]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const performExpr = btn.getAttribute('data-calculator-perfom') || btn.getAttribute('data-calculator-perform');
                if (performExpr) {
                    this.executePerform(performExpr);
                    return;
                }
                const action = btn.getAttribute('data-calc-action');
                const val = btn.getAttribute('data-val');
                this.handleAction(action, val);
            });
        });

        if (this.config.enableKeyboard) {
            this.wrapper.addEventListener('keydown', (e) => {
                this.handleKeyDown(e);
            });
            if (!this.wrapper.hasAttribute('tabindex')) {
                this.wrapper.setAttribute('tabindex', '0');
            }
        }
    }

    handleKeyDown(e) {
        if (['input', 'textarea'].includes(document.activeElement?.tagName?.toLowerCase())) return;

        const key = e.key;
        if (!isNaN(key)) {
            e.preventDefault();
            this.handleAction('num', key);
        } else if (key === '.') {
            e.preventDefault();
            this.handleAction('num', '.');
        } else if (key === '+' || key === '-' || key === '*' || key === '/') {
            e.preventDefault();
            this.handleAction('operator', key);
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            this.handleAction('equals');
        } else if (key === 'Backspace') {
            e.preventDefault();
            this.handleAction('backspace');
        } else if (key === 'Escape') {
            e.preventDefault();
            this.handleAction('clear');
        } else if (key === '%') {
            e.preventDefault();
            this.handleAction('percent');
        }
    }

    handleAction(action, val) {
        this.hasInteracted = true;
        switch (action) {
            case 'num':
                this.engine.inputDigit(val);
                break;
            case 'operator':
                this.engine.inputOperator(val);
                break;
            case 'equals':
                this.engine.inputEquals();
                this.syncTape();
                break;
            case 'clear':
                this.engine.clearAll();
                break;
            case 'clear-entry':
            case 'backspace':
                this.engine.backspace();
                break;
            case 'negate':
                this.engine.toggleSign();
                break;
            case 'percent':
                this.engine.applyPercent();
                break;
            case 'scientific':
                this.applyScientific(val);
                break;
            case 'memory':
                this.handleMemory(val);
                break;
            case 'angle-toggle':
                this.toggleAngleMode();
                break;
            case 'preset':
                this.applyPreset(parseFloat(val));
                break;
            case 'tax-add':
                this.applyTax(true);
                break;
            case 'tax-sub':
                this.applyTax(false);
                break;
            case 'tip':
                this.applyTip(parseFloat(val));
                break;
            case 'discount':
                this.applyDiscount(parseFloat(val));
                break;
        }
        this.updateDisplay();
    }

    applyScientific(func) {
        const val = this.engine.parseCurrent();
        let res = val;
        switch (func) {
            case 'sin': res = Calculator.sin(val, this.config.angleMode, this.config.precision); break;
            case 'cos': res = Calculator.cos(val, this.config.angleMode, this.config.precision); break;
            case 'tan': res = Calculator.tan(val, this.config.angleMode, this.config.precision); break;
            case 'asin': res = Calculator.asin(val, this.config.angleMode, this.config.precision); break;
            case 'acos': res = Calculator.acos(val, this.config.angleMode, this.config.precision); break;
            case 'atan': res = Calculator.atan(val, this.config.angleMode, this.config.precision); break;
            case 'sqrt': res = Calculator.sqrt(val, this.config.precision); break;
            case 'sqr': res = Calculator.sqr(val, this.config.precision); break;
            case 'cube': res = Calculator.cube(val, this.config.precision); break;
            case 'log': res = Calculator.log(val, this.config.precision); break;
            case 'ln': res = Calculator.ln(val, this.config.precision); break;
            case 'exp': res = Calculator.exp(val, this.config.precision); break;
            case '1/x': res = Calculator.reciprocal(val, this.config.precision); break;
            case 'abs': res = Calculator.abs(val); break;
            case 'pi': res = Formatter.round(Math.PI, this.config.precision); break;
            case 'e': res = Formatter.round(Math.E, this.config.precision); break;
            case 'fact': res = Calculator.factorial(val); break;
        }

        this.engine.currentInput = String(res);
        if (this.engine.hasJustCalculated) {
            this.engine.historyTokens = [`${func}(${Formatter.format(val)}) =`];
        }
    }

    handleMemory(action) {
        const val = this.engine.parseCurrent();
        switch (action) {
            case 'mc': this.memory = 0; break;
            case 'mr':
                this.engine.currentInput = String(this.memory);
                this.engine.hasJustCalculated = false;
                break;
            case 'm+': this.memory += val; break;
            case 'm-': this.memory -= val; break;
            case 'ms': this.memory = val; break;
        }
        if (this.memoryBadge) {
            this.memoryBadge.style.display = this.memory !== 0 ? 'inline-block' : 'none';
        }
    }

    toggleAngleMode() {
        this.config.angleMode = this.config.angleMode === 'deg' ? 'rad' : 'deg';
        if (this.angleModeBtn) {
            this.angleModeBtn.textContent = this.config.angleMode.toUpperCase();
        }
    }

    applyPreset(amount) {
        const current = this.engine.parseCurrent();
        this.engine.currentInput = String(current + amount);
        this.engine.hasJustCalculated = false;
    }

    applyTax(isAdd) {
        const current = this.engine.parseCurrent();
        const rate = this.config.taxRate;
        const result = Calculator.tax(current, rate, isAdd, this.config.precision);
        this.engine.currentInput = String(result);
        this.engine.historyTokens = [`${Formatter.format(current)} ${isAdd ? '+' : '-'} ${Math.round(rate * 100)}% Tax =`];
        this.engine.hasJustCalculated = true;
    }

    applyTip(percent) {
        const current = this.engine.parseCurrent();
        const result = Calculator.tip(current, percent, this.config.precision);
        this.engine.currentInput = String(result);
        this.engine.historyTokens = [`${Formatter.format(current)} + ${percent}% Tip =`];
        this.engine.hasJustCalculated = true;
    }

    applyDiscount(percent) {
        const current = this.engine.parseCurrent();
        const result = Calculator.discount(current, percent, this.config.precision);
        this.engine.currentInput = String(result);
        this.engine.historyTokens = [`${Formatter.format(current)} - ${percent}% Off =`];
        this.engine.hasJustCalculated = true;
    }

    executePerform(expr) {
        if (!expr) return;
        this.hasInteracted = true;
        const current = this.engine.parseCurrent();
        const res = Calculator.executePerform(current, expr);
        this.engine.currentInput = String(res.value);
        if (res.history) {
            this.engine.historyTokens = [res.history];
        }
        this.engine.hasJustCalculated = true;
        this.updateDisplay();
    }

    getOutputTargets() {
        const selector = this.wrapper.getAttribute('data-calculator-output') ||
            this.wrapper.getAttribute('data-output-target') ||
            this.config.outputTarget ||
            this.config.output;
        if (!selector) return [];
        try {
            return Array.from(document.querySelectorAll(selector));
        } catch (e) {
            return [];
        }
    }

    getCalculationTargets() {
        const selector = this.wrapper.getAttribute('data-calculator-calculation') ||
            this.wrapper.getAttribute('data-calculation-target') ||
            this.config.calculationTarget ||
            this.config.calculation;
        if (!selector) return [];
        try {
            return Array.from(document.querySelectorAll(selector));
        } catch (e) {
            return [];
        }
    }

    updateOutputTargets(displayStr, rawVal) {
        const targets = this.getOutputTargets();
        if (targets.length === 0) return;

        targets.forEach(target => {
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                target.value = displayStr;
                target.dispatchEvent(new Event('input', { bubbles: true }));
                target.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                target.textContent = displayStr;
            }
        });

        this.wrapper.dispatchEvent(new CustomEvent('calculator:change', {
            bubbles: true,
            detail: {
                value: rawVal,
                formatted: displayStr,
                history: this.engine.getHistoryString(),
                calculator: this
            }
        }));
    }

    updateCalculationTargets(calculationStr) {
        const targets = this.getCalculationTargets();
        if (targets.length === 0) return;

        targets.forEach(target => {
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                target.value = calculationStr;
                target.dispatchEvent(new Event('input', { bubbles: true }));
                target.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                target.textContent = calculationStr;
            }
        });
    }

    updateDisplay() {
        const currency = this.config.currency ? `${this.config.currency} ` : '';
        const rawVal = this.engine.parseCurrent();
        let finalDisplay = this.engine.getDisplayValue();

        const parts = finalDisplay.split('.');
        const formattedInt = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        finalDisplay = parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;

        if (this.displayEl) {
            this.displayEl.textContent = `${currency}${finalDisplay}`;
        }

        const historyStr = this.engine.getHistoryString();
        if (this.historyEl) {
            if (historyStr) {
                this.historyEl.textContent = historyStr;
            } else {
                this.historyEl.innerHTML = '&nbsp;';
            }
        }

        this.scrollToEnd(this.historyEl);
        this.scrollToEnd(this.displayEl);

        if (this.hasInteracted) {
            this.updateOutputTargets(`${currency}${finalDisplay}`, rawVal);
            this.updateCalculationTargets(historyStr || 'Result:');
        }
    }

    isRTL() {
        if (typeof document === 'undefined') return false;
        return (
            document.documentElement.getAttribute('dir') === 'rtl' ||
            document.documentElement.getAttribute('data-bs-direction') === 'rtl' ||
            document.body?.getAttribute('dir') === 'rtl' ||
            this.wrapper?.getAttribute('dir') === 'rtl' ||
            getComputedStyle(this.wrapper || document.documentElement).direction === 'rtl'
        );
    }

    scrollToEnd(element) {
        if (!element) return;
        const rtl = this.isRTL();
        element.scrollLeft = rtl ? -element.scrollWidth : element.scrollWidth;
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
                if (element) {
                    element.scrollLeft = rtl ? -element.scrollWidth : element.scrollWidth;
                }
            });
        }
    }

    syncTape() {
        if (!this.tapeListEl) return;
        this.tapeListEl.innerHTML = '';
        this.engine.tapeHistory.forEach((entry, idx) => {
            const item = document.createElement('div');
            item.className = 'd-flex justify-content-between py-1 border-bottom border-light-subtle';
            item.innerHTML = `<span class="text-secondary">${this.engine.tapeHistory.length - idx}.</span> <span>${entry}</span>`;
            this.tapeListEl.appendChild(item);
        });
    }

    static create(target, options = {}) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) return null;
        return new AdminUIUXCalculator(el, options);
    }

    static init(target, options = {}) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) return null;
        return new AdminUIUXCalculator(el, options);
    }

    static initAll() {
        if (typeof document === 'undefined') return;
        document.querySelectorAll('.calculator, [data-calculator-type], [data-calendar-type]').forEach(el => {
            if (!el._calculatorInstance) {
                new AdminUIUXCalculator(el);
            }
        });
    }
}

// Attach sub-modules
AdminUIUXCalculator.Calculator = Calculator;
AdminUIUXCalculator.Formatter = Formatter;
AdminUIUXCalculator.StreamCalculator = StreamCalculator;

// Browser global exposure & auto initialization
if (typeof window !== 'undefined') {
    window.AdminUIUXCalculator = AdminUIUXCalculator;
    window.Calculator = Calculator;
    window.Formatter = Formatter;
    window.StreamCalculator = StreamCalculator;

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => AdminUIUXCalculator.initAll());
        } else {
            AdminUIUXCalculator.initAll();
        }
    }
}

export { Formatter, Calculator, StreamCalculator };
export default AdminUIUXCalculator;
