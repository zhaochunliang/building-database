# Polygon City API

Polygon City exposes a simple public REST API for accessing information about buildings. Here are the current endpoints.

## GET /api/buildings

### Example response

```
[
  {
    "_id": "549ec0e4c26b85a38f708c02",
    "createdAt": "2014-12-27T14:23:32.889Z",
    "updatedAt": "2015-01-03T17:41:10.232Z",
    "userId": "547cc55f36d73a5a5ee5c490",
    "name": "One Canada Square",
    "__v": 0,
    "stats": {
      "views": 96,
      "downloads": 100
    },
    "osm": {
      "type": "way",
      "id": 5986754
    },
    "models": {
      "zip": [
        {
          "type": "dae",
          "path": "/model-files/006410aa-bb2e-451b-bd7f-39610bfae26a/006410aa-bb2e-451b-bd7f-39610bfae26a_dae.zip",
          "_id": "549ec0e4c26b85a38f708c05",
          "fileSize": 615520
        },
        {
          "type": "obj",
          "path": "/model-files/006410aa-bb2e-451b-bd7f-39610bfae26a/006410aa-bb2e-451b-bd7f-39610bfae26a_obj.zip",
          "_id": "549ec0e4c26b85a38f708c06",
          "fileSize": 607695
        }
      ],
      "raw": [
        {
          "type": "dae",
          "path": "/model-files/006410aa-bb2e-451b-bd7f-39610bfae26a/raw/models/untitled.dae",
          "_id": "549ec0e4c26b85a38f708c03",
          "fileSize": 142746
        },
        {
          "type": "obj",
          "path": "/model-files/006410aa-bb2e-451b-bd7f-39610bfae26a/raw/models/untitled.obj",
          "_id": "549ec0e4c26b85a38f708c04",
          "fileSize": 19543
        }
      ]
    },
    "structure": {
      "faces": 191,
      "vertices": 97
    },
    "angle": 2.7,
    "scale": 1,
    "locality": {
      "countryCode": "GBR",
      "country": "United Kingdom",
      "district": "Tower Hamlets"
    },
    "location": {
      "type": "Point",
      "coordinates": [
        -0.01937,
        51.50517
      ]
    }
  },
  ...
]
```


## GET /api/building/:building_id

### Example response

```
{
  "_id": "549ec0e4c26b85a38f708c02",
  "createdAt": "2014-12-27T14:23:32.889Z",
  "updatedAt": "2015-01-03T17:41:10.232Z",
  "userId": "547cc55f36d73a5a5ee5c490",
  "name": "One Canada Square",
  "__v": 0,
  "stats": {
    "views": 96,
    "downloads": 100
  },
  "osm": {
    "type": "way",
    "id": 5986754
  },
  "models": {
    "zip": [
      {
        "type": "dae",
        "path": "/model-files/006410aa-bb2e-451b-bd7f-39610bfae26a/006410aa-bb2e-451b-bd7f-39610bfae26a_dae.zip",
        "_id": "549ec0e4c26b85a38f708c05",
        "fileSize": 615520
      },
      {
        "type": "obj",
        "path": "/model-files/006410aa-bb2e-451b-bd7f-39610bfae26a/006410aa-bb2e-451b-bd7f-39610bfae26a_obj.zip",
        "_id": "549ec0e4c26b85a38f708c06",
        "fileSize": 607695
      }
    ],
    "raw": [
      {
        "type": "dae",
        "path": "/model-files/006410aa-bb2e-451b-bd7f-39610bfae26a/raw/models/untitled.dae",
        "_id": "549ec0e4c26b85a38f708c03",
        "fileSize": 142746
      },
      {
        "type": "obj",
        "path": "/model-files/006410aa-bb2e-451b-bd7f-39610bfae26a/raw/models/untitled.obj",
        "_id": "549ec0e4c26b85a38f708c04",
        "fileSize": 19543
      }
    ]
  },
  "structure": {
    "faces": 191,
    "vertices": 97
  },
  "angle": 2.7,
  "scale": 1,
  "locality": {
    "countryCode": "GBR",
    "country": "United Kingdom",
    "district": "Tower Hamlets"
  },
  "location": {
    "type": "Point",
    "coordinates": [
      -0.01937,
      51.50517
    ]
  }
}
```


## GET /api/building/:building_id.kml

### Example response

```
<?xml version='1.0' encoding='UTF-8' ?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark>
    <name>One Canada Square</name>
    <Model id="549ec0e4c26b85a38f708c02">
      <altitudeMode>relativeToGround</altitudeMode>
      <Location>
        <longitude>-0.01937</longitude>
        <latitude>51.50517</latitude>
        <altitude>0</altitude>
      </Location>
      <Orientation>
        <heading>2.7</heading>
        <tilt>0</tilt>
        <roll>0</roll>
      </Orientation>
      <Scale>
        <x>1</x>
        <y>1</y>
        <z>1</z>
      </Scale>
      <Link>
      <href>/model-files/006410aa-bb2e-451b-bd7f-39610bfae26a/raw/models/untitled.dae</href>
      </Link>
    </Model>
  </Placemark>
</kml>
```


## GET /api/building/:building_id/download/:file_type/:model_type

Accepted file types:
- raw
- zip

Accepted model types:
- dae
- obj