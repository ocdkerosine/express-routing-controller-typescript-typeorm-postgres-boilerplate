import { OpenAPI } from 'routing-controllers-openapi';
import _ from 'lodash';
import { OperationObject, ResponsesObject, SchemaObject } from 'openapi3-ts';

export function ResponseSchema(
  responseClass: Function | string, // tslint:disable-line
  options: {
    description?: string;
    isArray?: boolean;
    isPaginated?: boolean;
  } = {},
) {
  const setResponseSchema = (source: OperationObject): OperationObject => {
    const description = options.description || '';
    const isPaginated = options.isPaginated || false;
    let isArray = options.isArray || false;

    let responseSchemaName = '';
    if (typeof responseClass === 'function' && responseClass.name) {
      responseSchemaName = responseClass.name;
    } else if (typeof responseClass === 'string') {
      responseSchemaName = responseClass;
    }

    if (responseSchemaName) {
      let schema: SchemaObject;
      let additionalProperties: any = {};

      if (isPaginated) {
        isArray = true;

        additionalProperties = {
          meta: {
            type: 'object',
            properties: {
              perPage: {
                type: 'integer',
              },
              currentPage: {
                type: 'integer',
              },
              totalPages: { type: 'integer' },
              count: { type: 'integer' },
              total: { type: 'integer' },
            },
          },
        };
      }

      if (isArray) {
        schema = {
          type: 'array',
          items: {
            $ref: `#/components/schemas/${responseSchemaName}`,
          },
        };
      } else if (responseSchemaName === 'Object') {
        schema = { type: 'object' };
      } else {
        schema = {
          type: 'object',
          $ref: `#/components/schemas/${responseSchemaName}`,
        };
      }

      const responses: ResponsesObject = {
        200: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: schema,
                  message: {
                    type: 'string',
                  },
                  ...additionalProperties,
                },
              },
            },
          },
          description,
        },
        400: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                        },
                        property: {
                          type: 'string',
                        },
                      },
                    },
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
          description,
        },
      };
      return _.merge({}, source, { responses });
    }

    return _.merge({}, source);
  };

  return OpenAPI(setResponseSchema);
}
