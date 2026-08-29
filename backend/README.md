<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

Production runs the NestJS backend, PostgreSQL, and Redis with Docker Compose. GitHub Actions builds an immutable `linux/amd64` image, publishes it to GHCR, and deploys it to EC2 after a successful push to `master`.

The existing Caddy process stays on the EC2 host:

```caddyfile
api.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

### One-time EC2 setup

Install Docker Engine with the Compose plugin, then create the directory configured as `EC2_DEPLOY_PATH`:

```bash
sudo install -d -o "$USER" -g "$USER" /opt/daily-noti-backend
```

Create `/opt/daily-noti-backend/.env` from `deploy.env.example`. Use Docker service names in production:

```dotenv
PORT=3000
DATABASE_URL=postgresql://daily_noti:replace-me@postgres:5432/daily_noti
REDIS_HOST=redis
REDIS_PORT=6379
```

Add the remaining database, Redis, and Firebase values, then restrict the file:

```bash
chmod 600 /opt/daily-noti-backend/.env
```

No persistent GHCR credential is required on EC2. During deployment, GitHub Actions sends its short-lived `GITHUB_TOKEN` through encrypted SSH stdin, pulls the private image, and logs Docker out afterward. The token is not written to this repository or the production `.env`.

### GitHub Actions secrets

- `EC2_HOST`: EC2 public DNS name or stable IP.
- `EC2_USER`: SSH user, normally `ubuntu`.
- `EC2_SSH_PRIVATE_KEY`: private key authorized for that user.
- `EC2_KNOWN_HOSTS`: verified SSH known-host entry.
- `EC2_DEPLOY_PATH`: `/opt/daily-noti-backend`.

Generate the known-host entry from a trusted network and verify its fingerprint before saving it:

```bash
ssh-keyscan -H YOUR_EC2_HOST
```

The workflow uses the built-in `GITHUB_TOKEN` to publish and pull images. No `GHCR_PULL_TOKEN` repository secret is required, and the workflow never uploads the production `.env`.

### Network rules

- The backend binds only `127.0.0.1:3000` for host Caddy.
- Redis does not publish port 6379.
- PostgreSQL publishes `5432:5432`. Restrict EC2 Security Group inbound TCP 5432 to trusted IP addresses. Never allow `0.0.0.0/0` or `::/0` on port 5432.

### Deployment and rollback

A push to `master` tests and builds the backend, publishes SHA and `latest` tags, applies Prisma migrations, and waits for backend health. A failed backend health check restores the previously recorded image.

Deploy or roll back manually with an immutable SHA tag:

```bash
cd /opt/daily-noti-backend
printf '%s' "$GHCR_READ_TOKEN" | docker login ghcr.io \
  -u YOUR_GITHUB_USERNAME --password-stdin
bash ./deploy-ec2.sh ghcr.io/OWNER/REPOSITORY/backend:GIT_COMMIT_SHA
docker logout ghcr.io
```

The manual-only `GHCR_READ_TOKEN` needs just `read:packages` and does not need to remain on EC2 after logout.

Migrations must remain compatible with the immediately previous image because application rollback does not reverse database migrations.

### Logs and status

```bash
cd /opt/daily-noti-backend
docker compose --env-file .env ps
docker compose --env-file .env logs -f --tail=200 backend
docker compose --env-file .env logs -f postgres redis
```

Logs rotate at 10 MB with five retained files per service.

### Data backup

Docker volumes survive container recreation but are not backups. Create a logical PostgreSQL backup before moving server or running risky database work:

```bash
docker compose --env-file .env exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > postgres-backup.sql
```

If pending BullMQ jobs must survive a server move, include the Redis AOF/RDB data in the migration backup.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
