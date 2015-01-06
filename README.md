# Polygon City

## Installation

_Note: It's easiest to [use Docker](#using-docker) if you want to reliably get something up and running quickly._

## Installation

_Note: It's easiest to [use Docker](#using-docker) if you want to reliably get something up and running quickly._

* [Install MongoDB](http://docs.mongodb.org/manual/installation/)
* [Start a MongoDB instance](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/#run-mongodb)
* [Create a 2D-sphere index](http://docs.mongodb.org/manual/tutorial/build-a-2dsphere-index/) (for geo search)
  * `db.collection.ensureIndex( { location: "2dsphere" } )`
* Rename `/config/db.sample.js` to `/config/db.js` and update with your MongoDB settings
* Run `npm install` from the project directory
* Run `bower install` from the project directory (install Bower if you don't have it already)
* Run `grunt` from the project directory
* Open [http://localhost:3000](http://localhost:3000)
* Sign up for a new account

## Using Docker

* [Install Docker](https://docs.docker.com/installation/)
* [Install fig](http://www.fig.sh/install.html)
* If on Mac, start boot2docker using: `boot2docker up`
* Run `fig build` from the polygon-city directory
* Run `fig up` from the polygon-city directory
* Find your Docker IP
  * On Mac this can be found using `boot2docker ip`
* Open http://your-docker-ip:3000