import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  /** Texto que se muestra en la línea de expresión (superior) */
  expression: string = '';

  /** Texto que se muestra en la línea de resultado (grande) */
  currentInput: string = '';

  /** Modo de ángulo para funciones trigonométricas */
  angleMode: 'deg' | 'rad' = 'deg';

  /** Indica si la última operación fue un resultado (para reiniciar input) */
  private justCalculated: boolean = false;

  constructor() {}

  // ────────────────────────────────────────────────────────
  // Entrada de caracteres básicos
  // ────────────────────────────────────────────────────────

  appendChar(char: string): void {
    // Si acaba de calcularse, reiniciar para nueva operación
    if (this.justCalculated) {
      // Si el usuario escribe un operador, continúa con el resultado
      if (['+', '-', '*', '/', '^', '%'].includes(char)) {
        this.expression = this.currentInput;
        this.currentInput = '';
      } else {
        this.expression = '';
        this.currentInput = '';
      }
      this.justCalculated = false;
    }

    // Evitar múltiples puntos decimales en el número actual
    if (char === '.') {
      const parts = this.currentInput.split(/[\+\-\*\/\^%]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('.')) return;
    }

    this.currentInput += char;
  }

  // ────────────────────────────────────────────────────────
  // Funciones científicas — agregan notación funcional
  // ────────────────────────────────────────────────────────

  appendFunction(fn: string): void {
    if (this.justCalculated) {
      this.expression = '';
      this.currentInput = '';
      this.justCalculated = false;
    }
    this.currentInput += `${fn}(`;
  }

  // ────────────────────────────────────────────────────────
  // Borrar todo (C)
  // ────────────────────────────────────────────────────────

  clearAll(): void {
    this.currentInput = '';
    this.expression = '';
    this.justCalculated = false;
  }

  // ────────────────────────────────────────────────────────
  // Borrar último carácter (⌫)
  // ────────────────────────────────────────────────────────

  backspace(): void {
    if (this.justCalculated) {
      this.clearAll();
      return;
    }
    if (this.currentInput.length > 0) {
      this.currentInput = this.currentInput.slice(0, -1);
    }
  }

  // ────────────────────────────────────────────────────────
  // Alternar signo (+/−)
  // ────────────────────────────────────────────────────────

  toggleNegate(): void {
    if (!this.currentInput) return;
    if (this.currentInput.startsWith('-')) {
      this.currentInput = this.currentInput.slice(1);
    } else {
      this.currentInput = '-' + this.currentInput;
    }
  }

  // ────────────────────────────────────────────────────────
  // Alternar modo DEG / RAD
  // ────────────────────────────────────────────────────────

  toggleAngleMode(): void {
    this.angleMode = this.angleMode === 'deg' ? 'rad' : 'deg';
  }

  // ────────────────────────────────────────────────────────
  // Calcular resultado (=)  — Sesión 2: se moverá al servicio
  // ────────────────────────────────────────────────────────

  calculate(): void {
    if (!this.currentInput.trim()) return;

    try {
      const result = this.evaluateExpression(this.currentInput);
      this.expression = this.currentInput + ' =';
      this.currentInput = this.formatResult(result);
      this.justCalculated = true;
    } catch (err: any) {
      this.expression = this.currentInput;
      this.currentInput = 'Error';
      this.justCalculated = true;
    }
  }

  // ────────────────────────────────────────────────────────
  // Evaluador de expresiones (placeholder para Sesión 2)
  // ────────────────────────────────────────────────────────

  private evaluateExpression(expr: string): number {
    // Reemplazar funciones científicas con sus equivalentes JS
    let processed = expr
      .replace(/sqrt\(/g,   'Math.sqrt(')
      .replace(/log\(/g,    'Math.log10(')
      .replace(/ln\(/g,     'Math.log(')
      .replace(/asin\(/g,   this.angleMode === 'deg' ? '(180/Math.PI)*Math.asin(' : 'Math.asin(')
      .replace(/acos\(/g,   this.angleMode === 'deg' ? '(180/Math.PI)*Math.acos(' : 'Math.acos(')
      .replace(/atan\(/g,   this.angleMode === 'deg' ? '(180/Math.PI)*Math.atan(' : 'Math.atan(')
      .replace(/sin\(/g,    this.angleMode === 'deg' ? 'Math.sin((Math.PI/180)*(' : 'Math.sin(')
      .replace(/cos\(/g,    this.angleMode === 'deg' ? 'Math.cos((Math.PI/180)*(' : 'Math.cos(')
      .replace(/tan\(/g,    this.angleMode === 'deg' ? 'Math.tan((Math.PI/180)*(' : 'Math.tan(')
      .replace(/\^/g,       '**')
      .replace(/%/g,        '/100');

    // Cerrar paréntesis adicionales para sin/cos/tan en modo grados
    if (this.angleMode === 'deg') {
      const fns = ['sin', 'cos', 'tan'];
      fns.forEach(fn => {
        const count = (expr.match(new RegExp(`${fn}\\(`, 'g')) || []).length;
        processed += ')'.repeat(count);
      });
    }

    // Validación básica de seguridad — no permitir eval de código arbitrario
    if (/[a-zA-Z]/.test(processed.replace(/Math\./g, '').replace(/PI/g, ''))) {
      throw new Error('Expresión inválida');
    }

    // eslint-disable-next-line no-eval
    const result = eval(processed);

    if (!isFinite(result)) throw new Error('Resultado no finito');
    return result;
  }

  private formatResult(value: number): string {
    if (Number.isInteger(value)) return value.toString();
    // Máximo 10 decimales, sin ceros innecesarios
    return parseFloat(value.toFixed(10)).toString();
  }
}
