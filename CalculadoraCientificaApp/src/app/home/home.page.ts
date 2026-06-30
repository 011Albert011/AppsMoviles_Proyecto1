import { Component } from '@angular/core';
import { CalculadoraService } from '../services/calculadora.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  /** Expresión visible en la línea superior de la pantalla */
  expression: string = '';

  /** Valor o expresión que el usuario está construyendo */
  currentInput: string = '';

  /** Modo de ángulo para trigonometría */
  angleMode: 'deg' | 'rad' = 'deg';

  /** Mensaje de error a mostrar */
  errorMsg: string = '';

  /** Indica si el último evento fue un cálculo exitoso */
  private justCalculated: boolean = false;

  constructor(private calcService: CalculadoraService) {}

  // ──────────────────────────────────────────────────────────
  // Entrada de caracteres
  // ──────────────────────────────────────────────────────────

  appendChar(char: string): void {
    this.clearError();

    if (this.justCalculated) {
      if (['+', '-', '*', '/', '^', '%'].includes(char)) {
        // Continuar desde el resultado
        this.expression = this.currentInput;
        this.currentInput = '';
      } else {
        // Nueva operación
        this.expression = '';
        this.currentInput = '';
      }
      this.justCalculated = false;
    }

    // Evitar doble punto en el mismo número
    if (char === '.') {
      const tokens = this.currentInput.split(/[\+\-\*\/\^%\(]/);
      const ultimo = tokens[tokens.length - 1];
      if (ultimo.includes('.')) return;
    }

    // Evitar doble operador seguido (excepto para negativo después de operador)
    const ops = ['+', '-', '*', '/', '^', '%'];
    const lastChar = this.currentInput.slice(-1);
    if (ops.includes(char) && ops.includes(lastChar) && char !== '-') return;

    this.currentInput += char;
  }

  // ──────────────────────────────────────────────────────────
  // Funciones científicas
  // ──────────────────────────────────────────────────────────

  appendFunction(fn: string): void {
    this.clearError();

    if (this.justCalculated) {
      this.expression = '';
      this.currentInput = '';
      this.justCalculated = false;
    }

    // Si hay un número al final, insertar multiplicación implícita
    const lastChar = this.currentInput.slice(-1);
    if (lastChar && /[\d\)]/.test(lastChar)) {
      this.currentInput += '*';
    }

    this.currentInput += `${fn}(`;
  }

  // ──────────────────────────────────────────────────────────
  // Borrar todo (C)
  // ──────────────────────────────────────────────────────────

  clearAll(): void {
    this.currentInput = '';
    this.expression = '';
    this.justCalculated = false;
    this.clearError();
  }

  // ──────────────────────────────────────────────────────────
  // Borrar último carácter (⌫)
  // ──────────────────────────────────────────────────────────

  backspace(): void {
    this.clearError();
    if (this.justCalculated) { this.clearAll(); return; }
    if (this.currentInput.length > 0) {
      this.currentInput = this.currentInput.slice(0, -1);
    }
  }

  // ──────────────────────────────────────────────────────────
  // Alternar signo (+/−)
  // ──────────────────────────────────────────────────────────

  toggleNegate(): void {
    if (!this.currentInput) return;
    this.currentInput = this.currentInput.startsWith('-')
      ? this.currentInput.slice(1)
      : '-' + this.currentInput;
  }

  // ──────────────────────────────────────────────────────────
  // Alternar modo DEG / RAD
  // ──────────────────────────────────────────────────────────

  toggleAngleMode(): void {
    this.angleMode = this.angleMode === 'deg' ? 'rad' : 'deg';
  }

  // ──────────────────────────────────────────────────────────
  // Calcular resultado (=)
  // ──────────────────────────────────────────────────────────

  calculate(): void {
    if (!this.currentInput.trim()) {
      this.showError('Ingresa una expresión primero');
      return;
    }

    try {
      const enGrados = this.angleMode === 'deg';
      const valor = this.calcService.evaluarExpresion(this.currentInput, enGrados);
      const resultadoStr = this.calcService.formatearResultado(valor);

      // Guardar en historial
      this.calcService.guardarEnHistorial(this.currentInput, resultadoStr);

      this.expression = this.currentInput + ' =';
      this.currentInput = resultadoStr;
      this.justCalculated = true;

    } catch (err: any) {
      this.expression = this.currentInput;
      this.showError(err.message || 'Error en la operación');
      this.currentInput = 'Error';
      this.justCalculated = true;
    }
  }

  // ──────────────────────────────────────────────────────────
  // Helper: determinar si el input es largo
  // ──────────────────────────────────────────────────────────

  get isResultSmall(): boolean {
    return this.currentInput.length > 12;
  }

  // ──────────────────────────────────────────────────────────
  // Manejo de errores
  // ──────────────────────────────────────────────────────────

  private showError(msg: string): void {
    this.errorMsg = msg;
  }

  clearError(): void {
    this.errorMsg = '';
  }
}
