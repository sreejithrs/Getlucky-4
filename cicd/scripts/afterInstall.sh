#!/bin/bash
cd /home/ubuntu/getlucky-node
yarn install

# Copy source files to DEVELOPMENT environment
if [ "$DEPLOYMENT_GROUP_NAME" == "getlucky-dev-group" ]; then
pm2 start ../node_services/getlucky-dev.json
fi

# Copy source files to STAGING environment
if [ "$DEPLOYMENT_GROUP_NAME" == "getlucky-staging" ]; then
pm2 start ../node_services/getlucky-staging.json

fi
# Copy source files to PRODUCTION environment
if [ "$DEPLOYMENT_GROUP_NAME" == "getlucky-production" ]; then
pm2 start ../node_services/getlucky-production.json
fi
