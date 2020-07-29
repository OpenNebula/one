# Fire Edge

Fire Edge server and client

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
  - Other: check file `src/config/command-params.js`. if requires it to be in a specific zone you must put it at the end but before the query /feredation=ZONE_ID (replace ZONE_ID for the zone id)

- **zeroMQ**
  Websocket connection call to: `ws://127.0.0.1:3000/?token=JWT`

## Troubleshooting

- [nodemon] Internal watch failed: watch ENOSPC
for this error run `sudo sysctl fs.inotify.max_user_watches=582222 && sudo sysctl -p`

- Starting inspector on 127.0.0.1:9229 failed: address already in use
for this error run  `killall -9 node` and start app again

## Project description
...
