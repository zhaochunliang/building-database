module.exports = {
  "siteURL": "http://yourdomain.ext",
  "db": {
    "url": "mongodb://<dbUser>:<dbPassword>@<dbPath>:<dbPort>/<dbName>",
    "options": {
      "server": {
        "auto_reconnect": true
      }
    }
  },
  "s3": {
    "accessId": "your_access_id",
    "accessKey": "your_access_key",
    "bucket": "your_bucket",
    "directory": "bucket_directory_for_model_files",
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
    "secret": "testing"
  }
};
