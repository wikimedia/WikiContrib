FROM python:3.6
ENV PYTHONUNBUFFERED 1
SHELL ["/bin/bash", "-c"]
RUN mkdir /code
WORKDIR /code
ADD requirements.txt /code/
RUN pip install -r requirements.txt
ADD . /code/
RUN source /code/WikiContrib/.env
RUN /code/manage.py migrate
CMD [ "/code/manage.py","runserver" ,"0.0.0.0:8000"]