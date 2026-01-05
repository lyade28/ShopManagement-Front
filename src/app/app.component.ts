import { Component, ViewChild, AfterViewInit, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog/confirmation-dialog.component';
import { ThemeService } from './core/services/theme.service';
import { KeyboardService } from './core/services/keyboard.service';
import { ToastService } from './core/services/toast.service';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, ToastComponent, ConfirmationDialogComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
  title = 'Shop Management';
  isAuthPage = false;
  isSidebarCollapsed = false;
  
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  
  constructor(
    private themeService: ThemeService,
    private keyboardService: KeyboardService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Le service s'initialise automatiquement et applique le thème
    
    // Détecter si on est sur une page d'authentification
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isAuthPage = event.url.startsWith('/auth');
        this.cdr.detectChanges();
      });
    
    // Vérifier aussi au chargement initial
    this.isAuthPage = this.router.url.startsWith('/auth');
  }
  
  ngOnInit() {
    // Enregistrer les raccourcis clavier globaux
    this.setupKeyboardShortcuts();
  }
  
  ngOnDestroy() {
    // Les raccourcis seront automatiquement nettoyés par le service
  }
  
  private setupKeyboardShortcuts() {
    // Ctrl+K ou Cmd+K : Aide (liste des raccourcis)
    this.keyboardService.register({
      key: 'k',
      ctrl: true,
      callback: () => {
        this.showKeyboardShortcuts();
      },
      description: 'Afficher les raccourcis clavier'
    });
    
    // Ctrl+/ ou Cmd+/ : Aide rapide
    this.keyboardService.register({
      key: '/',
      ctrl: true,
      callback: () => {
        this.toastService.info('Appuyez sur Ctrl+K pour voir tous les raccourcis clavier', 3000);
      },
      description: 'Aide rapide'
    });
    
    // Escape : Retour ou fermer
    this.keyboardService.register({
      key: 'Escape',
      callback: () => {
        // Peut être utilisé pour fermer des modales, etc.
        // Implémentation spécifique selon le contexte
        if (this.router.url !== '/dashboard') {
          // Retour au dashboard si on n'y est pas déjà
          const segments = this.router.url.split('/').filter(s => s);
          if (segments.length > 1) {
            this.router.navigate(['/dashboard']);
          }
        }
      },
      description: 'Retour au dashboard'
    });
  }
  
  private showKeyboardShortcuts() {
    const shortcuts = this.keyboardService.getShortcuts();
    if (shortcuts.length === 0) {
      this.toastService.info('Aucun raccourci clavier enregistré');
      return;
    }
    
    const shortcutsList = shortcuts
      .map(s => `${this.keyboardService.formatShortcut(s)}: ${s.description || ''}`)
      .join('\n');
    
    // Utiliser une modale ou un toast pour afficher les raccourcis
    // Pour l'instant, on garde alert() car c'est une fonctionnalité d'aide avec formatage multi-lignes
    alert(`Raccourcis clavier disponibles:\n\n${shortcutsList}`);
  }
  
  ngAfterViewInit() {
    // Mettre à jour l'état de la sidebar après l'initialisation de la vue
    if (this.sidebar) {
      this.isSidebarCollapsed = this.sidebar.isCollapsed;
      this.cdr.detectChanges();
    }
  }

  onToggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
      // Mettre à jour l'état après le toggle
      setTimeout(() => {
        this.isSidebarCollapsed = this.sidebar.isCollapsed;
        this.cdr.detectChanges();
      }, 0);
    }
  }
}
