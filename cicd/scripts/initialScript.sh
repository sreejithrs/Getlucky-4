#!/bin/bash
apt-get update
apt-get install -y zip
# npm i
# npm version

# # pretest for eslint
# npm run pretest
# if [ $? -eq 0 ]; then
# 	echo "Eslint test OK"
# else
# 	echo "Eslint test FAIL"
# 	exit 1
# fi

########### execute for finding security issues ###########
git clone https://github.com/awslabs/git-secrets
cd git-secrets
make install
cd ../
git secrets --install

# Add support for AWS secret scan
git secrets --register-aws

# Add patterns
git secrets --add -l 'API_KEY:'
git secrets --add -l '"API_KEY":'
git secrets --add -l 'JWT_SECRET:'
git secrets --add -l '"JWT_SECRET":'
git secrets --add -l 'MONGO_URL:'
git secrets --add -l '"MONGO_URL":'
git secrets --add -l 'AWS_SES_REGION:'
git secrets --add -l '"AWS_SES_REGION":'
git secrets --add -l 'AWS_S3_LINK:'
git secrets --add -l '"AWS_S3_LINK":'
git secrets --add -l 'AWS_BUCKET:'
git secrets --add -l '"AWS_BUCKET":'
git secrets --add -l 'SERVERKEY:'
git secrets --add -l '"SERVERKEY":'

git secrets --add -l 'AKIA[0-9A-Z]{20}:'
git secrets --add -l '"AKIA[0-9A-Z]{20}":'

git secrets --add  "'[0-9a-zA-Z@#$%^!&+.\-_:*]{25,200}'"
git secrets --add  '"[0-9a-zA-Z@#$%^!&+.\-_:*]{25,200}"'
git secrets --add  '[0-9a-zA-Z@#$%^!&+.\-_:*]{25,200}'

git secrets --add --allowed 'src/locales/de.json:.*'
git secrets --add --allowed 'src/locales/en.json:.*'
git secrets --add --allowed 'src/locales/keys.json:.*'
git secrets --add --allowed 'bitbucket-pipelines.yml:.*'
git secrets --add --allowed '.eslintrc.cjs:.*'


git secrets --add -a 'add'

# Scan the latest git push
git secrets --scan
if [ $? -eq 0 ]; then
	echo "git secrets --scan OK"
else
	echo "git secrets --scan FAIL"
	exit 1
fi
########### ends here ##########

rm -rf git-secrets
rm -rf node_modules
rm -rf logs
mkdir uploads
zip -r latest *
