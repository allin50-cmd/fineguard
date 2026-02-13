import { BaseAPIRequestFactory } from "../../datadog-api-client-common/baseapi";
import { Configuration } from "../../datadog-api-client-common/configuration";
import { RequestContext, ResponseContext } from "../../datadog-api-client-common/http/http";
import { FlakyTest } from "../models/FlakyTest";
import { FlakyTestsSearchRequest } from "../models/FlakyTestsSearchRequest";
import { FlakyTestsSearchResponse } from "../models/FlakyTestsSearchResponse";
export declare class TestOptimizationApiRequestFactory extends BaseAPIRequestFactory {
    searchFlakyTests(body?: FlakyTestsSearchRequest, _options?: Configuration): Promise<RequestContext>;
}
export declare class TestOptimizationApiResponseProcessor {
    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to searchFlakyTests
     * @throws ApiException if the response code was not in [200, 299]
     */
    searchFlakyTests(response: ResponseContext): Promise<FlakyTestsSearchResponse>;
}
export interface TestOptimizationApiSearchFlakyTestsRequest {
    /**
     * @type FlakyTestsSearchRequest
     */
    body?: FlakyTestsSearchRequest;
}
export declare class TestOptimizationApi {
    private requestFactory;
    private responseProcessor;
    private configuration;
    constructor(configuration: Configuration, requestFactory?: TestOptimizationApiRequestFactory, responseProcessor?: TestOptimizationApiResponseProcessor);
    /**
     * List endpoint returning flaky tests from Flaky Test Management. Results are paginated.
     * @param param The request object
     */
    searchFlakyTests(param?: TestOptimizationApiSearchFlakyTestsRequest, options?: Configuration): Promise<FlakyTestsSearchResponse>;
    /**
     * Provide a paginated version of searchFlakyTests returning a generator with all the items.
     */
    searchFlakyTestsWithPagination(param?: TestOptimizationApiSearchFlakyTestsRequest, options?: Configuration): AsyncGenerator<FlakyTest>;
}
