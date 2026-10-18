# WordpressAsAServiceUi

Frontend for the WordPress hosting platform: sign up / sign in (email + password, UserService), first-sign-in profile, start WordPress sites with a card,
see their status, delete them. Full description: [../docs2/frontend.md](../docs2/frontend.md).

## Run

```bash
npm install
npm start            # http://localhost:4200 against the local services (see ../docs2/local-development.md)
npm run start:mock   # no backend, everything simulated in the browser
```

`npm start` proxies `/graphql`, `/payment-methods` and `/provisions` to the services on ports 5076, 5264 and 5151
(`proxy.conf.json`); create an account on the sign-in page. Start the services first, e.g.
`docker compose -f ../dev/docker-compose.yml --profile apps up -d --build`.

## Build and test

```bash
npm run build        # production: same-origin APIs behind the gateway
npm test
```

## Configuration

- `src/environments/environment*.ts`: backend (`http` / `mock`) and sign-in (`password` / `mock`).
- `src/app/core/config.ts`: product name, base domain (must match ProvisioningService `Provisioning:BaseDomain`), price.
