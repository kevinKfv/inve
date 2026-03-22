'use client';
import { useEffect, useState, useRef } from 'react';

interface Props {
  value: number;
  format?: 'usd' | 'pct';
  className?: string;
}

export default function LiveValue({ value, format, className = '' }: Props) {
  const [flashClass, setFlashClass] = useState('');
  const prevValue = useRef(value);

  useEffect(() => {
    if (value > prevValue.current) {
      setFlashClass('flash-green');
      setTimeout(() => setFlashClass(''), 1000);
    } else if (value < prevValue.current) {
      setFlashClass('flash-red');
      setTimeout(() => setFlashClass(''), 1000);
    }
    prevValue.current = value;
  }, [value]);

  let displayStr = '';
  if (format === 'usd') {
    displayStr = `$${value.toFixed(value > 100 ? 2 : 4)}`;
  } else if (format === 'pct') {
    displayStr = `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  } else {
    displayStr = value.toString();
  }

  return (
    <span className={`${className} ${flashClass} transition-colors duration-300 px-1 rounded`}>
      {displayStr}
    </span>
  );
}
