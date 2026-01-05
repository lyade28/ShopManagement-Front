import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface SettingsOption {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-settings-index',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settings-index.component.html',
  styleUrl: './settings-index.component.css'
})
export class SettingsIndexComponent {
  settingsOptions: SettingsOption[] = [
    {
      title: 'Catégories',
      description: 'Gérer les catégories de produits et leurs attributs',
      icon: 'bi-folder',
      route: '/settings/categories',
      color: 'primary'
    },
    {
      title: 'Journal d\'Audit',
      description: 'Consulter l\'historique des actions effectuées sur la plateforme',
      icon: 'bi-journal-text',
      route: '/settings/audit',
      color: 'info'
    }
  ];
}

