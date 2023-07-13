# Welcome to Getlucky👋

## Requirement

For development, you will only need Node.js and a node global package, Yarn, installed in your environment.

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt-get install curl
      $ curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
      $ sudo apt-get install -y nodejs

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v14.x.x

    $ npm --version
    6.14.6


### Yarn installation
  After installing node, this project will need yarn too, so just run the following command.

      $ curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
      $ echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
      $ sudo apt-get update
      $ sudo apt-get install yarn -y

  If the installation was successful, you should be able to run the following command.

    $ yarn --version
    1.22.5

## Dependencies

  Dependencies used in the application

    app-root-path (v2.2.1),
    aws-sdk (v2.542.0),
    bcrypt-nodejs (v0.0.3),
    bluebird (v3.7.0),
    chalk (v2.4.2),
    cors (v2.8.5),
    dotenv (v6.1.0),
    eslint-config-strongloop (v2.1.0),
    express (v4.16.4),
    express-promise-router (v3.0.3),
    helmet (v3.15.0),
    http-errors (v1.7.3),
    i18n (v0.13.3),
    i18n-nodejs (v3.0.0),
    joi (v14.3.0),
    jsonwebtoken (v8.4.0),
    lodash (v4.17.15),
    moment (v2.24.0),
    mongoose (v5.3.14),
    morgan (v1.9.1),
    nodemailer (v6.3.0),
    passport (v0.4.0),
    passport-jwt (v4.0.0),
    passport-local (v1.0.0),
    random-string (v0.2.0),
    request (v2.88.2),
    winston (v3.2.1),
    winston-daily-rotate-file (v4.2.1)

## Install

  To install all the dependencies in the project
    
    yarn install

## Usage

  To run the backend application

    yarn start
        OR
    pm2 start ecosystem.json ( Install pm2 to run this command )

## Run tests

    yarn test

## Author

👤 **SREEJITH**