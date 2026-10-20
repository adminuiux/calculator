/**
 * @goadminuiux/calculator
 * AdminUIUX - Production-Ready Universal Calculator Package
 *
 * Lightweight, zero-dependency vanilla JavaScript calculator engine & DOM component.
 * Works seamlessly in Browser (direct <script> / CDN), CommonJS (Node.js), and ES Modules.
 *
 * @version 1.0.2
 * @author AdminUIUX (adminuiux.com)
 * @license MIT
 *
 * Public APIs:
 * - Calculator: Pure mathematical calculation & evaluation engine (framework-independent)
 * - Formatter: High-precision number rounding, currency, and thousand-separator formatting
 * - StreamCalculator: Decoupled desk/stream calculator state machine (digits, chained ops, memory, tape)
 * - AdminUIUXCalculator: DOM-binding component connecting HTML buttons, displays, outputs & keyboard
 */

(function (global, factory) {
    'use strict';

    if (typeof exports === 'object' && typeof module !== 'undefined') {
        // CommonJS / Node.js
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else {
        // Browser Global / CDN script
        const exportsObj = factory();
        global.AdminUIUXCalculator = exportsObj.AdminUIUXCalculator;
        global.Calculator = exportsObj.Calculator;
        global.Formatter = exportsObj.Formatter;
        global.StreamCalculator = exportsObj.StreamCalculator;
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    /* ==========================================================================
       1. FORMATTER UTILITIES
       ========================================================================== */
    const Formatter = {
        /**
         * Round a number to a fixed decimal precision avoiding IEEE 754 floating point artifacts.
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
         * Format a number with thousand commas and optional currency prefix.
         * @param {number|string} num
         * @param {Object} [options={}]
         * @param {string} [options.currency=''] - Currency prefix (e.g. '$', '€')
         * @param {number} [options.precision] - Optional fixed decimal precision to round to
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
         * Parse formatted numeric string into clean number.
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
         * Convert standard math code operators into display symbols.
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

    /* ==========================================================================
       2. CORE PURE CALCULATOR ENGINE (Framework & DOM Independent)
       ========================================================================== */
    const Calculator = {
        precision: 8,

        /**
         * Basic Arithmetic Operations
         */
        add(a, b, precision = this.precision) {
            return Formatter.round(Number(a) + Number(b), precision);
        },

        subtract(a, b, precision = this.precision) {
            return Formatter.round(Number(a) - Number(b), precision);
        },

        multiply(a, b, precision = this.precision) {
            return Formatter.round(Number(a) * Number(b), precision);
        },

        divide(a, b, precision = this.precision) {
            const divisor = Number(b);
            if (divisor === 0) return 0;
            return Formatter.round(Number(a) / divisor, precision);
        },

        modulo(a, b, precision = this.precision) {
            const divisor = Number(b);
            if (divisor === 0) return 0;
            return Formatter.round(Number(a) % divisor, precision);
        },

        power(a, b, precision = this.precision) {
            return Formatter.round(Math.pow(Number(a), Number(b)), precision);
        },

        /**
         * Percentage Calculations
         */
        percent(value, percentage, precision = this.precision) {
            return Formatter.round((Number(value) * Number(percentage)) / 100, precision);
        },

        addPercent(value, percentage, precision = this.precision) {
            const delta = (Number(value) * Number(percentage)) / 100;
            return Formatter.round(Number(value) + delta, precision);
        },

        subtractPercent(value, percentage, precision = this.precision) {
            const delta = (Number(value) * Number(percentage)) / 100;
            return Formatter.round(Number(value) - delta, precision);
        },

        multiplyPercent(value, percentage, precision = this.precision) {
            return Formatter.round((Number(value) * Number(percentage)) / 100, precision);
        },

        dividePercent(value, percentage, precision = this.precision) {
            const frac = Number(percentage) / 100;
            if (frac === 0) return 0;
            return Formatter.round(Number(value) / frac, precision);
        },

        /**
         * Scientific & Math Functions
         */
        sin(val, angleMode = 'deg', precision = this.precision) {
            const rad = angleMode === 'deg' ? (Number(val) * Math.PI) / 180 : Number(val);
            return Formatter.round(Math.sin(rad), precision);
        },

        cos(val, angleMode = 'deg', precision = this.precision) {
            const rad = angleMode === 'deg' ? (Number(val) * Math.PI) / 180 : Number(val);
            return Formatter.round(Math.cos(rad), precision);
        },

        tan(val, angleMode = 'deg', precision = this.precision) {
            const rad = angleMode === 'deg' ? (Number(val) * Math.PI) / 180 : Number(val);
            return Formatter.round(Math.tan(rad), precision);
        },

        asin(val, angleMode = 'deg', precision = this.precision) {
            const rad = Math.asin(Number(val));
            const res = angleMode === 'deg' ? (rad * 180) / Math.PI : rad;
            return Formatter.round(res, precision);
        },

        acos(val, angleMode = 'deg', precision = this.precision) {
            const rad = Math.acos(Number(val));
            const res = angleMode === 'deg' ? (rad * 180) / Math.PI : rad;
            return Formatter.round(res, precision);
        },

        atan(val, angleMode = 'deg', precision = this.precision) {
            const rad = Math.atan(Number(val));
            const res = angleMode === 'deg' ? (rad * 180) / Math.PI : rad;
            return Formatter.round(res, precision);
        },

        sqrt(val, precision = this.precision) {
            const n = Number(val);
            return n >= 0 ? Formatter.round(Math.sqrt(n), precision) : 0;
        },

        sqr(val, precision = this.precision) {
            return Formatter.round(Number(val) * Number(val), precision);
        },

        cube(val, precision = this.precision) {
            return Formatter.round(Number(val) * Number(val) * Number(val), precision);
        },

        log(val, precision = this.precision) {
            const n = Number(val);
            return n > 0 ? Formatter.round(Math.log10(n), precision) : 0;
        },

        ln(val, precision = this.precision) {
            const n = Number(val);
            return n > 0 ? Formatter.round(Math.log(n), precision) : 0;
        },

        exp(val, precision = this.precision) {
            return Formatter.round(Math.exp(Number(val)), precision);
        },

        reciprocal(val, precision = this.precision) {
            const n = Number(val);
            return n !== 0 ? Formatter.round(1 / n, precision) : 0;
        },

        abs(val) {
            return Math.abs(Number(val));
        },

        factorial(n) {
            const num = Math.floor(Number(n));
            if (num < 0) return 0;
            if (num === 0 || num === 1) return 1;
            let r = 1;
            for (let i = 2; i <= Math.min(num, 170); i++) r *= i;
            return r;
        },

        /**
         * Financial Helpers
         */
        tax(amount, rate = 0.18, isAdd = true, precision = this.precision) {
            const amt = Number(amount);
            const res = isAdd ? amt * (1 + rate) : amt / (1 + rate);
            return Formatter.round(res, precision);
        },

        tip(amount, percent = 15, precision = this.precision) {
            const amt = Number(amount);
            const tipVal = (amt * percent) / 100;
            return Formatter.round(amt + tipVal, precision);
        },

        discount(amount, percent = 10, precision = this.precision) {
            const amt = Number(amount);
            const discVal = (amt * percent) / 100;
            return Formatter.round(amt - discVal, precision);
        },

        /**
         * Format shorthand helper
         */
        format(value, options) {
            return Formatter.format(value, options);
        },

        /**
         * Execute action expression string (e.g. "+10%", "-15%", "+500", "*2")
         * @param {number} currentVal
         * @param {string} expr
         * @returns {{ value: number, history: string }}
         */
        executePerform(currentVal, expr) {
            if (!expr) return { value: currentVal, history: '' };
            const str = String(expr).trim();
            const val = Number(currentVal) || 0;

            // Percentage modifier (e.g. "+15%", "-10%", "20%")
            const pctMatch = str.match(/^([+\-*/]?)\s*(\d+(?:\.\d+)?)\s*%$/);
            if (pctMatch) {
                const sign = pctMatch[1] || '+';
                const pct = parseFloat(pctMatch[2]);
                let result = val;
                if (sign === '+' || !pctMatch[1]) {
                    result = this.addPercent(val, pct);
                } else if (sign === '-') {
                    result = this.subtractPercent(val, pct);
                } else if (sign === '*') {
                    result = this.multiplyPercent(val, pct);
                } else if (sign === '/') {
                    result = this.dividePercent(val, pct);
                }
                const opDisplay = sign === '-' ? '−' : (sign === '*' ? '×' : (sign === '/' ? '÷' : '+'));
                return {
                    value: result,
                    history: `${Formatter.format(val)} ${opDisplay} ${pct}% =`
                };
            }

            // Numeric offset/multiplier (e.g. "+100", "-50", "*2", "/4")
            const numMatch = str.match(/^([+\-*/]?)\s*(\d+(?:\.\d+)?)$/);
            if (numMatch) {
                const sign = numMatch[1] || '+';
                const num = parseFloat(numMatch[2]);
                let result = val;
                if (sign === '+') result = this.add(val, num);
                else if (sign === '-') result = this.subtract(val, num);
                else if (sign === '*') result = this.multiply(val, num);
                else if (sign === '/') result = this.divide(val, num);
                const opDisplay = sign === '-' ? '−' : (sign === '*' ? '×' : (sign === '/' ? '÷' : '+'));
                return {
                    value: result,
                    history: `${Formatter.format(val)} ${opDisplay} ${Formatter.format(num)} =`
                };
            }

            return { value: val, history: '' };
        },

        /**
         * Mathematical Expression Parser & Evaluator (BODMAS / Operator Precedence)
         * Evaluates strings like "100 + 25 * 2", "(10 + 20) * 3", "100 - 10%", etc.
         * Pure tokenizer and Shunting-Yard evaluator with zero eval() or Function() calls.
         *
         * @param {string} expression
         * @param {Object} [options={}]
         * @returns {number}
         */
        evaluate(expression, options = {}) {
            if (!expression || typeof expression !== 'string') return 0;
            const precision = options.precision ?? this.precision;

            // Normalize symbols: '×' -> '*', '÷' -> '/', '−' -> '-'
            let clean = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-')
                .replace(/,/g, '')
                .trim();

            if (!clean) return 0;

            // Tokenize expression
            const tokens = [];
            let i = 0;
            let lastToken = null;

            while (i < clean.length) {
                const char = clean[i];

                if (/\s/.test(char)) {
                    i++;
                    continue;
                }

                // Numbers (including decimals)
                if (/\d/.test(char) || (char === '.' && i + 1 < clean.length && /\d/.test(clean[i + 1]))) {
                    let numStr = '';
                    while (i < clean.length && (/[\d.]/.test(clean[i]))) {
                        numStr += clean[i];
                        i++;
                    }
                    // Check if followed by %
                    let isPct = false;
                    while (i < clean.length && /\s/.test(clean[i])) i++;
                    if (i < clean.length && clean[i] === '%') {
                        isPct = true;
                        i++;
                    }
                    const numVal = parseFloat(numStr);
                    tokens.push({ type: 'number', value: numVal, isPercent: isPct });
                    lastToken = 'number';
                    continue;
                }

                // Operators & Parentheses
                if (char === '+' || char === '-' || char === '*' || char === '/' || char === '^' || char === '(' || char === ')') {
                    // Check for unary plus/minus
                    const isUnary = (char === '+' || char === '-') &&
                        (lastToken === null || lastToken === 'operator' || lastToken === 'lparen');

                    if (isUnary) {
                        tokens.push({ type: 'unary', value: char });
                        lastToken = 'unary';
                    } else if (char === '(') {
                        tokens.push({ type: 'lparen', value: '(' });
                        lastToken = 'lparen';
                    } else if (char === ')') {
                        tokens.push({ type: 'rparen', value: ')' });
                        lastToken = 'rparen';
                    } else {
                        tokens.push({ type: 'operator', value: char });
                        lastToken = 'operator';
                    }
                    i++;
                    continue;
                }

                // Skip any unrecognized characters
                i++;
            }

            if (tokens.length === 0) return 0;

            // Operator Precedence Map
            const precedence = {
                '+': 1,
                '-': 1,
                '*': 2,
                '/': 2,
                '^': 3,
                'u+': 4,
                'u-': 4
            };

            const outputQueue = [];
            const opStack = [];

            // Shunting-Yard Algorithm: infix to postfix (RPN)
            for (let t = 0; t < tokens.length; t++) {
                const token = tokens[t];

                if (token.type === 'number') {
                    outputQueue.push(token);
                } else if (token.type === 'unary') {
                    opStack.push({ type: 'unary', op: 'u' + token.value });
                } else if (token.type === 'operator') {
                    const op = token.value;
                    while (
                        opStack.length > 0 &&
                        opStack[opStack.length - 1].type !== 'lparen' &&
                        ((precedence[opStack[opStack.length - 1].op] > precedence[op]) ||
                            (precedence[opStack[opStack.length - 1].op] === precedence[op] && op !== '^'))
                    ) {
                        outputQueue.push(opStack.pop());
                    }
                    opStack.push({ type: 'operator', op: op });
                } else if (token.type === 'lparen') {
                    opStack.push(token);
                } else if (token.type === 'rparen') {
                    while (opStack.length > 0 && opStack[opStack.length - 1].type !== 'lparen') {
                        outputQueue.push(opStack.pop());
                    }
                    if (opStack.length > 0 && opStack[opStack.length - 1].type === 'lparen') {
                        opStack.pop();
                    }
                }
            }

            while (opStack.length > 0) {
                const op = opStack.pop();
                if (op.type !== 'lparen') {
                    outputQueue.push(op);
                }
            }

            // Postfix Evaluator
            const evalStack = [];
            for (let k = 0; k < outputQueue.length; k++) {
                const item = outputQueue[k];

                if (item.type === 'number') {
                    evalStack.push(item);
                } else if (item.type === 'unary') {
                    const operand = evalStack.pop();
                    const val = typeof operand === 'object' ? operand.value : operand;
                    const res = item.op === 'u-' ? -val : val;
                    evalStack.push({ type: 'number', value: res });
                } else if (item.type === 'operator') {
                    const rightToken = evalStack.pop();
                    const leftToken = evalStack.pop();

                    const left = typeof leftToken === 'object' ? leftToken.value : Number(leftToken);
                    let right = typeof rightToken === 'object' ? rightToken.value : Number(rightToken);

                    // Smart percentage handling
                    if (rightToken && rightToken.isPercent) {
                        if (item.op === '+' || item.op === '-') {
                            right = (left * right) / 100;
                        } else if (item.op === '*' || item.op === '/') {
                            right = right / 100;
                        }
                    }

                    let res = 0;
                    switch (item.op) {
                        case '+': res = left + right; break;
                        case '-': res = left - right; break;
                        case '*': res = left * right; break;
                        case '/': res = right === 0 ? 0 : left / right; break;
                        case '^': res = Math.pow(left, right); break;
                    }
                    evalStack.push({ type: 'number', value: res });
                }
            }

            if (evalStack.length === 0) return 0;
            const finalResult = evalStack[0].value ?? evalStack[0];
            return Formatter.round(Number(finalResult), precision);
        },

        /**
         * Factory to instantiate a decoupled Stream Calculator state machine
         * @param {Object} [config={}]
         * @returns {StreamCalculator}
         */
        createStream(config = {}) {
            return new StreamCalculator(config);
        }
    };

    /* ==========================================================================
       3. STREAM CALCULATOR STATE MACHINE (Desk / Chained Calculator)
       ========================================================================== */
    class StreamCalculator {
        constructor(config = {}) {
            this.config = Object.assign({
                precision: 8,
                currency: '',
                taxRate: 0.18,
                tipRates: [10, 15, 20],
                angleMode: 'deg',
                onCalculate: null
            }, config);

            this.reset();
        }

        reset() {
            this.currentInput = '0';
            this.previousValue = null;
            this.pendingOperator = null;
            this.historyTokens = [];
            this.hasJustCalculated = false;
            this.hasPercentApplied = false;
            this.rawPercent = null;
            this.memory = 0;
            this.tapeHistory = [];
        }

        inputDigit(digit) {
            if (this.hasJustCalculated) {
                this.currentInput = digit === '.' ? '0.' : digit;
                this.previousValue = null;
                this.pendingOperator = null;
                this.historyTokens = [];
                this.hasJustCalculated = false;
                this.hasPercentApplied = false;
                this.rawPercent = null;
                return;
            }

            this.hasPercentApplied = false;
            this.rawPercent = null;

            if (digit === '.') {
                if (!this.currentInput.includes('.')) {
                    this.currentInput = this.currentInput === '' || this.currentInput === '0' ? '0.' : this.currentInput + '.';
                }
            } else if (digit === '00') {
                if (this.currentInput === '0' || this.currentInput === '') {
                    this.currentInput = '0';
                } else {
                    this.currentInput += '00';
                }
            } else {
                if (this.currentInput === '0' || this.currentInput === '') {
                    this.currentInput = String(digit);
                } else {
                    this.currentInput += String(digit);
                }
            }
        }

        inputOperator(op) {
            const symbol = Formatter.getOperatorSymbol(op);

            if (this.hasJustCalculated) {
                const currentNum = this.parseCurrent();
                this.previousValue = currentNum;
                this.pendingOperator = op;
                this.historyTokens = [Formatter.format(currentNum), symbol];
                this.currentInput = '';
                this.hasJustCalculated = false;
                return;
            }

            if (this.previousValue === null) {
                const currentNum = this.parseCurrent();
                this.previousValue = currentNum;
                this.pendingOperator = op;
                this.historyTokens = [Formatter.format(currentNum), symbol];
                this.currentInput = '';
                return;
            }

            if (this.currentInput !== '') {
                const nextNum = parseFloat(this.currentInput);
                let calculated = 0;

                if (this.hasPercentApplied) {
                    const prevOp = this.pendingOperator;
                    if (prevOp === '+') calculated = this.previousValue + nextNum;
                    else if (prevOp === '-') calculated = this.previousValue - nextNum;
                    else if (prevOp === '*' || prevOp === 'x' || prevOp === '×') calculated = nextNum;
                    else if (prevOp === '/' || prevOp === '÷') {
                        const frac = this.rawPercent !== null ? (this.rawPercent / 100) : (nextNum / (this.previousValue || 1));
                        calculated = frac === 0 ? 0 : this.previousValue / frac;
                    } else {
                        calculated = this.calculate(this.previousValue, prevOp, nextNum);
                    }
                    calculated = Formatter.round(calculated, this.config.precision);
                    this.hasPercentApplied = false;
                    this.rawPercent = null;
                } else {
                    calculated = this.calculate(this.previousValue, this.pendingOperator, nextNum);
                }

                if (this.historyTokens.length > 0 && String(this.historyTokens[this.historyTokens.length - 1]).endsWith('%')) {
                    this.historyTokens.push(symbol);
                } else {
                    this.historyTokens.push(Formatter.format(nextNum), symbol);
                }
                this.previousValue = calculated;
                this.pendingOperator = op;
                this.currentInput = '';
                return;
            }

            // Change pending operator
            this.pendingOperator = op;
            if (this.historyTokens.length > 0) {
                this.historyTokens[this.historyTokens.length - 1] = symbol;
            }
        }

        inputEquals() {
            if (this.pendingOperator === null || this.previousValue === null) return this.parseCurrent();

            const nextNum = this.currentInput !== '' ? parseFloat(this.currentInput) : this.previousValue;
            let result = 0;

            if (this.hasPercentApplied) {
                const op = this.pendingOperator;
                if (op === '+') result = this.previousValue + nextNum;
                else if (op === '-') result = this.previousValue - nextNum;
                else if (op === '*' || op === 'x' || op === '×') result = nextNum;
                else if (op === '/' || op === '÷') {
                    const frac = this.rawPercent !== null ? (this.rawPercent / 100) : (nextNum / (this.previousValue || 1));
                    result = frac === 0 ? 0 : this.previousValue / frac;
                } else {
                    result = this.calculate(this.previousValue, op, nextNum);
                }
                result = Formatter.round(result, this.config.precision);
                this.hasPercentApplied = false;
                this.rawPercent = null;
            } else {
                result = this.calculate(this.previousValue, this.pendingOperator, nextNum);
            }

            if (this.historyTokens.length > 0 && String(this.historyTokens[this.historyTokens.length - 1]).endsWith('%')) {
                this.historyTokens.push('=');
            } else {
                this.historyTokens.push(Formatter.format(nextNum), '=');
            }

            const historyStr = this.historyTokens.join(' ');
            this.tapeHistory.unshift(`${historyStr} ${Formatter.format(result)}`);

            if (typeof this.config.onCalculate === 'function') {
                this.config.onCalculate(result, historyStr);
            }

            this.previousValue = result;
            this.currentInput = String(result);
            this.pendingOperator = null;
            this.hasJustCalculated = true;
            return result;
        }

        calculate(a, op, b) {
            let res = 0;
            switch (op) {
                case '+': res = a + b; break;
                case '-': res = a - b; break;
                case '*':
                case 'x':
                case '×':
                    res = a * b; break;
                case '/':
                case '÷':
                    res = b === 0 ? 0 : a / b; break;
                case '%':
                case 'mod':
                    res = a % b; break;
                case '^':
                case 'pow':
                    res = Math.pow(a, b); break;
                default: res = b;
            }
            return Formatter.round(res, this.config.precision);
        }

        toggleSign() {
            if (this.currentInput !== '' && this.currentInput !== '0') {
                if (this.currentInput.startsWith('-')) {
                    this.currentInput = this.currentInput.slice(1);
                } else {
                    this.currentInput = '-' + this.currentInput;
                }
            } else if (this.previousValue !== null) {
                this.previousValue = -this.previousValue;
                this.currentInput = String(this.previousValue);
            }
        }

        applyPercent() {
            const current = this.parseCurrent();
            if (this.previousValue !== null && this.pendingOperator !== null) {
                const percentVal = (this.previousValue * current) / 100;
                this.currentInput = String(Formatter.round(percentVal, this.config.precision));
                this.hasPercentApplied = true;
                this.rawPercent = current;
                this.historyTokens = [
                    Formatter.format(this.previousValue),
                    Formatter.getOperatorSymbol(this.pendingOperator),
                    `${Formatter.format(current)}%`
                ];
            } else {
                const percentVal = current / 100;
                this.currentInput = String(Formatter.round(percentVal, this.config.precision));
                this.hasPercentApplied = false;
                this.rawPercent = null;
                this.historyTokens = [`${Formatter.format(current)}%`];
            }
        }

        backspace() {
            if (this.hasJustCalculated) {
                this.clearAll();
                return;
            }
            if (this.currentInput.length > 1) {
                this.currentInput = this.currentInput.slice(0, -1);
            } else {
                this.currentInput = '0';
            }
        }

        clearAll() {
            this.currentInput = '0';
            this.previousValue = null;
            this.pendingOperator = null;
            this.historyTokens = [];
            this.hasJustCalculated = false;
            this.hasPercentApplied = false;
            this.rawPercent = null;
        }

        parseCurrent() {
            return parseFloat(this.currentInput) || 0;
        }

        getDisplayValue() {
            let displayVal = this.currentInput;
            if (displayVal === '' && this.previousValue !== null) {
                displayVal = String(this.previousValue);
            }
            if (displayVal === '') displayVal = '0';
            return displayVal;
        }

        getFormattedDisplay() {
            return Formatter.format(this.getDisplayValue(), { currency: this.config.currency });
        }

        getHistoryString() {
            return this.historyTokens.join(' ');
        }
    }

    /* ==========================================================================
       4. ADMINUIUX CALCULATOR (DOM Binding Layer)
       ========================================================================== */
    class AdminUIUXCalculator {
        constructor(element, config = {}) {
            if (typeof element === 'string') {
                this.wrapper = document.querySelector(element);
            } else {
                this.wrapper = element;
            }

            if (!this.wrapper) return;
            if (this.wrapper._calculatorInstance) return;
            this.wrapper._calculatorInstance = this;

            // Extract configuration from data attributes or arguments
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

            // Instantiate Decoupled Stream Calculator Engine
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

            // Format integer with commas
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

        // Static Factory Methods
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

    // Attach static namespaces to AdminUIUXCalculator for convenience
    AdminUIUXCalculator.Calculator = Calculator;
    AdminUIUXCalculator.Formatter = Formatter;
    AdminUIUXCalculator.StreamCalculator = StreamCalculator;

    // Automatic initialization in browser DOM
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => AdminUIUXCalculator.initAll());
        } else {
            AdminUIUXCalculator.initAll();
        }
    }

    return {
        AdminUIUXCalculator: AdminUIUXCalculator,
        Calculator: Calculator,
        Formatter: Formatter,
        StreamCalculator: StreamCalculator,
        default: AdminUIUXCalculator
    };
});
