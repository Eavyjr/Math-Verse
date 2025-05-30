
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Minus, Divide, Percent, SquareRoot, Sigma, MoreHorizontal, RotateCcw, Binary, FunctionSquare, XIcon as MultiplyIcon } from 'lucide-react';

const MAX_DIGITS = 11; // Changed from 12 to 11

const CalculatorButton = ({
  onClick,
  label,
  className = '',
  variant = 'outline',
  size = 'default',
  children,
}: {
  onClick: () => void;
  label?: string | number | React.ReactNode; // Updated to allow ReactNode
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  children?: React.ReactNode;
}) => (
  <Button
    variant={variant}
    size={size}
    className={`text-lg font-medium h-14 w-full rounded-md shadow-sm active:shadow-inner transition-all ${className}`}
    onClick={onClick}
  >
    {children || label}
  </Button>
);

export default function PopupCalculator() {
  const [displayValue, setDisplayValue] = useState('0');
  const [currentOperand, setCurrentOperand] = useState<string | null>(null); // Not actively used in current simplified logic but good for future
  const [previousOperand, setPreviousOperand] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [isRadians, setIsRadians] = useState(true);

  const formatDisplayValue = (num: number | string): string => {
    let numStr = String(num);
    if (numStr.length > MAX_DIGITS) {
      const n = Number(num);
      if (Math.abs(n) > 1e11 || (Math.abs(n) < 1e-5 && Math.abs(n) > 0)) { // Adjust thresholds for scientific notation if needed
        numStr = n.toExponential(MAX_DIGITS - 6); // e.g. for 11 digits, 11-6 = 5 for precision
        if (numStr.length > MAX_DIGITS) { // toExponential can sometimes exceed with sign/e+XX
            numStr = n.toExponential(MAX_DIGITS - 7);
        }
      } else {
        // Truncate, try to keep decimal if possible
        if (numStr.includes('.')) {
            const decimalPointIndex = numStr.indexOf('.');
            if (decimalPointIndex < MAX_DIGITS -1) { // if decimal point is within limit
                 numStr = numStr.substring(0, MAX_DIGITS);
            } else { // decimal point itself is too far, just truncate integer part
                 numStr = numStr.substring(0, MAX_DIGITS);
            }
        } else {
            numStr = numStr.substring(0, MAX_DIGITS);
        }
      }
    }
    // Ensure it still doesn't exceed due to formatting like -1.23e+10
    if (numStr.length > MAX_DIGITS) {
        return Number(num).toPrecision(MAX_DIGITS - (numStr.startsWith('-') ? 1 : 0) - (numStr.includes('e') ? 4 : 0) - (numStr.includes('.')? 1:0) );
    }
    return numStr;
  };


  const inputDigit = (digit: string) => {
    if (displayValue === 'Error') {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
      return;
    }

    const currentLength = displayValue.replace(/^-/, '').replace(/\./, '').length;
    if (currentLength >= MAX_DIGITS && !waitingForSecondOperand) {
        return; // Max digits reached for current number input
    }

    if (waitingForSecondOperand) {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplayValue(displayValue === '0' && digit !== '.' ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (displayValue === 'Error') {
      setDisplayValue('0.');
      setWaitingForSecondOperand(false);
      return;
    }
    if (waitingForSecondOperand) {
      setDisplayValue('0.');
      setWaitingForSecondOperand(false);
      return;
    }
    if (!displayValue.includes('.')) {
      if (displayValue.replace(/^-/, '').length < MAX_DIGITS) {
        setDisplayValue(displayValue + '.');
      }
    }
  };

  const clearAll = () => {
    setDisplayValue('0');
    setCurrentOperand(null);
    setPreviousOperand(null);
    setOperation(null);
    setWaitingForSecondOperand(false);
  };

  const clearEntry = () => {
    setDisplayValue('0');
    if (operation && previousOperand !== null && waitingForSecondOperand) {
      // If an operation was pending and we were waiting for the second operand,
      // clearing entry effectively cancels the second operand input.
      // The display is reset to 0, ready for new input for the second operand.
      // The previousOperand and operation remain.
    } else {
      // If it's the first operand, or after an equals, clear everything like AC
      // Or, if we just finished an operation and result is shown (waitingForSecondOperand is true, but operation just completed)
      // This logic might need refinement based on desired CE behavior in all states.
      // For now, a simple CE just resets the current display.
      // A more robust CE might revert to the previous operand if an operation was active.
    }
  };

  const backspace = () => {
    if (displayValue === 'Error' || waitingForSecondOperand) {
      // Don't allow backspace if error or if result of an operation is shown
      // and we are waiting for a new number.
      // To edit the result, user should start typing a new number.
      return;
    }
    if (displayValue.length > 1) {
      setDisplayValue(displayValue.slice(0, -1));
    } else if (displayValue !== '0') {
      setDisplayValue('0');
    }
  };

  const performOperation = (nextOperation: string) => {
    if (displayValue === 'Error') return;

    const inputValue = parseFloat(displayValue);

    if (previousOperand === null) {
      setPreviousOperand(displayValue);
    } else if (operation) {
      const prevValue = parseFloat(previousOperand);
      let result = 0;

      switch (operation) {
        case '+': result = prevValue + inputValue; break;
        case '-': result = prevValue - inputValue; break;
        case '*': result = prevValue * inputValue; break;
        case '/':
          if (inputValue === 0) {
            setDisplayValue('Error');
            setPreviousOperand(null);
            setOperation(null);
            setWaitingForSecondOperand(false);
            return;
          }
          result = prevValue / inputValue;
          break;
        default: return;
      }
      const resultString = formatDisplayValue(result);
      setDisplayValue(resultString);
      setPreviousOperand(resultString);
    }

    setWaitingForSecondOperand(true);
    setOperation(nextOperation);
  };

  const handleEquals = () => {
    if (displayValue === 'Error' || !operation || previousOperand === null) return;

    const prevValue = parseFloat(previousOperand);
    const currentValue = parseFloat(displayValue);
    let result = 0;

    switch (operation) {
      case '+': result = prevValue + currentValue; break;
      case '-': result = prevValue - currentValue; break;
      case '*': result = prevValue * currentValue; break;
      case '/':
        if (currentValue === 0) {
          setDisplayValue('Error');
          setPreviousOperand(null);
          setOperation(null);
          setWaitingForSecondOperand(false);
          return;
        }
        result = prevValue / currentValue;
        break;
      default: return;
    }
    setDisplayValue(formatDisplayValue(result));
    setPreviousOperand(null); // Reset for new calculation sequence
    setOperation(null);
    setWaitingForSecondOperand(true); // Ready for a new calculation starting with this result
  };

  const handleUnaryOperation = (unaryOp: string) => {
    if (displayValue === 'Error' && unaryOp !== 'π' && unaryOp !== 'e') return;

    let value = parseFloat(displayValue);
    let result: number | string = 0;

    if (unaryOp === 'π') {
      setDisplayValue(formatDisplayValue(Math.PI));
      setWaitingForSecondOperand(true); 
      return;
    }
    if (unaryOp === 'e') {
      setDisplayValue(formatDisplayValue(Math.E));
      setWaitingForSecondOperand(true);
      return;
    }

    if (isNaN(value) && !['π', 'e'].includes(unaryOp)) {
      setDisplayValue("Error");
      return;
    }

    switch (unaryOp) {
      case 'sqrt': 
        if (value < 0) { setDisplayValue("Error"); return; }
        result = Math.sqrt(value); 
        break;
      case 'x²': result = value * value; break;
      case 'sin': result = isRadians ? Math.sin(value) : Math.sin(value * Math.PI / 180); break;
      case 'cos': result = isRadians ? Math.cos(value) : Math.cos(value * Math.PI / 180); break;
      case 'tan': 
        const angleRad = isRadians ? value : value * Math.PI / 180;
        // Check for tan of 90 degrees / 270 degrees etc. (where cos is 0)
        if (Math.abs(Math.cos(angleRad)) < 1e-12) { setDisplayValue("Error"); return; }
        result = Math.tan(angleRad); 
        break;
      case 'log': // base 10
        if (value <= 0) { setDisplayValue("Error"); return; }
        result = Math.log10(value); 
        break;
      case 'ln': // natural log
        if (value <= 0) { setDisplayValue("Error"); return; }
        result = Math.log(value); 
        break;
      case '±': result = value * -1; break;
      case '%': result = value / 100; break;
      case 'x!':
        if (value < 0 || !Number.isInteger(value) || value > 20) { // Factorial limit for typical display
            setDisplayValue('Error'); return;
        }
        if (value === 0) { result = 1; break; }
        result = 1;
        for (let i = value; i > 0; i--) result *= i;
        break;
      default: return;
    }

    if (isNaN(result as number) || !isFinite(result as number)) {
      setDisplayValue("Error");
    } else {
      setDisplayValue(formatDisplayValue(result));
    }
    setWaitingForSecondOperand(true); // Result of unary op can be start of new binary op
  };

  const handleParenthesis = (p: string) => {
    // Basic parenthesis handling: just append. Full parsing is complex.
    if (displayValue === 'Error' && p === '(') {
      setDisplayValue(p);
      setWaitingForSecondOperand(false);
      return;
    }
    // If waiting for an operand (after an operator was pressed), start new number with parenthesis
    if (waitingForSecondOperand && p === '(') {
      setDisplayValue(p);
      setWaitingForSecondOperand(false);
      return;
    }
    
    const currentLength = displayValue.replace(/^-/, '').replace(/\./, '').length;
    if (currentLength < MAX_DIGITS || p === ')' ) { // Allow closing parenthesis even if near limit
       setDisplayValue(prev => (prev === '0' && p === '(') ? p : prev + p);
    }
    setWaitingForSecondOperand(false); // Typing parenthesis means we are actively editing/forming a number
  };

  // Icon definitions with fallbacks
  const sqrtIcon = typeof SquareRoot === 'function' ? <SquareRoot size={24} /> : '√';
  const divideIcon = typeof Divide === 'function' ? <Divide size={24} /> : '/';
  const multiplyIconContent = typeof MultiplyIcon === 'function' ? <MultiplyIcon size={24} /> : '*';
  const minusIcon = typeof Minus === 'function' ? <Minus size={24} /> : '-';
  const plusIcon = typeof Plus === 'function' ? <Plus size={24} /> : '+';
  const backspaceIcon = typeof RotateCcw === 'function' ? <RotateCcw size={20} className="mx-auto"/> : 'Bksp';


  const buttonLayout = [
    { children: isRadians ? 'Rad' : 'Deg', action: () => setIsRadians(!isRadians), className: 'bg-muted/50 hover:bg-muted text-xs col-span-1' },
    { label: 'x!', action: () => handleUnaryOperation('x!'), className: 'bg-muted/50 hover:bg-muted' },
    { label: '(', action: () => handleParenthesis('('), className: 'bg-muted/50 hover:bg-muted' },
    { label: ')', action: () => handleParenthesis(')'), className: 'bg-muted/50 hover:bg-muted' },
    { label: '%', action: () => handleUnaryOperation('%'), className: 'bg-muted/50 hover:bg-muted' },
    { label: 'AC', action: clearAll, className: 'bg-destructive/80 hover:bg-destructive text-destructive-foreground' },
    
    { label: 'sin', action: () => handleUnaryOperation('sin'), className: 'bg-muted/50 hover:bg-muted' },
    { label: 'ln', action: () => handleUnaryOperation('ln'), className: 'bg-muted/50 hover:bg-muted' },
    { label: '7', action: () => inputDigit('7'), className:'bg-card hover:bg-card/90' },
    { label: '8', action: () => inputDigit('8'), className:'bg-card hover:bg-card/90' },
    { label: '9', action: () => inputDigit('9'), className:'bg-card hover:bg-card/90' },
    { children: divideIcon, action: () => performOperation('/'), className: 'bg-accent hover:bg-accent/90 text-accent-foreground' },

    { label: 'cos', action: () => handleUnaryOperation('cos'), className: 'bg-muted/50 hover:bg-muted' },
    { label: 'log', action: () => handleUnaryOperation('log'), className: 'bg-muted/50 hover:bg-muted' },
    { label: '4', action: () => inputDigit('4'), className:'bg-card hover:bg-card/90' },
    { label: '5', action: () => inputDigit('5'), className:'bg-card hover:bg-card/90' },
    { label: '6', action: () => inputDigit('6'), className:'bg-card hover:bg-card/90' },
    { children: multiplyIconContent, action: () => performOperation('*'), className: 'bg-accent hover:bg-accent/90 text-accent-foreground' },

    { label: 'tan', action: () => handleUnaryOperation('tan'), className: 'bg-muted/50 hover:bg-muted' },
    { children: sqrtIcon, action: () => handleUnaryOperation('sqrt'), className: 'bg-muted/50 hover:bg-muted' },
    { label: '1', action: () => inputDigit('1'), className:'bg-card hover:bg-card/90' },
    { label: '2', action: () => inputDigit('2'), className:'bg-card hover:bg-card/90' },
    { label: '3', action: () => inputDigit('3'), className:'bg-card hover:bg-card/90' },
    { children: minusIcon, action: () => performOperation('-'), className: 'bg-accent hover:bg-accent/90 text-accent-foreground' },
    
    { label: 'e', action: () => handleUnaryOperation('e'), className: 'bg-muted/50 hover:bg-muted' },
    { label: 'x²', action: () => handleUnaryOperation('x²'), className: 'bg-muted/50 hover:bg-muted' },
    { label: '0', action: () => inputDigit('0'), className:'bg-card hover:bg-card/90' },
    { label: '.', action: inputDecimal, className:'bg-card hover:bg-card/90' },
    { label: 'π', action: () => handleUnaryOperation('π'), className: 'bg-muted/50 hover:bg-muted'},
    { children: plusIcon, action: () => performOperation('+'), className: 'bg-accent hover:bg-accent/90 text-accent-foreground' },

    { label: 'C', action: clearEntry, className: 'col-span-2 bg-destructive/60 hover:bg-destructive/80 text-destructive-foreground'},
    { label: '±', action: () => handleUnaryOperation('±'), className:'bg-card hover:bg-card/90' },
    { children: backspaceIcon, action: backspace, className:'bg-card hover:bg-card/90' },
    { label: '=', action: handleEquals, className: 'col-span-2 bg-primary hover:bg-primary/90 text-primary-foreground text-2xl' },
  ];

  return (
    <div className="p-3 bg-popover rounded-lg shadow-xl w-full max-w-xs mx-auto border border-border">
      <div className="bg-background text-foreground text-right p-4 rounded-md mb-4 shadow-inner min-h-[70px] flex flex-col justify-end">
        <div 
          className="text-4xl font-mono font-semibold overflow-x-auto overflow-y-hidden no-scrollbar" 
          style={{ wordBreak: 'break-all', whiteSpace: 'nowrap', direction: 'rtl' }}
        >
          {displayValue}
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {buttonLayout.map((btn, index) => (
          <CalculatorButton
            key={index}
            onClick={btn.action}
            label={btn.label} 
            className={btn.className || ''}
          >
            {btn.children} 
          </CalculatorButton>
        ))}
      </div>
    </div>
  );
}

