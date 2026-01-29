# bifrost-plugin

Plugin installer / wizard for bifrost projects.

## Installing A Plugin

### Interactive Mode

Once your project has completed its installation process, you may now cd into the newly created directory and run:

```bash
bunx bifrost-plugin
```

Entering interactive mode it will display the following options:
- List available plugins to install
- Plugin wizard ( guide in creating your own plugin )
- Submit Plugin

## `List available plugins to install` 

Running the following command will start plugin installation process:

```bash
bunx bifrost-plugin list
```

The installer will then obtain the list of available plugins to choose from the bifrost-plugin repo (owner `8an3`) from the file labeled `registry.bifrost`

### Direct Installation

or you may use the supplied method 

```bash
bunx bifrost-plugin otp-auth-plugin
```

Which will immediatly start the installation process, after scanning your projects config.bifrost to see if the platforms match for compatibility to ensure you are installing the correct plugin.

## `Plugin wizard`
### Creating your own plugin

Running the following command will start the create plugin wizard:

```bash
bunx bifrost-plugin create
```

Where it will then inquirer:
- name of plugin ( req )
- platform ( req )
- description ( req )
- tags you would like to have associated with your plugin
- will ask if you would like to supply the req. libraries now
  - a placeholder will display the format to input the library names but will go as follows @remix-run/react, remix-auth, react
- auto push / create github repo

It will then create:
- create `files/` folder
- run `npm init`
- push to github
- create a readme containing a plugin guide and links to the site in order to submit your new plugin and discover others
- create `plugin.bifrost` configuration file, filing in all the fields that it had gotten from you during the setup process
  - name
  - description
  - platform
  - tags, if you completed this step
  - libraries, if you completed this step
  - github

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
  "libraries": ["remix-auth-totp","remix-auth","@catalystsoftware/icons","@prisma/client","resend"],
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
    "configs":[]
}
```

## `Submit Plugin`

Running the following command will start the submission process without the need of interactive mode:

```bash
bunx bifrost-plugin submit
```

Selecting this option will automate the submission process for you, adding your plugin to the libraries registry. Allowing you to share you plugin with others that will also be posted on the site to allow users to find it more easily. 


## Searching / Posting Templates and Plugins

Shortly a site will be available for use where you can search for templates and plugins.

Feature two tabs, both tabs will host a filtering section located to the left of the pages content and a search bar located at the top of each tabs section. Allowing you to filter by platform, tags, etc meanwhile the search bar will allow you to search for individual templates or plugins for you to use.

### Templates

Each template result will display:
- name
- description
- platform
- command line to install the template
- tags
- any plugins that are to be included with the templates installation 

### Plugins

Each plugin result will display
- name
- description
- platform
- command line to install the plugin
- tags
- required libraries
- required files

### Submitting

Whether its a template or plugin, you will have the ability to submit your own to be included with its respective registry, this step is not required or needed but will help in its overall discoverability.
All you have to do in order to submit is supply your templates or plugins config file once you start the submission process. The pages nav bar will host a `submit` button in order to start the process.

Upon submission the website will automatically update the relevant registry file and push the update to github to ensure the process is automated.
