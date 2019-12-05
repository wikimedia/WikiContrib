#!/usr/bin/env bash
ssh -o "StrictHostKeyChecking=no" -i deploy_rsa -A ${DEPLOY_USERNAME}@${DEPLOY_HOST} << EOT
become ${DEPLOY_BACKEND}
source ~/www/python/venv/bin/activate
echo "Activated the environment"
cd ~/www/python/
git clone https://github.com/wikimedia/WikiContrib/
echo "Cloned the repository"
mv src/contraband/.env WikiContrib/backend/Contraband/contraband/.env
cd src/
rm -rf contraband/ Install.md manage.py query/ result/ test_data/ requirements.txt db.sqlite3
cp -r ../WikiContrib/backend/Contraband/* .
cd contraband
mv local_settings.py local_settings_sample.py
cd ../
echo "Performed the necessary changes"
python manage.py makemigrations
python manage.py migrate
echo "Ran updated migrations"
webservice --backend=kubernetes python3.5 restart
cd ../
rm -rf WikiContrib src/contraband/.env.example
echo "Updated backend"
EOT