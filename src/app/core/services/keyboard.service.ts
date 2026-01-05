import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd sur Mac
  callback: () => void;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardService implements OnDestroy {
  private shortcuts = new Map<string, KeyboardShortcut>();
  private keydown$ = new Subject<KeyboardEvent>();
  private subscription?: Subscription;

  constructor() {
    this.setupListener();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private setupListener() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Ignorer si on est dans un input, textarea, ou contenteditable
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Permettre certains raccourcis globaux même dans les inputs
      if (event.key === 'Escape') {
        // Escape fonctionne partout
      } else {
        return;
      }
    }

    const key = event.key.toLowerCase();
    const shortcutKey = this.buildShortcutKey(
      key,
      event.ctrlKey || event.metaKey, // Cmd sur Mac = Ctrl
      event.shiftKey,
      event.altKey
    );

    const shortcut = this.shortcuts.get(shortcutKey);
    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.callback();
    }
  }

  private buildShortcutKey(
    key: string,
    ctrl: boolean,
    shift: boolean,
    alt: boolean
  ): string {
    const parts: string[] = [];
    if (ctrl) parts.push('ctrl');
    if (shift) parts.push('shift');
    if (alt) parts.push('alt');
    parts.push(key);
    return parts.join('+');
  }

  /**
   * Enregistrer un raccourci clavier
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.buildShortcutKey(
      shortcut.key.toLowerCase(),
      shortcut.ctrl || false,
      shortcut.shift || false,
      shortcut.alt || false
    );
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Désenregistrer un raccourci clavier
   */
  unregister(key: string, ctrl = false, shift = false, alt = false): void {
    const shortcutKey = this.buildShortcutKey(key.toLowerCase(), ctrl, shift, alt);
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Obtenir tous les raccourcis enregistrés
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Formater un raccourci pour l'affichage
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta) parts.push('Cmd');
    
    const key = shortcut.key.toUpperCase();
    if (key === ' ') parts.push('Espace');
    else if (key === 'escape') parts.push('Esc');
    else if (key === 'arrowup') parts.push('↑');
    else if (key === 'arrowdown') parts.push('↓');
    else if (key === 'arrowleft') parts.push('←');
    else if (key === 'arrowright') parts.push('→');
    else parts.push(key);
    
    return parts.join(' + ');
  }
}

