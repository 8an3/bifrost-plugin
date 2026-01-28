# bifrost-plugin

Plugin installer for bifrost projects.

## Installation

```bash
bunx bifrost-plugin
```

## Usage

### Interactive Mode

Navigate to your bifrost project directory and run:

```bash
bunx bifrost-plugin
```

This will:
1. Detect your project's platform from `config.bifrost`
2. Show available plugins compatible with your platform
3. Allow you to select and install a plugin

### Direct Installation

Install a specific plugin by name:

```bash
bunx bifrost-plugin otp-auth-plugin
```


## Creating your own plugin

Plugins are to be made with their own repo so as it can host all the required files for the plugin. 
The repo is required to include a json config file labeled `plugin.bifrost` and a folder labeled `files` where it will host all the required files.
When installing a plugin it will prompt the user to either confirm the default supplied file location or the use can also edit the location to suite their use cases needs.

### plugin.bifrost
```json
{
  "name": "otp-auth-plugin",
  "description": "A custom one time password auth plugin for the remix platform",
  "platform": "remix",
  "github": "8an3/otp-auth-plugin",
  "tags": ["remix-run", "auth", "one-time-password"],
  "dependencies": ["remix-auth-totp","remix-auth","@catalystsoftware/icons","@prisma/client","resend"],
  "devDependencies": [],
  "files": [
        {
        "name": "email.tsx",
        "location": "app/components/catalyst-ui/utils/email.tsx"
        },
        {
        "name": "client-auth.tsx",
        "location": "app/components/catalyst-ui/utils/client-auth.tsx"
        },
        {
        "name": "auth-session.ts",
        "location": "app/components/catalyst-ui/utils/auth-session.ts"
        },
        {
        "name": "prisma.ts",
        "location": "app/components/catalyst-ui/utils/prisma.ts"
        },
        {
        "name": "login.tsx",
        "location": "app/routes/auth/login.tsx"
        },
        {
        "name": "lougout.tsx",
        "location": "app/routes/auth/lougout.tsx"
        },
        {
        "name": "signup.tsx",
        "location": "app/routes/auth/signup.tsx"
        },
        {
        "name": "magic-link.tsx",
        "location": "app/routes/auth/magic-link.tsx"
        },
             {
        "name": "verify.tsx",
        "location": "app/routes/auth/verify.tsx"
        },
    ],
    "configs":[
        {
            "targetFile": "prisma/schema.prisma",
            "configSource": "prisma-schema.txt",
            "insertType": "append" // or "replace", "merge"?
        }
    ]
}
```

## License

MIT
