#!/usr/bin/env bash
ssh -o "StrictHostKeyChecking=no" -i deploy_rsa -A ${DEPLOY_USERNAME}@${DEPLOY_HOST} << EOT
become ${DEPLOY_BACKEND}
source ~/www/python/venv/bin/activate
echo "Activated the environment"
cd ~/www/python/
git clone https://github.com/wikimedia/WikiContrib/
mv src/WikiContrib/.env WikiContrib/backend/WikiContrib/WikiContrib/.env
cd src/
rm -rf WikiContrib/ Install.md manage.py query/ result/ test_data/ requirements.txt db.sqlite3
cp -r ../WikiContrib/backend/WikiContrib/* .
cd WikiContrib
mv local_settings.py local_settings_sample.py
cd ../
echo "Performed the shell operations"
python manage.py makemigrations
python manage.py migrate
echo "Ran updated migrations"
webservice --backend=kubernetes python3.5 restart
cd ../
rm -rf WikiContrib src/WikiContrib/.env.example
echo "Updated backend"
EOT