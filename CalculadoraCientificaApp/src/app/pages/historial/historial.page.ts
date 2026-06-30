import { Component, OnInit } from '@angular/core';
import { CalculadoraService, HistorialEntry } from '../../services/calculadora.service';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: false,
})
export class HistorialPage implements OnInit {

  historial: HistorialEntry[] = [];

  constructor(private calcService: CalculadoraService) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  ionViewWillEnter(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.historial = this.calcService.obtenerHistorial();
  }

  eliminarEntrada(index: number): void {
    this.historial.splice(index, 1);
  }

  limpiarHistorial(): void {
    this.calcService.limpiarHistorial();
    this.historial = [];
  }
}
