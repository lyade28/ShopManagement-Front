# Guide de Déploiement sur Hostinger VPS 22.04

Ce guide vous explique comment déployer l'application ShopManagement sur un serveur VPS Hostinger Ubuntu 22.04.

## Prérequis

- Serveur VPS Hostinger avec Ubuntu 22.04
- Accès SSH au serveur
- Docker et Docker Compose installés
- Domaine pointant vers l'IP du serveur (optionnel pour SSL)

## Installation des dépendances

### 1. Mettre à jour le système

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Installer Docker

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier l'installation
docker --version
docker-compose --version
```

### 3. Installer Git (si nécessaire)

```bash
sudo apt install git -y
```

## Déploiement de l'application

### 1. Cloner ou transférer le projet

```bash
# Option 1: Si le code est sur Git
git clone <votre-repo-url> shop-management
cd shop-management

# Option 2: Transférer les fichiers via SCP
# scp -r /chemin/local/shop-management user@votre-serveur:/home/user/
```

### 2. Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env
nano .env
```

Modifiez les valeurs dans `.env` selon votre configuration :
- `BACKEND_URL` : URL de votre backend Django
- `SECRET_KEY` : Clé secrète Django (générez-en une nouvelle)
- `DATABASE_URL` : URL de connexion à la base de données
- `DOMAIN_NAME` : Votre domaine (si vous avez SSL)

### 3. Configurer le backend dans docker-compose.yml

Éditez le fichier `docker-compose.yml` et remplacez la section `backend` par la configuration réelle de votre backend Django.

### 4. Construire et démarrer les conteneurs

```bash
# Construire l'image frontend
docker-compose build frontend

# Démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

### 5. Vérifier que tout fonctionne

```bash
# Vérifier les conteneurs en cours d'exécution
docker-compose ps

# Tester l'application
curl http://localhost
```

## Configuration SSL avec Let's Encrypt (Optionnel mais recommandé)

### 1. Installer Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtenir un certificat SSL

```bash
# Si vous utilisez Nginx directement sur l'hôte (pas dans Docker)
sudo certbot --nginx -d votre-domaine.com

# Si vous utilisez Docker, vous devrez configurer manuellement
# ou utiliser un conteneur avec certbot
```

### 3. Configurer Nginx pour HTTPS

Décommentez et configurez la section HTTPS dans `nginx.conf`, puis montez les certificats dans le conteneur.

## Configuration du pare-feu

```bash
# Autoriser HTTP
sudo ufw allow 80/tcp

# Autoriser HTTPS
sudo ufw allow 443/tcp

# Autoriser SSH (important!)
sudo ufw allow 22/tcp

# Activer le pare-feu
sudo ufw enable
```

## Maintenance

### Redémarrer les services

```bash
docker-compose restart
```

### Mettre à jour l'application

```bash
# Récupérer les dernières modifications
git pull

# Reconstruire et redémarrer
docker-compose build frontend
docker-compose up -d
```

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f frontend
```

### Arrêter les services

```bash
docker-compose down
```

### Nettoyer les ressources Docker

```bash
# Supprimer les conteneurs arrêtés
docker-compose down

# Supprimer les images non utilisées
docker image prune -a
```

## Dépannage

### Le frontend ne se connecte pas au backend

1. Vérifiez que le backend est démarré : `docker-compose ps`
2. Vérifiez les logs du backend : `docker-compose logs backend`
3. Vérifiez que `BACKEND_URL` dans `.env` est correct
4. Vérifiez que les deux services sont sur le même réseau Docker

### Erreur de permissions

```bash
# Donner les permissions à Docker
sudo chmod 666 /var/run/docker.sock
```

### Port déjà utilisé

Modifiez les ports dans `.env` ou arrêtez le service qui utilise le port.

## Sécurité

- ✅ Changez tous les mots de passe par défaut
- ✅ Utilisez des clés SSH au lieu de mots de passe
- ✅ Configurez SSL/HTTPS pour la production
- ✅ Configurez un pare-feu (UFW)
- ✅ Mettez à jour régulièrement le système et Docker
- ✅ Utilisez des variables d'environnement pour les secrets
- ✅ Ne commitez jamais le fichier `.env`

## Support

Pour toute question ou problème, consultez :
- Documentation Docker : https://docs.docker.com/
- Documentation Hostinger : https://www.hostinger.com/tutorials/vps


