#!/usr/bin/env bash
ssh -o "StrictHostKeyChecking=no" -i /tmp/deploy_rsa -A ${DEPLOY_USERNAME}@${DEPLOY_HOST} << EOT
become ${DEPLOY_FRONTEND}
rm -rf ~/public_html/
git clone https://github.com/wikimedia/WikiContrib
echo "Cloned the repo"
cp -r WikiContrib/frontend/WikiContrib-Frontend/. dep/
rm -rf WikiContrib/
cd dep/
mv dist/ src/dist/
npm run build
echo "Creating the build folder"
mv src/dist/ dist/
cd ../
mkdir public_html/
cp -r dep/build/. public_html/
cd dep/
rm -rf build/ package.json package-lock.json public/ README.md src/ Install.md
echo "Performed all the shell operations."
webservice --backend=gridengine --release buster lighttpd restart
EOT