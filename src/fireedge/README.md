# Sunstone React

New Sunstone incarnation in React.

## Build & Run

- **yarn** (this command import the dependecies).
- **yarn build** (execute the javascript build "bundle")
- **yarn start** (start the server in port 3000)

## Development
- **yarn dev** (run server in mode development)

## How to use

- **Api**

  REST Interface. Usually Returns OpenNebula resource info. Login returns a JSON Web Token (`JWT`).

  - Login: POST: `http://localhost:3000/api/auth` with params: `user` and `pass`.
  - Other: check file `src/config/command-params.js`

- **zeroMQ**
  Websocket connection call to: `ws://127.0.0.1:3000/?token=JWT`

## Troubleshooting

- [nodemon] Internal watch failed: watch ENOSPC
for this error run `sudo sysctl fs.inotify.max_user_watches=582222 && sudo sysctl -p`

- Starting inspector on 127.0.0.1:9229 failed: address already in use
for this error run  `killall -9 node` and start app again

## Project description

- `disk`: this folder content the transpiled code.
- `disk/public`: content the transpiled code valid for the HTML.
- `node_modules`: dependencies for backend (NODE).
- `src`: non-transpiled code.
- `src/config`: configuration files (please do not modify if you do not know how it works).
- `src/config/command-params.js`: it contains the different commands with the possible opennebula parameters.
- `src/config/defaults.js`: it contains default string parameters.
- `src/config/function-routes.js`: it contains routes that are not opennebula commands.
- `src/config/http-codes.js`: it contains all http codes for routes.
- `src/config/params.js`: it contains the parameters used by the paths, example: `http://localhost:3000/api/template/id=0/action=info`.
- `src/config/routes-api.js`: gather the different routes used by the API.
- `src/public`: contains the sunstone in react.
- `src/routes`: contains the routes for node (API and WEB).
- `src/utils`: utilities used by the application.
- `src/index.js`: entrypoint node.
- `config.yml`: enviroment config for user
- `.eslintignore`: files ignored by the eslint
- `copyStaticAssets.js`: copy the html resourses to dist/public path (.ico, .css, fonts, etc).
- `packaje.json`: contains the name of the packages used by the application.
- `webpack.config.js`: contains the JS transpiler configurations.
- `yarn.lock`: contains the dependencies using the yarn command.
