import { BaseAPIRequestFactory } from "../../datadog-api-client-common/baseapi";
import { Configuration } from "../../datadog-api-client-common/configuration";
import { RequestContext, ResponseContext } from "../../datadog-api-client-common/http/http";
import { GlobalVariableJsonPatchRequest } from "../models/GlobalVariableJsonPatchRequest";
import { GlobalVariableResponse } from "../models/GlobalVariableResponse";
import { OnDemandConcurrencyCapAttributes } from "../models/OnDemandConcurrencyCapAttributes";
import { OnDemandConcurrencyCapResponse } from "../models/OnDemandConcurrencyCapResponse";
export declare class SyntheticsApiRequestFactory extends BaseAPIRequestFactory {
    getOnDemandConcurrencyCap(_options?: Configuration): Promise<RequestContext>;
    patchGlobalVariable(variableId: string, body: GlobalVariableJsonPatchRequest, _options?: Configuration): Promise<RequestContext>;
    setOnDemandConcurrencyCap(body: OnDemandConcurrencyCapAttributes, _options?: Configuration): Promise<RequestContext>;
}
export declare class SyntheticsApiResponseProcessor {
    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getOnDemandConcurrencyCap
     * @throws ApiException if the response code was not in [200, 299]
     */
    getOnDemandConcurrencyCap(response: ResponseContext): Promise<OnDemandConcurrencyCapResponse>;
    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to patchGlobalVariable
     * @throws ApiException if the response code was not in [200, 299]
     */
    patchGlobalVariable(response: ResponseContext): Promise<GlobalVariableResponse>;
    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to setOnDemandConcurrencyCap
     * @throws ApiException if the response code was not in [200, 299]
     */
    setOnDemandConcurrencyCap(response: ResponseContext): Promise<OnDemandConcurrencyCapResponse>;
}
export interface SyntheticsApiPatchGlobalVariableRequest {
    /**
     * The ID of the global variable.
     * @type string
     */
    variableId: string;
    /**
     * JSON Patch document with operations to apply.
     * @type GlobalVariableJsonPatchRequest
     */
    body: GlobalVariableJsonPatchRequest;
}
export interface SyntheticsApiSetOnDemandConcurrencyCapRequest {
    /**
     * .
     * @type OnDemandConcurrencyCapAttributes
     */
    body: OnDemandConcurrencyCapAttributes;
}
export declare class SyntheticsApi {
    private requestFactory;
    private responseProcessor;
    private configuration;
    constructor(configuration: Configuration, requestFactory?: SyntheticsApiRequestFactory, responseProcessor?: SyntheticsApiResponseProcessor);
    /**
     * Get the on-demand concurrency cap.
     * @param param The request object
     */
    getOnDemandConcurrencyCap(options?: Configuration): Promise<OnDemandConcurrencyCapResponse>;
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
    patchGlobalVariable(param: SyntheticsApiPatchGlobalVariableRequest, options?: Configuration): Promise<GlobalVariableResponse>;
    /**
     * Save new value for on-demand concurrency cap.
     * @param param The request object
     */
    setOnDemandConcurrencyCap(param: SyntheticsApiSetOnDemandConcurrencyCapRequest, options?: Configuration): Promise<OnDemandConcurrencyCapResponse>;
}
