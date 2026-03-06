# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
composer install

# Run development server
symfony serve

# Database migrations
php bin/console doctrine:migrations:migrate
php bin/console doctrine:migrations:diff   # generate migration from entity changes

# Load fixtures
php bin/console doctrine:fixtures:load

# Run tests
./vendor/bin/phpunit

# Run a single test
./vendor/bin/phpunit tests/path/to/TestFile.php

# Clear cache
php bin/console cache:clear
```

## Architecture

This is a **Symfony 7.4** application (PHP >= 8.2) called **Oukile**, a storage/inventory management system. It exposes both a traditional Twig-based web UI and a JSON-LD REST API via API Platform 4.

### Domain model (storage hierarchy)

```
Unite (organizational unit)
  └── Piece (room)
        └── Zone
              └── Rangement (storage unit, typed via TypeRangement)
                    └── Emplacement (slot/location)
                          └── Lot (batch of items, linked to FamilleArticle)

FamilleArticle → Categorie
Article (individual item) → FamilleArticle
MediaObject (uploaded files, stored in public/media/)
User → Unite
```

### Dual interface

- **Web UI** (`src/Controller/`, `templates/`): standard Symfony MVC controllers extending `AbstractController`, Twig templates using the DSFR design system (`templates/form/dsfr.html.twig` as a custom form theme).
- **REST API** (`/api`): Entities annotated with `#[ApiResource]` are automatically exposed. Responses use JSON-LD (`application/ld+json`). File upload endpoint uses `multipart/form-data` via `MediaObject`.

### Authentication

Authentication is handled by a custom **SSO authenticator** (`src/Security/SsoAuthenticator.php`) using `SsoServiceV2`. It reads a cookie (name from `$_ENV['COOKIE_NAME']`), validates it against a REST endpoint (`$_ENV['REST_URL']`), and stores user data in PHP session. On missing cookie, users are redirected to `$_ENV['PORTAL_URL']`. Required env vars: `COOKIE_NAME`, `COOKIE_DOMAIN`, `REST_URL`, `PORTAL_URL`.

Users are auto-provisioned in the database on first SSO login; units (`Unite`) are also auto-created from SSO data.

### Route naming convention

All routes use the `oukile_` prefix (e.g., `oukile_rangement_index`, `oukile_login`).

### API serialization groups

Entities use Symfony serializer groups to control API output. The pattern is `{entity}:read` / `{entity}:write`, with cross-entity groups used for nested reads (e.g., `zone:read` includes rangement fields, `piece:read` includes zone fields).

### File uploads

`MediaObject` entity uses `VichUploaderBundle`. Uploaded files are stored in `public/media/` and served at `/media`. The mapping is named `media_object` in `config/packages/vich_uploader.yaml`. `Piece` entities can reference a `MediaObject` as an image.
