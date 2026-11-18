# WordpressAsAServiceUi

The **web app** of RSO, a WordPress-as-a-service platform (product name *PressHost*). A customer signs up, fills in their
profile, starts a WordPress site with a card, sees its status and address, and deletes it. Built with Angular 22 (signals,
standalone components) and Tailwind.

```
browser --sign in / sign up (redirect)--> Keycloak                  (accounts, passwords, tokens)
browser --GraphQL /graphql-------------> UserService               (profile, tenant)
browser --REST /payment-methods--------> PaymentService            (cards)
browser --REST /provisions-------------> ProvisioningService       (sites)
```

How it fits with the services and how to run all of it on your machine or on Azure: the **Deployment** repository.

## What is in it

| Route | Page |
|---|---|
| `/login` | **Sign in** and **Create account**: both send the browser to Keycloak's pages and back |
| `/welcome` | first sign-in: name, last name and company (the company, with the name, gives the tenant address) |
| `/sites` | your sites: create one (name + card), watch its status and address, delete it |

The product name and the version (the git tag the image was built from, `dev` locally) are shown in the header.

## Run it

You need Node 24 and npm. For the real backend, the services and Keycloak must be running: the compose file in the **Deployment**
repository (next to this one) starts the infrastructure, including **Keycloak on http://localhost:8180**.

```powershell
npm install
npm start               # http://localhost:4200, against the real services on this machine
npm run start:mock      # no backend at all: everything is simulated in the browser (any email and password work)
```

- `npm start` proxies `/graphql`, `/payment-methods` and `/provisions` to UserService (5076), PaymentService (5264) and
  ProvisioningService (5151), see `proxy.conf.json`. Start them first (`Deployment\local\run-local.ps1` does).
- Sign-in and sign-up go to Keycloak on `http://localhost:8180` (realm `rso`, client `rso-frontend`, imported by the compose
  file). Click **Create account**, fill in Keycloak's form, and you come back signed in.

## How sign-in works

The app uses [`keycloak-js`](https://www.npmjs.com/package/keycloak-js) (authorization code flow). The access token is sent as a
bearer token to every API call and is renewed with the refresh token shortly before it expires (`core/auth/`). Tokens are kept
in `sessionStorage`, so a reload keeps you signed in but a new tab goes through Keycloak again.

Keycloak's address is **not configured in the build**: the same image runs everywhere. The app finds it from the address it is
served at: `keycloak.<host>` next to the app (for `http://1-2-3-4.sslip.io` that is `http://keycloak.1-2-3-4.sslip.io`), or
`localhost:8180` when it runs on your machine (`core/auth/keycloak-config.ts`). Keycloak's client must list the app's address as
a redirect URI (the Deployment repository's realm and Helm chart do).

On plain `http` (not localhost) browsers do not offer the crypto functions `keycloak-js` wants, so the app adds a small
replacement for `crypto.randomUUID` and turns PKCE off there. On `https` and localhost PKCE is used.

## Configuration

- `src/environments/environment*.ts`: which backend (`http` or `mock`) and which sign-in (`keycloak` or `mock`). `npm start`
  uses the development file, `npm run build` the production one, `npm run start:mock` the mock one.
- `src/app/core/config.ts`: product name, the base domain (**must match** ProvisioningService's `Provisioning:BaseDomain`, it is
  only used to show a site's address), and the price text.

## Build and test

```powershell
npm run build           # production build in dist/
npm test                # unit tests (vitest), single run: npm test -- --watch=false
```

The tests cover the tenant-slug preview and site-name rules, how Keycloak's address is found, the `randomUUID` fallback, the
version label, and the login page in both modes (Keycloak buttons, demo form).

## Container image and release

The `Dockerfile` builds the app and serves it with nginx (non-root, port 8080). The APIs are expected on the same address
(behind the gateway), so run it behind the platform's gateway. The version shown in the app is a build argument:

```powershell
docker build --build-arg APP_VERSION=v1.2.3 -t wordpressasaserviceui .
```

**Push a git tag like `v1.2.3`** and the *Publish image* workflow does that and pushes `armodilo/wordpressasaserviceui:v1.2.3` to
Docker Hub (it needs the repository secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`); Argo CD Image Updater then deploys
it. Pushes and pull requests run the tests and a production build (`.github/workflows/ci.yml`).
