#!/usr/bin/env bash
ssh -o "StrictHostKeyChecking=no" -i /tmp/deploy_rsa -A rampotla@login.tools.wmflabs.org << EOT
become WikiContrib
rm -rf ~/public_html/
mkdir ~/public_html/
cd ~/public_html/
git clone https://github.com/wikimedia/WikiContrib/
cd WikiContrib/frontend/WikiContrib-Frontend/
npm run build
cp -a ./build/. ../../../
cd ../../../
rm -rf WikiContrib
EOT