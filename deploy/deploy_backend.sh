#!/usr/bin/env bash
ssh -o "StrictHostKeyChecking=no" -i deploy_rsa -A ${DEPLOY_USERNAME}@${DEPLOY_HOST} << EOT
become ${DEPLOY_BACKEND}
cd ~/www/python/
git clone https://github.com/wikimedia/WikiContrib/
echo "Cloned the repository"
mv src/WikiContrib/.env WikiContrib/backend/WikiContrib/WikiContrib/.env
cd src/
rm -rf WikiContrib/ Install.md manage.py query/ result/ test_data/ requirements.txt db.sqlite3
cp -r ../WikiContrib/backend/WikiContrib/* .
cd WikiContrib
mv local_settings.py local_settings_sample.py
cd ../
webservice --backend=kubernetes python3.7 shell
echo "Activated kubernetes webservice shell"
source ~/www/python/venv/bin/activate
pip install --upgrade pip wheel
pip install -r ~/www/python/src/requirements.txt
echo "Performed the shell operations"
python  ~/www/python/src/manage.py makemigrations
python ~/www/python/src/manage.py migrate
echo "Ran updated migrations"
deactivate
exit
webservice --backend=kubernetes python3.7 restart
rm -rf WikiContrib src/WikiContrib/.env.example
echo "Updated backend"
EOT
