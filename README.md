# Polygon City

* [Install MongoDB](http://docs.mongodb.org/manual/installation/)
* [Start a MongoDB instance](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/#run-mongodb)
* Create Mongo indexes
  * `db.users.ensureIndex( { email: 1 }, { unique: true } );`
  * `db.users.ensureIndex( { username: 1 }, { unique: true } );`
  * `db.buildings.ensureIndex( { slug: 1 }, { unique: true } );`
  * `db.buildings.ensureIndex( { location: "2dsphere" } );`
* Rename `/config/config.sample.js` to `/config/config.js` and update with your MongoDB settings
* Add a phrase to session: secret in config.js
* Run `npm install` from the project directory
* Run `bower install` from the project directory (install Bower if you don't have it already)
* Run `grunt` from the project directory
* Open [http://localhost:3000](http://localhost:3000)
* Sign up for a new account
