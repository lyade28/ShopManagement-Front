#!/bin/bash

# Script de déploiement pour ShopManagement sur Hostinger VPS
# Usage: ./deploy.sh [--build] [--restart]

set -e

echo "🚀 Déploiement de ShopManagement..."

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Le fichier .env n'existe pas. Création depuis .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Veuillez modifier le fichier .env avec vos configurations avant de continuer.${NC}"
        exit 1
    else
        echo -e "${RED}❌ Le fichier .env.example n'existe pas.${NC}"
        exit 1
    fi
fi

# Option de build
BUILD=false
RESTART=false

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
            shift
            ;;
        --restart)
            RESTART=true
            shift
            ;;
        *)
            echo -e "${YELLOW}⚠️  Option inconnue: $1${NC}"
            shift
            ;;
    esac
done

# Arrêter les conteneurs existants si --restart
if [ "$RESTART" = true ]; then
    echo -e "${YELLOW}🛑 Arrêt des conteneurs existants...${NC}"
    docker-compose down || true
fi

# Construire les images si nécessaire
if [ "$BUILD" = true ] || [ "$RESTART" = true ]; then
    echo -e "${YELLOW}🔨 Construction de l'image frontend...${NC}"
    docker-compose build frontend
fi

# Démarrer les services
echo -e "${YELLOW}▶️  Démarrage des services...${NC}"
docker-compose up -d

# Attendre que les services soient prêts
echo -e "${YELLOW}⏳ Attente du démarrage des services...${NC}"
sleep 5

# Vérifier le statut
echo -e "${YELLOW}📊 Vérification du statut des services...${NC}"
docker-compose ps

# Afficher les logs récents
echo -e "${YELLOW}📋 Derniers logs:${NC}"
docker-compose logs --tail=50

# Vérifier la santé des services
echo -e "${YELLOW}🏥 Vérification de la santé des services...${NC}"

# Vérifier le frontend
if curl -f http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend accessible sur http://localhost${NC}"
else
    echo -e "${RED}❌ Le frontend n'est pas accessible${NC}"
fi

# Vérifier le backend (si configuré)
if docker-compose ps | grep -q "backend.*Up"; then
    if curl -f http://localhost/api > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend accessible sur http://localhost/api${NC}"
    else
        echo -e "${YELLOW}⚠️  Le backend est démarré mais l'API n'est pas accessible${NC}"
    fi
fi

echo -e "${GREEN}✨ Déploiement terminé!${NC}"
echo ""
echo "Commandes utiles:"
echo "  - Voir les logs: docker-compose logs -f"
echo "  - Arrêter: docker-compose down"
echo "  - Redémarrer: docker-compose restart"
echo "  - Statut: docker-compose ps"


