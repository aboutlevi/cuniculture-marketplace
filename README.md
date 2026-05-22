# 🐇 LapinBénin — Marketplace Cunicole

Marketplace B2B connectant les éleveurs de lapins et les restaurants au Bénin.

## Stack technique
- **Frontend** : React + Vite (PWA)
- **Backend** : Supabase (PostgreSQL + Auth + Realtime)
- **Hébergement** : GitHub Pages
- **Coût** : 0 FCFA

## Installation locale

```bash
npm install
npm run dev
```

## Déploiement

Le déploiement est automatique via GitHub Actions à chaque push sur `main`.

L'appli sera disponible sur :
`https://[votre-username].github.io/cuniculture-marketplace`

## Configuration Supabase

1. Créer le projet sur supabase.com
2. Aller dans **SQL Editor**
3. Coller et exécuter le contenu de `supabase_schema.sql`
4. Aller dans **Authentication > Settings** et activer l'email

## Fonctionnalités

### Éleveurs
- ✅ Inscription/connexion
- ✅ Catalogue de produits (ajout, modification, suppression)
- ✅ Gestion des commandes (confirmer, marquer livré)
- ✅ Messagerie temps réel

### Restaurants
- ✅ Recherche d'éleveurs par ville
- ✅ Consultation des catalogues
- ✅ Panier et commandes
- ✅ Messagerie temps réel

## Structure du projet

```
src/
├── lib/
│   ├── supabase.js       # Client Supabase
│   ├── AuthContext.jsx   # Gestion auth
│   └── useToast.js       # Notifications
├── components/
│   └── BottomNav.jsx     # Navigation
├── pages/
│   ├── AuthPage.jsx      # Login/Register
│   ├── Dashboard.jsx     # Tableau de bord
│   ├── Explorer.jsx      # Recherche éleveurs
│   ├── EleveurProfile.jsx # Fiche éleveur + commande
│   ├── MesProduits.jsx   # Gestion catalogue
│   ├── Commandes.jsx     # Suivi commandes
│   ├── Messages.jsx      # Messagerie
│   └── Profil.jsx        # Mon profil
└── App.jsx               # Router principal
```
