/**
 * @adminuiux/calculator - Core Calculator Engine
 * Framework-independent mathematical evaluation engine and stream calculator state machine.
 *
 * @license MIT
 * @copyright AdminUIUX
 */

'use strict';

import { Formatter } from './formatter.js';

export class StreamCalculator {
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
            this.currentInput = digit === '.' ? '0.' : String(digit);
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
                this.currentInput = (this.currentInput === '' || this.currentInput === '0') ? '0.' : this.currentInput + '.';
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

export const Calculator = {
    precision: 8,

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

    format(value, options) {
        return Formatter.format(value, options);
    },

    executePerform(currentVal, expr) {
        if (!expr) return { value: currentVal, history: '' };
        const str = String(expr).trim();
        const val = Number(currentVal) || 0;

        const pctMatch = str.match(/^([+\-*/]?)\s*(\d+(?:\.\d+)?)\s*%$/);
        if (pctMatch) {
            const sign = pctMatch[1] || '+';
            const pct = parseFloat(pctMatch[2]);
            let result = val;
            if (sign === '+' || !pctMatch[1]) result = this.addPercent(val, pct);
            else if (sign === '-') result = this.subtractPercent(val, pct);
            else if (sign === '*') result = this.multiplyPercent(val, pct);
            else if (sign === '/') result = this.dividePercent(val, pct);
            const opDisplay = sign === '-' ? '−' : (sign === '*' ? '×' : (sign === '/' ? '÷' : '+'));
            return {
                value: result,
                history: `${Formatter.format(val)} ${opDisplay} ${pct}% =`
            };
        }

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

    evaluate(expression, options = {}) {
        if (!expression || typeof expression !== 'string') return 0;
        const precision = options.precision ?? this.precision;

        let clean = expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/,/g, '')
            .trim();

        if (!clean) return 0;

        const tokens = [];
        let i = 0;
        let lastToken = null;

        while (i < clean.length) {
            const char = clean[i];

            if (/\s/.test(char)) {
                i++;
                continue;
            }

            if (/\d/.test(char) || (char === '.' && i + 1 < clean.length && /\d/.test(clean[i + 1]))) {
                let numStr = '';
                while (i < clean.length && (/[\d.]/.test(clean[i]))) {
                    numStr += clean[i];
                    i++;
                }
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

            if (char === '+' || char === '-' || char === '*' || char === '/' || char === '^' || char === '(' || char === ')') {
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

            i++;
        }

        if (tokens.length === 0) return 0;

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

    createStream(config = {}) {
        return new StreamCalculator(config);
    }
};

export default Calculator;
