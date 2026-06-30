import { Injectable } from '@angular/core';

export interface HistorialEntry {
  expresion: string;
  resultado: string;
  fecha: Date;
}

@Injectable({
  providedIn: 'root',
})
export class CalculadoraService {

  private historial: HistorialEntry[] = [];

  constructor() {}

  // ──────────────────────────────────────────────────────────
  // OPERACIONES BÁSICAS
  // ──────────────────────────────────────────────────────────

  sumar(a: number, b: number): number {
    return a + b;
  }

  restar(a: number, b: number): number {
    return a - b;
  }

  multiplicar(a: number, b: number): number {
    return a * b;
  }

  dividir(a: number, b: number): number {
    if (b === 0) throw new Error('División por cero no permitida');
    return a / b;
  }

  porcentaje(a: number): number {
    return a / 100;
  }

  // ──────────────────────────────────────────────────────────
  // OPERACIONES CIENTÍFICAS
  // ──────────────────────────────────────────────────────────

  raizCuadrada(a: number): number {
    if (a < 0) throw new Error('Raíz cuadrada de número negativo no permitida');
    return Math.sqrt(a);
  }

  potencia(base: number, exponente: number): number {
    return Math.pow(base, exponente);
  }

  logaritmo10(a: number): number {
    if (a <= 0) throw new Error('Logaritmo de número ≤ 0 no permitido');
    return Math.log10(a);
  }

  logaritmoNatural(a: number): number {
    if (a <= 0) throw new Error('Logaritmo natural de número ≤ 0 no permitido');
    return Math.log(a);
  }

  // ── Trigonométricas (reciben grados o radianes según modo) ─

  seno(angulo: number, enGrados: boolean = true): number {
    const rad = enGrados ? this.gradosARadianes(angulo) : angulo;
    return Math.sin(rad);
  }

  coseno(angulo: number, enGrados: boolean = true): number {
    const rad = enGrados ? this.gradosARadianes(angulo) : angulo;
    return Math.cos(rad);
  }

  tangente(angulo: number, enGrados: boolean = true): number {
    const rad = enGrados ? this.gradosARadianes(angulo) : angulo;
    // cos ≈ 0 → tan indefinida (90°, 270°, ...)
    const c = Math.cos(rad);
    if (Math.abs(c) < 1e-10) throw new Error('Tangente indefinida para este ángulo');
    return Math.tan(rad);
  }

  // ── Trigonométricas inversas ──────────────────────────────

  arcoSeno(a: number, retornarGrados: boolean = true): number {
    if (a < -1 || a > 1) throw new Error('arcsin requiere valor entre −1 y 1');
    const rad = Math.asin(a);
    return retornarGrados ? this.radianesAGrados(rad) : rad;
  }

  arcoCoseno(a: number, retornarGrados: boolean = true): number {
    if (a < -1 || a > 1) throw new Error('arccos requiere valor entre −1 y 1');
    const rad = Math.acos(a);
    return retornarGrados ? this.radianesAGrados(rad) : rad;
  }

  arcoTangente(a: number, retornarGrados: boolean = true): number {
    const rad = Math.atan(a);
    return retornarGrados ? this.radianesAGrados(rad) : rad;
  }

  // ──────────────────────────────────────────────────────────
  // EVALUADOR DE EXPRESIONES
  // ──────────────────────────────────────────────────────────

  evaluarExpresion(expr: string, enGrados: boolean = true): number {
    if (!expr || !expr.trim()) throw new Error('Expresión vacía');

    const processed = this.prepararExpresion(expr, enGrados);
    this.validarExpresion(processed);

    // eslint-disable-next-line no-eval
    const resultado: number = eval(processed);

    if (resultado === undefined || resultado === null) {
      throw new Error('No se pudo evaluar la expresión');
    }
    if (!isFinite(resultado)) {
      throw new Error('El resultado es demasiado grande o es infinito');
    }
    if (isNaN(resultado)) {
      throw new Error('El resultado no es un número válido');
    }

    return resultado;
  }

  // ──────────────────────────────────────────────────────────
  // HISTORIAL
  // ──────────────────────────────────────────────────────────

  guardarEnHistorial(expresion: string, resultado: string): void {
    this.historial.unshift({ expresion, resultado, fecha: new Date() });
    // Limitar a 50 entradas
    if (this.historial.length > 50) this.historial.pop();
  }

  obtenerHistorial(): HistorialEntry[] {
    return [...this.historial];
  }

  limpiarHistorial(): void {
    this.historial = [];
  }

  // ──────────────────────────────────────────────────────────
  // FORMATEO DE RESULTADOS
  // ──────────────────────────────────────────────────────────

  formatearResultado(valor: number): string {
    if (Number.isInteger(valor)) return valor.toString();

    // Notación científica para números muy grandes o muy pequeños
    if (Math.abs(valor) > 1e12 || (Math.abs(valor) < 1e-7 && valor !== 0)) {
      return valor.toExponential(6);
    }

    // Máximo 10 decimales, sin ceros al final
    return parseFloat(valor.toFixed(10)).toString();
  }

  // ──────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ──────────────────────────────────────────────────────────

  private prepararExpresion(expr: string, enGrados: boolean): string {
    const deg = enGrados;

    let p = expr
      // Constantes
      .replace(/\bpi\b/gi,  'Math.PI')
      .replace(/\be\b/g,    'Math.E')
      // Raíz cuadrada
      .replace(/sqrt\s*\(/g, 'Math.sqrt(')
      // Logaritmos
      .replace(/log\s*\(/g,  'Math.log10(')
      .replace(/ln\s*\(/g,   'Math.log(')
      // Potencia
      .replace(/\^/g,        '**')
      // Porcentaje (x% → x/100)
      .replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');

    if (deg) {
      // En modo grados: envolver el argumento
      p = p
        .replace(/asin\s*\(/g,  `(180/Math.PI)*Math.asin(`)
        .replace(/acos\s*\(/g,  `(180/Math.PI)*Math.acos(`)
        .replace(/atan\s*\(/g,  `(180/Math.PI)*Math.atan(`)
        .replace(/sin\s*\(/g,   `Math.sin((Math.PI/180)*(`)
        .replace(/cos\s*\(/g,   `Math.cos((Math.PI/180)*(`)
        .replace(/tan\s*\(/g,   `Math.tan((Math.PI/180)*(`)
    } else {
      p = p
        .replace(/asin\s*\(/g, 'Math.asin(')
        .replace(/acos\s*\(/g, 'Math.acos(')
        .replace(/atan\s*\(/g, 'Math.atan(')
        .replace(/sin\s*\(/g,  'Math.sin(')
        .replace(/cos\s*\(/g,  'Math.cos(')
        .replace(/tan\s*\(/g,  'Math.tan(');
    }

    // Cerrar paréntesis extra de sin/cos/tan en modo grados
    if (deg) {
      const fnsDeg = ['sin', 'cos', 'tan'];
      fnsDeg.forEach(fn => {
        const matches = (expr.match(new RegExp(`(?<!a)${fn}\\s*\\(`, 'g')) || []).length;
        p += ')'.repeat(matches);
      });
    }

    return p;
  }

  private validarExpresion(processed: string): void {
    // Solo permitir caracteres seguros
    const seguro = /^[\d\s\+\-\*\/\.\(\)\,\%\*MathPIEsqrtlogasincostanatei\s]+$/;
    const sinMath = processed.replace(/Math\.(PI|E|sqrt|log10?|log|asin|acos|atan|sin|cos|tan|pow|abs)/g, '');
    if (/[a-zA-Z]/.test(sinMath.replace(/\s/g, ''))) {
      throw new Error('La expresión contiene caracteres no válidos');
    }
  }

  private gradosARadianes(grados: number): number {
    return grados * (Math.PI / 180);
  }

  private radianesAGrados(rad: number): number {
    return rad * (180 / Math.PI);
  }
}
