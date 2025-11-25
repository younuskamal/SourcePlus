# SourcePlus Licensing Server

This project provides an API for managing licenses and license keys using [SourcePlus](https://github.com/sourceplus). It also includes a React client application that can be used as a standalone licensing system or integrated into other applications.

## Environment Variables

The following environment variables must be defined:

| Variable | Description |
| --- | --- |
| SOURCEPLUS_API_KEY | The API key for the SourcePlus instance being used. |
| SOURCEPLUS_BASE_URL | The base URL of the SourcePlus instance being used. |
| SOURCEPLUS_LICENSE_ID | The ID of the license being managed by this server. |
| SOURCEPLUS_LICENSE_NAME | The name of the license being managed by this server. |
| SOURCEPLUS_LICENSE_DESCRIPTION | A description of the license being managed by this server. |
| SOURCEPLUS_LICENSE_KEYS | Comma-separated list of license keys associated with the license. |
| SOURCEPLUS_LICENSE_EXPIRATION_DATE | The expiration date of the license (in ISO format). |
| SOURCEPLUS_LICENSE_MAX_USERS | The maximum number of users allowed under the license. |
| SOURCEPLUS_LICENSE_MAX_ACTIVE_SESSIONS | The maximum number of active sessions allowed under the license. |
| SOURCEPLUS_LICENSE_MAX_STORAGE_SIZE | The maximum storage size allowed under the license (in bytes). |
| SOURCEPLUS_LICENSE_MAX_CONCURRENT_SESSIONS | The maximum number of concurrent sessions allowed under the license. |
| SOURCEPLUS_LICENSE_MAX_DATA_TRANSFER_RATE | The maximum data transfer rate allowed under the license (in bits per second). |
| SOURCEPLUS_LICENSE_MAX_CPU_USAGE | The maximum CPU usage allowed under the license (as a percentage). |
| SOURCEPLUS_LICENSE_MAX_MEMORY_USAGE | The maximum memory usage allowed under the license (in bytes). |
| SOURCEPLUS_LICENSE_MAX_DISK_SPACE_USAGE | The maximum disk space usage allowed under the license (in bytes). |

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Ensure any required environment variables are set (see "Environment" above).
3. Start the development server (client):
   `npm run dev`

## Run Locally (Server)

1. Change into the `server/` folder and install dependencies:
   ```powershell
   Set-Location -Path .\\server
   npm install
   ```
2. Start the server in development mode (project uses TypeScript/Node):
   `npm run dev`

## Docker / Deploy

See `docker-compose.yml`, `Dockerfile.frontend`, and `server/Dockerfile` for containerized deployment configurations.

## Quick Troubleshooting

- If `npm run dev` fails in `client/`, run `npm install` inside `client/` first.
- Ensure your Git remote is configured before pushing changes.

## Contributing

If you make changes, please commit with a concise message and push to the appropriate branch. Open a PR if you want review.

---
Updated README to improve clarity and local run instructions.
