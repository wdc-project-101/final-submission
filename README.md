# Final Project - When2Chill
https://github.com/wdc-project-101/final-submission

## Setup
1. Run "npm install" to install all node dependencies
2. Run "sql_start" to start the mysql server
3. Run "mysql --host=127.0.0.1 < setup.sql" to setup the project database

## Run
1. Run "npm start" to start the express server
2. Click the link for the 8080 port in the ports tab to visit the website
3. Sign up then log in, or sign in with a Google account

## Kill Port
Sometimes, a port used by 'npm start' will not terminate properly, leaving a hanging port
You can kill the port by running 'fuser -k [port]/tcp'