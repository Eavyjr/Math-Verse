
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Minus, XIcon, Divide, Percent, SquareRoot, Sigma, MoreHorizontal, RotateCcw, Binary, FunctionSquare } from 'lucide-react'; // Using XIcon for multiply

const CalculatorButton = ({
  onClick,
  label,
  className = '',
  variant = 'outline',
  size = 'default',
  children,
}: {
  onClick: () => void;
  label?: string | number | React.ReactNode;
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
  const [currentOperand, setCurrentOperand] = useState<string | null>(null); // Not actively used in this simplified version but kept for potential future expansion
  const [previousOperand, setPreviousOperand] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [isRadians, setIsRadians] = useState(true); // Default to Radians

  const inputDigit = (digit: string) => {
    if (displayValue === 'Error') {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
      return;
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
      setDisplayValue(displayValue + '.');
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
    // This simplified CE resets the current display. 
    // If an operation was pending, the user can type the new second operand.
    if (operation && previousOperand !== null) {
      setWaitingForSecondOperand(false); // Allow new number input for the second operand
    } else {
      // If no operation pending, or it's a fresh start, reset more fully
      setPreviousOperand(null);
      setOperation(null);
      setWaitingForSecondOperand(false);
    }
  };

  const backspace = () => {
    if (displayValue === 'Error') {
      clearAll();
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
      const resultString = String(parseFloat(result.toPrecision(12)));
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
    setDisplayValue(String(parseFloat(result.toPrecision(12))));
    setPreviousOperand(null); 
    setOperation(null);
    setWaitingForSecondOperand(true); 
  };
  
  const handleUnaryOperation = (unaryOp: string) => {
    if (displayValue === 'Error' && unaryOp !== 'π' && unaryOp !== 'e') return;
    
    let value = parseFloat(displayValue);
    let result = 0;
    
    // For π and e, we set displayValue directly
    if (unaryOp === 'π') {
      setDisplayValue(String(Math.PI));
      setWaitingForSecondOperand(true);
      return;
    }
    if (unaryOp === 'e') {
      setDisplayValue(String(Math.E));
      setWaitingForSecondOperand(true);
      return;
    }

    if (isNaN(value)) {
      setDisplayValue("Error");
      return;
    }

    switch (unaryOp) {
      case 'sqrt': result = Math.sqrt(value); break;
      case 'x²': result = value * value; break;
      case 'sin': result = isRadians ? Math.sin(value) : Math.sin(value * Math.PI / 180); break;
      case 'cos': result = isRadians ? Math.cos(value) : Math.cos(value * Math.PI / 180); break;
      case 'tan': result = isRadians ? Math.tan(value) : Math.tan(value * Math.PI / 180); break;
      case 'log': result = Math.log10(value); break;
      case 'ln': result = Math.log(value); break;
      case '±': result = value * -1; break;
      case '%': result = value / 100; break;
      case 'x!':
        if (value < 0 || !Number.isInteger(value) || value > 20) { // Added upper limit for practical factorial
            setDisplayValue('Error'); return; 
        }
        if (value === 0) { result = 1; break; }
        result = 1;
        for (let i = value; i > 0; i--) result *= i;
        break;
      default: return;
    }

    if (isNaN(result) || !isFinite(result)) {
      setDisplayValue("Error");
    } else {
      setDisplayValue(String(parseFloat(result.toPrecision(12))));
    }
    setWaitingForSecondOperand(true); 
  };

  const handleParenthesis = (p: string) => {
    if (displayValue === 'Error' && p === '(') {
      setDisplayValue(p);
      setWaitingForSecondOperand(false);
      return;
    }
    // This is a simplified parenthesis handling: just appends.
    // True order of operations requires a proper parsing engine (e.g., shunting-yard or math.js).
    setDisplayValue(prev => (prev === '0' && p === '(') || waitingForSecondOperand ? p : prev + p);
    setWaitingForSecondOperand(false);
  };

  const buttonLayout = [
    { label: isRadians ? 'Rad' : 'Deg', action: () => setIsRadians(!isRadians), className: 'bg-muted/50 hover:bg-muted text-xs col-span-1' },
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
    { icon: <Divide size={24} />, action: () => performOperation('/'), className: 'bg-accent hover:bg-accent/90 text-accent-foreground' },

    { label: 'cos', action: () => handleUnaryOperation('cos'), className: 'bg-muted/50 hover:bg-muted' },
    { label: 'log', action: () => handleUnaryOperation('log'), className: 'bg-muted/50 hover:bg-muted' },
    { label: '4', action: () => inputDigit('4'), className:'bg-card hover:bg-card/90' },
    { label: '5', action: () => inputDigit('5'), className:'bg-card hover:bg-card/90' },
    { label: '6', action: () => inputDigit('6'), className:'bg-card hover:bg-card/90' },
    { icon: <XIcon size={24} />, action: () => performOperation('*'), className: 'bg-accent hover:bg-accent/90 text-accent-foreground' },

    { label: 'tan', action: () => handleUnaryOperation('tan'), className: 'bg-muted/50 hover:bg-muted' },
    { label: <SquareRoot size={24} />, action: () => handleUnaryOperation('sqrt'), className: 'bg-muted/50 hover:bg-muted' },
    { label: '1', action: () => inputDigit('1'), className:'bg-card hover:bg-card/90' },
    { label: '2', action: () => inputDigit('2'), className:'bg-card hover:bg-card/90' },
    { label: '3', action: () => inputDigit('3'), className:'bg-card hover:bg-card/90' },
    { icon: <Minus size={24} />, action: () => performOperation('-'), className: 'bg-accent hover:bg-accent/90 text-accent-foreground' },
    
    { label: 'e', action: () => handleUnaryOperation('e'), className: 'bg-muted/50 hover:bg-muted' },
    { label: 'x²', action: () => handleUnaryOperation('x²'), className: 'bg-muted/50 hover:bg-muted' },
    { label: '0', action: () => inputDigit('0'), className:'bg-card hover:bg-card/90' },
    { label: '.', action: inputDecimal, className:'bg-card hover:bg-card/90' },
    { label: 'π', action: () => handleUnaryOperation('π'), className: 'bg-muted/50 hover:bg-muted'},
    { icon: <Plus size={24} />, action: () => performOperation('+'), className: 'bg-accent hover:bg-accent/90 text-accent-foreground' },

    { label: 'C', action: clearEntry, className: 'col-span-2 bg-destructive/60 hover:bg-destructive/80 text-destructive-foreground'},
    { label: '±', action: () => handleUnaryOperation('±'), className:'bg-card hover:bg-card/90' },
    { label: <RotateCcw size={20} className="mx-auto"/> , action: backspace, className:'bg-card hover:bg-card/90' }, // Backspace
    { label: '=', action: handleEquals, className: 'col-span-2 bg-primary hover:bg-primary/90 text-primary-foreground text-2xl' },
  ];

  return (
    <div className="p-3 bg-popover rounded-lg shadow-xl w-full max-w-xs mx-auto border border-border">
      <div className="bg-background text-foreground text-right p-4 rounded-md mb-4 shadow-inner min-h-[70px] flex flex-col justify-end">
        <div 
          className="text-4xl font-mono font-semibold overflow-x-auto overflow-y-hidden no-scrollbar" 
          style={{ wordBreak: 'break-all', whiteSpace: 'nowrap', direction: 'rtl' }} // Ensure scroll happens from right
        >
          {displayValue}
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {buttonLayout.map((btn, index) => (
          <CalculatorButton
            key={index}
            onClick={btn.action}
            className={btn.className || (typeof btn.label === 'string' && /^[0-9.]$/.test(btn.label) ? 'bg-secondary hover:bg-secondary/80' : 'bg-muted hover:bg-muted/80')}
          >
            {btn.icon || btn.label}
          </CalculatorButton>
        ))}
      </div>
    </div>
  );
}
