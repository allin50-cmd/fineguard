import { BaseAPIRequestFactory } from "../../datadog-api-client-common/baseapi";
import { Configuration } from "../../datadog-api-client-common/configuration";
import { RequestContext, ResponseContext } from "../../datadog-api-client-common/http/http";
import { ResolveVulnerableSymbolsRequest } from "../models/ResolveVulnerableSymbolsRequest";
import { ResolveVulnerableSymbolsResponse } from "../models/ResolveVulnerableSymbolsResponse";
import { ScaRequest } from "../models/ScaRequest";
export declare class StaticAnalysisApiRequestFactory extends BaseAPIRequestFactory {
    createSCAResolveVulnerableSymbols(body: ResolveVulnerableSymbolsRequest, _options?: Configuration): Promise<RequestContext>;
    createSCAResult(body: ScaRequest, _options?: Configuration): Promise<RequestContext>;
}
export declare class StaticAnalysisApiResponseProcessor {
    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to createSCAResolveVulnerableSymbols
     * @throws ApiException if the response code was not in [200, 299]
     */
    createSCAResolveVulnerableSymbols(response: ResponseContext): Promise<ResolveVulnerableSymbolsResponse>;
    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to createSCAResult
     * @throws ApiException if the response code was not in [200, 299]
     */
    createSCAResult(response: ResponseContext): Promise<void>;
}
export interface StaticAnalysisApiCreateSCAResolveVulnerableSymbolsRequest {
    /**
     * @type ResolveVulnerableSymbolsRequest
     */
    body: ResolveVulnerableSymbolsRequest;
}
export interface StaticAnalysisApiCreateSCAResultRequest {
    /**
     * @type ScaRequest
     */
    body: ScaRequest;
}
export declare class StaticAnalysisApi {
    private requestFactory;
    private responseProcessor;
    private configuration;
    constructor(configuration: Configuration, requestFactory?: StaticAnalysisApiRequestFactory, responseProcessor?: StaticAnalysisApiResponseProcessor);
    /**
     * @param param The request object
     */
    createSCAResolveVulnerableSymbols(param: StaticAnalysisApiCreateSCAResolveVulnerableSymbolsRequest, options?: Configuration): Promise<ResolveVulnerableSymbolsResponse>;
    /**
     * @param param The request object
     */
    createSCAResult(param: StaticAnalysisApiCreateSCAResultRequest, options?: Configuration): Promise<void>;
}
