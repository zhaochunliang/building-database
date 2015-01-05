module.exports = {
  "db": {
    "url": "mongodb://<dbUser>:<dbPassword>@<dbPath>:<dbPort>/<dbName>"
  },
  "email": {
    "report": {
      "fromAddress": "noreply@example.com",
      "subject": "Building report"
    },
    "reset": {
      "fromAddress": "noreply@example.com",
      "subject": "Password reset"
    }
  },
  "session": {
    "secret": ""
  }
};