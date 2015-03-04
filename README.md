# Polygon City

* [Install MongoDB](http://docs.mongodb.org/manual/installation/)
* [Start a MongoDB instance](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/#run-mongodb)
* In the mongo shell, add a user/password to building-database
  * `use building-database`
  * `db.createUser(
  {
    user: "user",
    pwd: "password",
    roles: [ "readWrite", "dbAdmin" ]
  }
);`
* Create Mongo indexes
  * `db.users.ensureIndex( { email: 1 }, { unique: true } );`
  * `db.users.ensureIndex( { username: 1 }, { unique: true } );`
  * `db.buildings.ensureIndex( { "slug.id": 1 }, { unique: true } );`
  * `db.buildings.ensureIndex( { location: "2dsphere" } );`
* Rename `/config/config.sample.js` to `/config/config.js` and update with your settings (all are required)
  * Mongo example: `"url": "mongodb://user:password@localhost/building-database"`
* Add a phrase to session: secret in `config.js`
* In the project directory, run:
  * `sudo npm update`
  * `npm install`
  * `sudo npm install -g bower`
  * `bower install`
  * `sudo npm install -g grunt-cli`
* To start the server, run `grunt` in the project directory
* Open [http://localhost:3000](http://localhost:3000)
* Sign up for a new account
