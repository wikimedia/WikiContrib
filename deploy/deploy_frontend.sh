#!/usr/bin/env bash
ssh -o "StrictHostKeyChecking=no" -i /tmp/deploy_rsa -A ${DEPLOY_USERNAME}@${DEPLOY_HOST} << EOT
become ${DEPLOY_FRONTEND}
rm -rf ~/public_html/
git clone https://${GIT_REPO}
mv ${GIT_REPO_NAME}/ public_html/
echo "Cloned the repo, restarting the webservice...."
webservice lighttpd restart
EOT