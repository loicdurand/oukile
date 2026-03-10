# Oukilé? | Application de gestion de stock | v0.0.3

## Description
Une application web sécurisée et intuitive pour trouver rapidemment un article rangé quelque part.

Cette application a été pensée pour les unités du <abbr title="Commandement de la Gendarmerie de GUADELOUPE">COMGENDGP</abbr> - Gendarmerie Nationale mais peut être adaptée facilement aux besoins de toute autre groupement voire administration.

![image](./assets/images/01-accueil.png)

## Fonctionnalités

L'application se veut intuitive:
- 3 onglets principaux, à savoir **TROUVER**, **RANGER** et **SORTIR**, afin de rechercher / organiser en article en un éclair,
- un onglet Articles, permettant de mettre à jour le référentiel rapidemment,
- un espace de gestion de l'unité, permettant de définir et personnaliser les pièces (garage, bureaux, cour, etc...), les zones au sein de chaque pièce (aile ouest, espace réunion, bureau d'Alice et Bob, etc...), les différents rangements (telle étagère, telle armoire ou tel bureau, par exemple) et enfin, des emplacements dans chacun de ces rangements. 
- Interface utilisateur utilisant le <abbr title="Système de Design de l'État">DSFR</abbr>&copy;, moderne et responsive, en cohérence avec les sites étatiques
- Authentification des utilisateurs et insertion en BDD via SSO et LDAP.

## Prérequis
- PHP (version 7.2 ou supérieure) 
- Symfony&copy; et Composer
- Node.js et NPM
- MySQL&copy; (pour la base de données)
- Navigateur web moderne (cible: Firefox 140-esr, mais supporte très bien Chrome, Firefox, Safari, etc.)

## Installation
1. Clonez le dépôt :
   ```bash
   git clone https://github.com/loicdurand/oukile.git
   ```
2. Accédez au répertoire du projet :
   ```bash
   cd oukile
   ```
3. Installez les dépendances :
   ```bash
   npm install      # installe les dépendances (packages) NPM
   composer install # installe les dépendances (bundles) PHP
   ```
4. Configurez les variables d'environnement dans un fichier `.env` :
   ```env
    APP_ENV=dev

    LDAP_HOST=ldap://mon_ldap.domaine.fr
    LDAP_PORT=389
    LDAP_USER=admin 
    LDAP_PASSWORD=mot_de_passe
    BASE_DN='dc=exemple,dc=fr'

    COOKIE_NAME=nom_du_cookie
    COOKIE_DOMAIN=localhost
    PORTAL_URL='http://adresse_de_mon_sso/login'
    REST_URL='http://adresse_de_mon_sso/validate' 
    MAIL_URL='https://adresse_de_mon_sso/mail' # Pas encore implémenté
    
   ```
1. Lancez l'application :
   ```bash
   # PRÉPARATION DE LA BASE DE DONNÉES
   php bin/console doctrine:database:create
   php bin/console make:migration
   php bin/console doctrine:migrations:migrate
   php bin/console doctrine:fixtures:load

   # BUILD DES ASSETS
   php bin/console asset-map:compile
   npm run build

   # DÉMARRAGE DU SERVEUR
   npm run server
   ```
2. Accédez à l'application via `http://localhost:8000` dans votre navigateur.

## Utilisation

Une fois connecté, vous vous retrouvez - en page d'accueil - face à un espace épuré, et ne comportant que quelques onglets. Ne vous seront présentés que les articles en stock au sein de votre unité.
1. **Onglet TROUVER** : Saisissez ce que vous recherchez, que ce soit une marque, un modèle ou une description, puis sélectionnez dans la liste de suggestions qui apparait l'article que vous souhaitez: 
![image](./assets/images/02-trouver.png)
Vous verrez alors apparaître les différents endroits ou de tels articles ont été stockés.
![image](./assets/images/02-trouver--resultat.png)
Des boutons "**+**" et "**-**" vous permettent de ranger / sortir un article directement depuis cette liste de résultats, ce qui fait que, pour un personnel "exécutant", ce seul onglet peut s'avérer suffisant!

2. **Onglet RANGER** : Comme son nom l'indique, vous recherchez un article et, une fois identifié, vous indiquez son nouvel emplacement, ainsi que la quantité d'articles que vous rangez à cet endroit.
![image](./assets/images/03-ranger.png)

3. **Onglet SORTIR** : Sans surprise, cette onglet a la même focntion que l'onglet *Ranger*, mais dans le sens inverse!
   
4. Onglets *Articles*: gérez facilement les articles que vous voulez localiser grâce à cette application:
![image](./assets/images/04-articles.png)

5. Page de *gestion de  votre unité*:
C'est depuis cette page que vous allez:
   - définir les pièces qui composent votre unité,
   - définir les zones au sein de chaque pièce,
   - dans chaque pièce, identifier les rangements (armoires, étagères, bureaux, etc...),
   - définir les emplacements dans ces rangements, afin de localiser avec grande précision vos articles.

   ![image](./assets/images/05-gestion-unite.png)


## Technologies utilisées
- **Backend** : PHP, Symfony&copy;
- **Frontend** : TypeScript très léger
- **Base de données** : MySQL
- **Authentification** : Via SSO et LDAP
- **Hébergement** : Le site est hébergé sur serveur INTRANET local. Il n'est donc pas accessible au grand public et son accès est limité à l'administration pour laquelle il a été conçu.

## Contribution
Nous accueillons les contributions ! Pour participer :
1. Forkez le dépôt.
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonction`).
3. Commitez vos changements (`git commit -m "Ajout de nouvelle fonctionnalité"`).
4. Poussez votre branche (`git push origin feature/nouvelle-fonction`).
5. Ouvrez une Pull Request.

Veuillez lire notre [guide de contribution](CONTRIBUTING.md) pour plus de détails.

## Licence
S'agissant d'un projet conçu pour une administration française, et utilisant le <abbr title="Système de Design de l'État">DSFR</abbr>&copy;, celui-ci est [sous licence ouverte Etalab 2.0](https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf). Vous êtes libres de l'adapter à vos besoins si vous ne travaillez pas pour le compte d'une administration française, notament en retirant les éléments de design du <abbr title="Système de Design de l'État">DSFR</abbr>&copy;, ce qui est relativement aisé si vous avez l'habitude d'utiliser des bibliothèques telles que Bootstrap&copy;, Materialize.css&copy;, voire Tailwind&copy;.

## Contact
Pour toute question ou suggestion, ouvrez une issue sur GitHub.
