"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntheticsApi = exports.SyntheticsApiResponseProcessor = exports.SyntheticsApiRequestFactory = void 0;
const baseapi_1 = require("../../datadog-api-client-common/baseapi");
const configuration_1 = require("../../datadog-api-client-common/configuration");
const http_1 = require("../../datadog-api-client-common/http/http");
const logger_1 = require("../../../logger");
const ObjectSerializer_1 = require("../models/ObjectSerializer");
const exception_1 = require("../../datadog-api-client-common/exception");
class SyntheticsApiRequestFactory extends baseapi_1.BaseAPIRequestFactory {
    getOnDemandConcurrencyCap(_options) {
        return __awaiter(this, void 0, void 0, function* () {
            const _config = _options || this.configuration;
            // Path Params
            const localVarPath = "/api/v2/synthetics/settings/on_demand_concurrency_cap";
            // Make Request Context
            const requestContext = _config
                .getServer("v2.SyntheticsApi.getOnDemandConcurrencyCap")
                .makeRequestContext(localVarPath, http_1.HttpMethod.GET);
            requestContext.setHeaderParam("Accept", "application/json");
            requestContext.setHttpConfig(_config.httpConfig);
            // Apply auth methods
            (0, configuration_1.applySecurityAuthentication)(_config, requestContext, [
                "apiKeyAuth",
                "appKeyAuth",
            ]);
            return requestContext;
        });
    }
    patchGlobalVariable(variableId, body, _options) {
        return __awaiter(this, void 0, void 0, function* () {
            const _config = _options || this.configuration;
            // verify required parameter 'variableId' is not null or undefined
            if (variableId === null || variableId === undefined) {
                throw new baseapi_1.RequiredError("variableId", "patchGlobalVariable");
            }
            // verify required parameter 'body' is not null or undefined
            if (body === null || body === undefined) {
                throw new baseapi_1.RequiredError("body", "patchGlobalVariable");
            }
            // Path Params
            const localVarPath = "/api/v2/synthetics/variables/{variable_id}/jsonpatch".replace("{variable_id}", encodeURIComponent(String(variableId)));
            // Make Request Context
            const requestContext = _config
                .getServer("v2.SyntheticsApi.patchGlobalVariable")
                .makeRequestContext(localVarPath, http_1.HttpMethod.PATCH);
            requestContext.setHeaderParam("Accept", "application/json");
            requestContext.setHttpConfig(_config.httpConfig);
            // Body Params
            const contentType = ObjectSerializer_1.ObjectSerializer.getPreferredMediaType([
                "application/json",
            ]);
            requestContext.setHeaderParam("Content-Type", contentType);
            const serializedBody = ObjectSerializer_1.ObjectSerializer.stringify(ObjectSerializer_1.ObjectSerializer.serialize(body, "GlobalVariableJsonPatchRequest", ""), contentType);
            requestContext.setBody(serializedBody);
            // Apply auth methods
            (0, configuration_1.applySecurityAuthentication)(_config, requestContext, [
                "apiKeyAuth",
                "appKeyAuth",
            ]);
            return requestContext;
        });
    }
    setOnDemandConcurrencyCap(body, _options) {
        return __awaiter(this, void 0, void 0, function* () {
            const _config = _options || this.configuration;
            // verify required parameter 'body' is not null or undefined
            if (body === null || body === undefined) {
                throw new baseapi_1.RequiredError("body", "setOnDemandConcurrencyCap");
            }
            // Path Params
            const localVarPath = "/api/v2/synthetics/settings/on_demand_concurrency_cap";
            // Make Request Context
            const requestContext = _config
                .getServer("v2.SyntheticsApi.setOnDemandConcurrencyCap")
                .makeRequestContext(localVarPath, http_1.HttpMethod.POST);
            requestContext.setHeaderParam("Accept", "application/json");
            requestContext.setHttpConfig(_config.httpConfig);
            // Body Params
            const contentType = ObjectSerializer_1.ObjectSerializer.getPreferredMediaType([
                "application/json",
            ]);
            requestContext.setHeaderParam("Content-Type", contentType);
            const serializedBody = ObjectSerializer_1.ObjectSerializer.stringify(ObjectSerializer_1.ObjectSerializer.serialize(body, "OnDemandConcurrencyCapAttributes", ""), contentType);
            requestContext.setBody(serializedBody);
            // Apply auth methods
            (0, configuration_1.applySecurityAuthentication)(_config, requestContext, [
                "apiKeyAuth",
                "appKeyAuth",
            ]);
            return requestContext;
        });
    }
}
exports.SyntheticsApiRequestFactory = SyntheticsApiRequestFactory;
class SyntheticsApiResponseProcessor {
    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getOnDemandConcurrencyCap
     * @throws ApiException if the response code was not in [200, 299]
     */
    getOnDemandConcurrencyCap(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const contentType = ObjectSerializer_1.ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
            if (response.httpStatusCode === 200) {
                const body = ObjectSerializer_1.ObjectSerializer.deserialize(ObjectSerializer_1.ObjectSerializer.parse(yield response.body.text(), contentType), "OnDemandConcurrencyCapResponse");
                return body;
            }
            if (response.httpStatusCode === 429) {
                const bodyText = ObjectSerializer_1.ObjectSerializer.parse(yield response.body.text(), contentType);
                let body;
                try {
                    body = ObjectSerializer_1.ObjectSerializer.deserialize(bodyText, "APIErrorResponse");
                }
                catch (error) {
                    logger_1.logger.debug(`Got error deserializing error: ${error}`);
                    throw new exception_1.ApiException(response.httpStatusCode, bodyText);
                }
                throw new exception_1.ApiException(response.httpStatusCode, body);
            }
            // Work around for missing responses in specification, e.g. for petstore.yaml
            if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
                const body = ObjectSerializer_1.ObjectSerializer.deserialize(ObjectSerializer_1.ObjectSerializer.parse(yield response.body.text(), contentType), "OnDemandConcurrencyCapResponse", "");
                return body;
            }
            const body = (yield response.body.text()) || "";
            throw new exception_1.ApiException(response.httpStatusCode, 'Unknown API Status Code!\nBody: "' + body + '"');
        });
    }
    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to patchGlobalVariable
     * @throws ApiException if the response code was not in [200, 299]
     */
    patchGlobalVariable(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const contentType = ObjectSerializer_1.ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
            if (response.httpStatusCode === 200) {
                const body = ObjectSerializer_1.ObjectSerializer.deserialize(ObjectSerializer_1.ObjectSerializer.parse(yield response.body.text(), contentType), "GlobalVariableResponse");
                return body;
            }
            if (response.httpStatusCode === 400 ||
                response.httpStatusCode === 404 ||
                response.httpStatusCode === 429) {
                const bodyText = ObjectSerializer_1.ObjectSerializer.parse(yield response.body.text(), contentType);
                let body;
                try {
                    body = ObjectSerializer_1.ObjectSerializer.deserialize(bodyText, "APIErrorResponse");
                }
                catch (error) {
                    logger_1.logger.debug(`Got error deserializing error: ${error}`);
                    throw new exception_1.ApiException(response.httpStatusCode, bodyText);
                }
                throw new exception_1.ApiException(response.httpStatusCode, body);
            }
            // Work around for missing responses in specification, e.g. for petstore.yaml
            if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
                const body = ObjectSerializer_1.ObjectSerializer.deserialize(ObjectSerializer_1.ObjectSerializer.parse(yield response.body.text(), contentType), "GlobalVariableResponse", "");
                return body;
            }
            const body = (yield response.body.text()) || "";
            throw new exception_1.ApiException(response.httpStatusCode, 'Unknown API Status Code!\nBody: "' + body + '"');
        });
    }
    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to setOnDemandConcurrencyCap
     * @throws ApiException if the response code was not in [200, 299]
     */
    setOnDemandConcurrencyCap(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const contentType = ObjectSerializer_1.ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
            if (response.httpStatusCode === 200) {
                const body = ObjectSerializer_1.ObjectSerializer.deserialize(ObjectSerializer_1.ObjectSerializer.parse(yield response.body.text(), contentType), "OnDemandConcurrencyCapResponse");
                return body;
            }
            if (response.httpStatusCode === 429) {
                const bodyText = ObjectSerializer_1.ObjectSerializer.parse(yield response.body.text(), contentType);
                let body;
                try {
                    body = ObjectSerializer_1.ObjectSerializer.deserialize(bodyText, "APIErrorResponse");
                }
                catch (error) {
                    logger_1.logger.debug(`Got error deserializing error: ${error}`);
                    throw new exception_1.ApiException(response.httpStatusCode, bodyText);
                }
                throw new exception_1.ApiException(response.httpStatusCode, body);
            }
            // Work around for missing responses in specification, e.g. for petstore.yaml
            if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
                const body = ObjectSerializer_1.ObjectSerializer.deserialize(ObjectSerializer_1.ObjectSerializer.parse(yield response.body.text(), contentType), "OnDemandConcurrencyCapResponse", "");
                return body;
            }
            const body = (yield response.body.text()) || "";
            throw new exception_1.ApiException(response.httpStatusCode, 'Unknown API Status Code!\nBody: "' + body + '"');
        });
    }
}
exports.SyntheticsApiResponseProcessor = SyntheticsApiResponseProcessor;
class SyntheticsApi {
    constructor(configuration, requestFactory, responseProcessor) {
        this.configuration = configuration;
        this.requestFactory =
            requestFactory || new SyntheticsApiRequestFactory(configuration);
        this.responseProcessor =
            responseProcessor || new SyntheticsApiResponseProcessor();
    }
    /**
     * Get the on-demand concurrency cap.
     * @param param The request object
     */
    getOnDemandConcurrencyCap(options) {
        const requestContextPromise = this.requestFactory.getOnDemandConcurrencyCap(options);
        return requestContextPromise.then((requestContext) => {
            return this.configuration.httpApi
                .send(requestContext)
                .then((responseContext) => {
                return this.responseProcessor.getOnDemandConcurrencyCap(responseContext);
            });
        });
    }
    /**
     * Patch a global variable using JSON Patch (RFC 6902).
     * This endpoint allows partial updates to a global variable by specifying only the fields to modify.
     *
     * Common operations include:
     * - Replace field values: `{"op": "replace", "path": "/name", "value": "new_name"}`
     * - Update nested values: `{"op": "replace", "path": "/value/value", "value": "new_value"}`
     * - Add/update tags: `{"op": "add", "path": "/tags/-", "value": "new_tag"}`
     * - Remove fields: `{"op": "remove", "path": "/description"}`
     * @param param The request object
     */
    patchGlobalVariable(param, options) {
        const requestContextPromise = this.requestFactory.patchGlobalVariable(param.variableId, param.body, options);
        return requestContextPromise.then((requestContext) => {
            return this.configuration.httpApi
                .send(requestContext)
                .then((responseContext) => {
                return this.responseProcessor.patchGlobalVariable(responseContext);
            });
        });
    }
    /**
     * Save new value for on-demand concurrency cap.
     * @param param The request object
     */
    setOnDemandConcurrencyCap(param, options) {
        const requestContextPromise = this.requestFactory.setOnDemandConcurrencyCap(param.body, options);
        return requestContextPromise.then((requestContext) => {
            return this.configuration.httpApi
                .send(requestContext)
                .then((responseContext) => {
                return this.responseProcessor.setOnDemandConcurrencyCap(responseContext);
            });
        });
    }
}
exports.SyntheticsApi = SyntheticsApi;
//# sourceMappingURL=SyntheticsApi.js.map