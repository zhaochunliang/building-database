FROM dockerfile/nodejs

MAINTAINER Robin Hawkes, rob@vizicities.com

# Should be available via VOLUME link in fig.yml
WORKDIR /home/polygon-city

# Install Mean.JS Prerequisites
RUN npm install -g grunt-cli
RUN npm install -g bower

# Install Mean.JS packages
ADD package.json /home/polygon-city/package.json
RUN npm install

# Manually trigger bower. Why doesnt this work via npm install?
ADD .bowerrc /home/polygon-city/.bowerrc
ADD bower.json /home/polygon-city/bower.json
RUN bower install --config.interactive=false --allow-root

# Make everything available for start
# Should be available via VOLUME link in fig.yml
ADD . /home/polygon-city

# Currently only works for development
ENV NODE_ENV development

# Logging (why isn't this triggering the debug module output?)
ENV DEBUG buildingDatabase

# Port 3000 for server
# Port 35729 for livereload
EXPOSE 3000 35729
CMD ["node", "bin/www"]