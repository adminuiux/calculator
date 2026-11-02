/**
 * TypeScript Declarations for @adminuiux/calculator
 */

export interface CalculatorOptions {
    precision?: number;
    angleMode?: 'deg' | 'rad';
    enableKeyboard?: boolean;
    currency?: string;
    onCalculate?: (val: number | string) => void;
    onDestroy?: () => void;
    [key: string]: any;
}

export declare class Formatter {
    static round(value: number, precision?: number): number;
    static format(num: number | string, options?: any): string;
    static parse(str: string): number;
    static getOperatorSymbol(op: string): string;
}

export declare class Calculator {
    constructor(precision?: number);
    precision: number;
    add(a: number, b: number): number;
    subtract(a: number, b: number): number;
    multiply(a: number, b: number): number;
    divide(a: number, b: number): number;
    evaluate(expression: string, options?: any): number;
    sin(val: number, angleMode?: string): number;
    cos(val: number, angleMode?: string): number;
    tan(val: number, angleMode?: string): number;
    sqrt(val: number): number;
    percent(value: number, percentage: number): number;
    tax(amount: number, rate?: number, isAdd?: boolean): number;
    tip(amount: number, percent?: number): number;
    discount(amount: number, percent?: number): number;
}

export declare class StreamCalculator {
    constructor(config?: any);
    inputDigit(digit: string): void;
    inputOperator(op: string): void;
    inputEquals(): number | string;
    clearAll(): void;
    backspace(): void;
    getDisplayValue(): string;
    getFormattedDisplay(): string;
}

export declare class AdminUIUXCalculator {
    constructor(element: HTMLElement | string, config?: CalculatorOptions);

    element: HTMLElement;
    wrapper: HTMLElement;
    config: CalculatorOptions;
    engine: StreamCalculator;

    handleAction(action: string, val?: string): void;
    updateDisplay(): void;
    destroy(): void;

    static create(target: HTMLElement | string, options?: CalculatorOptions): AdminUIUXCalculator | null;
    static init(target: HTMLElement | string, options?: CalculatorOptions): AdminUIUXCalculator | null;
    static initAll(): void;
    static destroyAll(): void;
    static Calculator: typeof Calculator;
    static Formatter: typeof Formatter;
    static StreamCalculator: typeof StreamCalculator;
}

export default AdminUIUXCalculator;

