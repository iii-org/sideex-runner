FROM openjdk:8

WORKDIR /usr/src/app
COPY app.js config.json package.json ./ 

RUN apt update
RUN apt install -y apt-utils
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt install -y ./google-chrome-stable_current_amd64.deb

RUN wget https://chromedriver.storage.googleapis.com/92.0.4515.43/chromedriver_linux64.zip
RUN unzip chromedriver_linux64.zip
RUN rm chromedriver_linux64.zip
RUN chmod +x chromedriver

RUN wget https://selenium-release.storage.googleapis.com/3.141/selenium-server-standalone-3.141.59.jar

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt install -y nodejs
RUN apt install -g debug
RUN npm install -g @sideex/runner

RUN npm install

CMD ["/bin/bash", "-c", "node", "app.js"]
