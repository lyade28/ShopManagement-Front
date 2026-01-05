import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css'
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: string[] = [];
  @Input() headers: string[] = [];

  // TODO: Implémenter le tableau de données réutilisable avec pagination, tri, etc.
}

