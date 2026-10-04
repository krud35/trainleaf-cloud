import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import './LeafCard.css';

export type LeafCardProps = {
  variant: 'checkin' | 'goal' | 'period';
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

/** The illustration follows the measured HTML content; controls remain real HTML. */
export function LeafCard({ variant, children, className = '', onClick, ariaLabel }: LeafCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [size, setSize] = useState({ width: 320, height: 380 });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (width && height) setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const { width: w, height: h } = size, bx = w * .23, by = h - 49;
  const right = `C${w - 24} 62 ${w - 7} 95 ${w - 4} 142 C${w + 4} ${h * .55} ${w + 4} ${h - 155} ${w - 17} ${h - 107} C${w - 57} ${h - 32} ${w * .62} ${h - 16} ${bx} ${by}`;
  const content = <><svg className="leaf-card-art" aria-hidden="true" focusable="false" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"><g transform={variant === 'goal' ? `translate(${w} 0) scale(-1 1)` : undefined}>
    <path className="leaf-card-blade" d={`M${bx} ${by} C34 ${h - 71} 9 ${h - 122} 10 ${h - 171} C8 ${Math.min(h - 215, h * .46)} 8 154 33 106 C66 28 ${w * .65} 55 ${w - 14} 9 ${right} Z`} />
    <path className="leaf-card-wash" d={`M${bx} ${by} C${w * .54} ${h * .73} ${w * .67} ${h * .36} ${w - 14} 9 ${right} Z`} />
    <path className="leaf-card-midrib" d={`M${bx} ${by} C${w * .54} ${h * .73} ${w * .67} ${h * .36} ${w - 14} 9`} />
    <path className="leaf-card-veins" d={`M${w * .32} ${h - 83} Q${w * .17} ${h - 103} 25 ${h * .64} M${w * .43} ${h * .71} Q${w * .75} ${h * .79} ${w - 30} ${h * .66} M${w * .49} ${h * .60} Q${w * .22} ${h * .51} 29 ${h * .37} M${w * .60} ${h * .44} Q${w * .81} ${h * .47} ${w - 21} ${h * .34} M${w * .68} ${h * .31} Q${w * .48} ${h * .22} ${w * .38} 66 M${w * .79} ${h * .18} Q${w * .89} ${h * .20} ${w - 21} 71`} />
    <path className="leaf-card-edge" d={`M38 118 C48 81 72 66 100 60 M${w - 17} ${h * .58} Q${w - 28} ${h * .77} ${w * .72} ${h - 47}`} />
    <path className="leaf-card-stem" d={`M${bx + 4} ${by - 5} Q${bx - 16} ${h - 25} 19 ${h - 8} M${bx + 9} ${by - 4} Q${bx - 12} ${h - 22} 22 ${h - 6}`} />
  </g></svg><div className="leaf-card-copy">{children}</div></>;
  const classes = `leaf-card leaf-card-${variant} ${className}`;
  return onClick ? <button ref={element => { ref.current = element; }} type="button" className={classes} onClick={onClick} aria-label={ariaLabel}>{content}</button> : <article ref={element => { ref.current = element; }} className={classes} aria-label={ariaLabel}>{content}</article>;
}
