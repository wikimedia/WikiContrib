#!/usr/bin/env bash
cd frontend/WikiContrib-Frontend/
npm run build
cd build
git init
git add .
git commit -m "Deploy commit"
git push -f https://${GIT_USERNAME}:${GIT_PASS}@${GIT_REPO} --all
echo "Pushed the Repo for deployment"