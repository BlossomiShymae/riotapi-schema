/// OpenAPI spec generator

const hash = require('object-hash');

function toSpec({ endpoints, regions, description }) {
  let paths = {};
  endpoints.forEach(endpoint => {
    endpoint.methods.forEach(method => {
      let path = paths[method.getPathUrl()] || (paths[method.getPathUrl()] = {});
      path[method.httpMethod] = method.getOperation();
      path['x-endpoint'] = endpoint.name;
    });
  });

  let schemas = {
    Error: {
      "type": "object",
      "properties": {
        "status": {
          "type": "object",
          "properties": {
            "status_code": {
              "type": "integer"
            },
            "message": {
              "type": "string"
            }
          }
        }
      }
    }
  };
  // Add all schemas (DTOs) from each endpoint.
  endpoints.forEach(endpoint => Object.assign(schemas, endpoint.exportDtos()));

  let spec = {
    openapi: "3.0.0",
    info: {
      title: "Riot API",
      description,
      termsOfService: "https://developer.riotgames.com/terms-and-conditions.html"
    },
    servers: [
      {
        url: "https://{platform}.api.riotgames.com",
        variables: {
          platform: {
            enum: regions.service.map(r => r.hostPlatform),
            default: "na1"
          }
        }
      }
    ],
    paths,
    components: {
      schemas,
      securitySchemes: {
        'api_key': {
          type: 'apiKey',
          description: 'API key in query param.',
          name: 'api_key',
          in: 'query'
        },
        'X-Riot-Token': {
          type: 'apiKey',
          description: 'API key in header.',
          name: 'X-Riot-Token',
          in: 'header'
        }
      }
    },
    security: [
      { 'api_key': [] },
      { 'X-Riot-Token': [] }
    ]
  };

  const ignored = [ 'info', 'tags' ];
  let versioned = {};
  for (let [ key, value ] of Object.entries(spec)) {
    if (!ignored.includes(key))
      versioned[key] = value;
  }
  spec.info.version = hash(versioned);
  return spec;
};

module.exports = {
  toSpec,
  name: 'openapi-3.0.0'
};
