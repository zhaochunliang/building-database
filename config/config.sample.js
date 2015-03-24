module.exports = {
  "db": {
    "url": "mongodb://<dbUser>:<dbPassword>@<dbPath>:<dbPort>/<dbName>"
  },
  "s3": {
    "accessId": "your_access_id",
    "accessKey": "your_access_key",
    "bucket": "your_bucket",
    "region": "your_bucket_region"
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
      "toAddress": "somebody@example.com",
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