# Architecture du Projet - Shop Management

## Structure Complète

```
src/app/
├── app.component.*              # Composant racine
├── app.config.ts               # Configuration de l'application
├── app.routes.ts                # Routes principales avec lazy loading
│
├── core/                        # Services singleton, guards, interceptors
│   ├── services/
│   │   └── auth.service.ts      # Service d'authentification
│   ├── guards/
│   │   ├── auth.guard.ts        # Guard d'authentification
│   │   └── role.guard.ts        # Guard de rôles
│   ├── interceptors/
│   │   └── auth.interceptor.ts  # Interceptor pour ajouter le token JWT
│   └── models/                  # Modèles TypeScript (interfaces)
│       ├── user.model.ts
│       ├── product.model.ts
│       ├── shop.model.ts
│       ├── sale.model.ts
│       ├── inventory.model.ts
│       └── invoice.model.ts
│
├── shared/                      # Composants, directives, pipes réutilisables
│   ├── components/
│   │   ├── header/              # En-tête avec navigation
│   │   ├── sidebar/             # Menu latéral
│   │   ├── loading-spinner/     # Indicateur de chargement
│   │   └── data-table/          # Tableau de données réutilisable
│   ├── directives/
│   │   └── click-outside.directive.ts
│   └── pipes/
│       └── currency-format.pipe.ts
│
└── modules/                     # Modules fonctionnels (features)
    ├── auth/                    # Authentification
    │   ├── auth.routes.ts
    │   └── components/
    │       ├── login/
    │       └── register/
    │
    ├── products/                # Gestion des produits
    │   ├── products.routes.ts
    │   └── components/
    │       ├── product-list/
    │       ├── product-create/
    │       ├── product-edit/
    │       └── product-detail/
    │
    ├── shops/                   # Gestion des boutiques
    │   ├── shops.routes.ts
    │   └── components/
    │       ├── shop-list/
    │       ├── shop-create/
    │       ├── shop-edit/
    │       └── shop-detail/
    │
    ├── inventory/              # Gestion du stock
    │   ├── inventory.routes.ts
    │   └── components/
    │       ├── inventory-list/
    │       ├── inventory-detail/
    │       ├── stock-adjustment/
    │       └── low-stock-alert/
    │
    ├── sales/                   # Gestion des ventes
    │   ├── sales.routes.ts
    │   └── components/
    │       ├── sale-point/
    │       ├── sale-session/
    │       ├── sale-list/
    │       └── sale-detail/
    │
    ├── invoices/                # Factures
    │   ├── invoices.routes.ts
    │   └── components/
    │       ├── invoice-list/
    │       ├── invoice-detail/
    │       └── invoice-view/
    │
    ├── analytics/               # Analyses et rapports
    │   ├── analytics.routes.ts
    │   └── components/
    │       ├── dashboard/
    │       ├── revenue-journal/
    │       ├── sales-analytics/
    │       ├── stock-analytics/
    │       └── reports/
    │
    └── dashboard/               # Tableau de bord
        └── dashboard.routes.ts
```

## Principes de l'Architecture

### 1. Core (Cœur de l'application)

- **Services singleton** : Services injectés au niveau racine (`providedIn: 'root'`)
- **Guards** : Protection des routes (authentification, rôles)
- **Interceptors** : Interception des requêtes HTTP (ajout de tokens, gestion d'erreurs)
- **Models** : Interfaces TypeScript pour le typage fort

### 2. Shared (Partagé)

- **Composants réutilisables** : Header, Sidebar, Loading Spinner, Data Table
- **Directives** : Directives personnalisées (ex: click-outside)
- **Pipes** : Transformations de données (ex: formatage de devises)

### 3. Modules (Features)

- **Organisation par fonctionnalité** : Chaque module représente une fonctionnalité métier
- **Lazy Loading** : Chargement à la demande pour optimiser les performances
- **Composants spécifiques** : Chaque module contient ses propres composants dans `components/`

## Avantages de cette Architecture

1. **Séparation des responsabilités** : Code organisé par domaine fonctionnel
2. **Réutilisabilité** : Composants partagés dans `shared/`
3. **Maintenabilité** : Structure claire et prévisible
4. **Scalabilité** : Facile d'ajouter de nouvelles fonctionnalités
5. **Performance** : Lazy loading des modules
6. **Type Safety** : Modèles TypeScript pour un typage fort
7. **Sécurité** : Guards et interceptors pour protéger les routes et les requêtes

## Configuration

### app.config.ts

- Configuration de l'application Angular
- Fournit le router avec les routes
- Configure HttpClient avec les interceptors

### Lazy Loading

Tous les modules sont chargés en lazy loading via `loadChildren` dans `app.routes.ts` :

```typescript
{
  path: 'products',
  loadChildren: () => import('./modules/products/products.routes').then(m => m.PRODUCTS_ROUTES)
}
```

## Prochaines Étapes

1. Créer les services pour chaque module (ProductService, SaleService, etc.)
2. Implémenter la logique métier dans les composants
3. Ajouter la gestion d'état (si nécessaire avec NgRx ou un service state)
4. Configurer les variables d'environnement
5. Ajouter les tests unitaires et d'intégration


061D31 et F7821C 
