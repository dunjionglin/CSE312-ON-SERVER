# getting base image python 3
FROM python:3

# Set environment to current environment
ENV HOME ./

# cd into home directory
WORKDIR ./

# Copy all file in current directory into image
COPY . .

#RUN
RUN pip install -r requirements.txt
RUN pip install mysql-connector-python


# allow external access to container through port 8000
EXPOSE 8080

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait 

#ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
#RUN chmod +x /wait

# run python with path ./serverfiles/server.py
CMD python server.py
#/wait && python ./server.py