# Polygon City

* [Install MongoDB](http://docs.mongodb.org/manual/installation/)
* [Start a MongoDB instance](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/#run-mongodb)
* Create a user:
  * db.createUser( { user: "user", pwd: "password", roles: [ "readWrite", "dbAdmin" ] } )
* [Create a 2D-sphere index](http://docs.mongodb.org/manual/tutorial/build-a-2dsphere-index/) (for geo search)
  * `db.buildings.ensureIndex( { location: "2dsphere" } )`
* Rename `/config/config.sample.js` to `/config/config.js` and update with your MongoDB settings
* Add a phrase to session: secret in config.js
* Run `npm install` from the project directory
* Run `bower install` from the project directory (install Bower if you don't have it already)
* Run `grunt` from the project directory
* Open [http://localhost:3000](http://localhost:3000)
* Sign up for a new account
