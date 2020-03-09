FROM python:3.6
ENV PYTHONUNBUFFERED 1
RUN mkdir /code
WORKDIR /code
ADD requirements.txt /code/
RUN pip install -r requirements.txt
ADD . /code/
CMD ["source" ,"/code/WikiContrib/.env"]
CMD [ "/code/manage.py","migrate" ]
CMD [ "/code/manage.py","runserver" ,"0.0.0.0:8000"]