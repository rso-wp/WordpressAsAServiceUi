# WordpressAsAServiceUi

Frontend for the WordPress hosting platform: sign in (Entra ID), first-sign-in profile, start WordPress sites with a card,
see their status, delete them. Full description: [../docs2/frontend.md](../docs2/frontend.md).

## Run

```bash
npm install
npm start            # http://localhost:4200 against the local services (see ../docs2/local-development.md)
npm run start:mock   # no backend, everything simulated in the browser
```

`npm start` proxies `/graphql`, `/payment-methods` and `/provisions` to the services on ports 5076, 5264 and 5151
(`proxy.conf.json`) and uses dev sign-in (any email). Start the services first, e.g.
`docker compose -f ../dev/docker-compose.yml --profile apps up -d --build`.

## Build and test

```bash
npm run build        # production: Entra sign-in, fill in src/environments/environment.ts first
npm test
```

## Configuration

- `src/environments/environment*.ts`: backend (`http` / `mock`) and sign-in (`entra` / `dev` / `mock`).
- `src/app/core/config.ts`: product name, base domain (must match ProvisioningService `Provisioning:BaseDomain`), price.
