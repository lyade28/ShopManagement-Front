# Structure du Projet Angular - Shop Management

## Organisation Modulaire avec Lazy Loading

Le projet est organisé par **modules**, chaque module ayant son propre fichier de routing et un dossier `components/` regroupant tous les composants liés à ce module.

## Structure Générale

```
src/app/
├── app.routes.ts                    # Routes principales avec lazy loading
├── app.component.*                  # Composant racine
└── modules/                         # Tous les modules de l'application
    ├── auth/
    │   ├── auth.routes.ts          # Routes du module auth
    │   └── components/             # Composants du module auth
    ├── products/
    │   ├── products.routes.ts      # Routes du module products
    │   └── components/             # Composants du module products
    ├── shops/
    │   ├── shops.routes.ts         # Routes du module shops
    │   └── components/             # Composants du module shops
    ├── inventory/
    │   ├── inventory.routes.ts     # Routes du module inventory
    │   └── components/             # Composants du module inventory
    ├── sales/
    │   ├── sales.routes.ts        # Routes du module sales
    │   └── components/             # Composants du module sales
    ├── invoices/
    │   ├── invoices.routes.ts      # Routes du module invoices
    │   └── components/             # Composants du module invoices
    ├── analytics/
    │   ├── analytics.routes.ts     # Routes du module analytics
    │   └── components/             # Composants du module analytics
    └── dashboard/
        └── dashboard.routes.ts     # Routes du module dashboard
```

## Modules et Routes

### 1. Module Auth (`/auth`)
- **Routes** : `auth.routes.ts`
- **Composants** :
  - `login/` - Page de connexion
  - `register/` - Page d'inscription (admin seulement)

### 2. Module Products (`/products`)
- **Routes** : `products.routes.ts`
- **Composants** :
  - `product-list/` - Liste des produits
  - `product-create/` - Création de produit
  - `product-edit/` - Édition de produit
  - `product-detail/` - Détails d'un produit

### 3. Module Shops (`/shops`)
- **Routes** : `shops.routes.ts`
- **Composants** :
  - `shop-list/` - Liste des boutiques
  - `shop-create/` - Création de boutique
  - `shop-edit/` - Édition de boutique
  - `shop-detail/` - Détails d'une boutique

### 4. Module Inventory (`/inventory`)
- **Routes** : `inventory.routes.ts`
- **Composants** :
  - `inventory-list/` - Liste du stock (avec filtre par boutique)
  - `inventory-detail/` - Détails d'un produit en stock
  - `stock-adjustment/` - Ajustement de stock
  - `low-stock-alert/` - Alertes de stock faible

### 5. Module Sales (`/sales`)
- **Routes** : `sales.routes.ts`
- **Composants** :
  - `sale-point/` - Point de vente (interface principale)
  - `sale-session/` - Gestion des sessions (chaque vendeur gère sa propre session)
  - `sale-list/` - Liste des ventes (avec filtre par boutique)
  - `sale-detail/` - Détails d'une vente

### 6. Module Invoices (`/invoices`)
- **Routes** : `invoices.routes.ts`
- **Composants** :
  - `invoice-list/` - Liste des factures (avec filtre par boutique)
  - `invoice-detail/` - Détails et visualisation
  - `invoice-view/` - Visualisation de la facture générée automatiquement

### 7. Module Analytics (`/analytics`)
- **Routes** : `analytics.routes.ts`
- **Composants** :
  - `dashboard/` - Tableau de bord principal (global ou par boutique)
  - `revenue-journal/` - Journal des recettes (avec filtre par boutique)
  - `sales-analytics/` - Analyse des ventes (global ou par boutique)
  - `stock-analytics/` - Analyse du stock (global ou par boutique)
  - `reports/` - Génération de rapports

### 8. Module Dashboard (`/dashboard`)
- **Routes** : `dashboard.routes.ts`
- Redirige vers le composant dashboard du module analytics

## Lazy Loading

Tous les modules sont chargés en **lazy loading** via `loadChildren` dans `app.routes.ts` :

```typescript
{
  path: 'products',
  loadChildren: () => import('./modules/products/products.routes').then(m => m.PRODUCTS_ROUTES)
}
```

Chaque module expose ses routes via un fichier `*.routes.ts` qui exporte un tableau de routes.

## Avantages de cette Structure

1. **Séparation des responsabilités** : Chaque module gère ses propres composants
2. **Lazy Loading** : Les modules ne sont chargés que lorsqu'ils sont nécessaires
3. **Maintenabilité** : Structure claire et organisée
4. **Scalabilité** : Facile d'ajouter de nouveaux modules
5. **Performance** : Réduction de la taille du bundle initial

## Prochaines Étapes

1. Implémenter les services pour chaque module
2. Créer les guards d'authentification
3. Implémenter les interceptors HTTP
4. Ajouter les composants partagés (header, sidebar, etc.)
5. Configurer les services API

