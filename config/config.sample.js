module.exports = {
  "db": {
    "url": "mongodb://<dbUser>:<dbPassword>@<dbPath>:<dbPort>/<dbName>"
  },
  "email": {
    "smtp": {
      "host": "localhost",
      "port": 25,
      "auth": {
          "user": "username",
          "pass": "password"
      }
    },
    "report": {
      "fromAddress": "noreply@example.com",
      "subject": "Building report"
    },
    "reset": {
      "fromAddress": "noreply@example.com",
      "subject": "Password reset"
    },
    "verify": {
      "fromAddress": "noreply@example.com",
      "subject": "Please verify your account"
    }
  },
  "session": {
    "secret": ""
  }
};