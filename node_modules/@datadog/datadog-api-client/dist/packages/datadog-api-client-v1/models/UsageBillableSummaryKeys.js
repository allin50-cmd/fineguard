"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageBillableSummaryKeys = void 0;
/**
 * Response with aggregated usage types.
 */
class UsageBillableSummaryKeys {
    constructor() { }
    /**
     * @ignore
     */
    static getAttributeTypeMap() {
        return UsageBillableSummaryKeys.attributeTypeMap;
    }
}
exports.UsageBillableSummaryKeys = UsageBillableSummaryKeys;
/**
 * @ignore
 */
UsageBillableSummaryKeys.attributeTypeMap = {
    apmFargateAverage: {
        baseName: "apm_fargate_average",
        type: "UsageBillableSummaryBody",
    },
    apmFargateSum: {
        baseName: "apm_fargate_sum",
        type: "UsageBillableSummaryBody",
    },
    apmHostSum: {
        baseName: "apm_host_sum",
        type: "UsageBillableSummaryBody",
    },
    apmHostTop99P: {
        baseName: "apm_host_top99p",
        type: "UsageBillableSummaryBody",
    },
    apmProfilerHostSum: {
        baseName: "apm_profiler_host_sum",
        type: "UsageBillableSummaryBody",
    },
    apmProfilerHostTop99P: {
        baseName: "apm_profiler_host_top99p",
        type: "UsageBillableSummaryBody",
    },
    apmTraceSearchSum: {
        baseName: "apm_trace_search_sum",
        type: "UsageBillableSummaryBody",
    },
    applicationSecurityFargateAverage: {
        baseName: "application_security_fargate_average",
        type: "UsageBillableSummaryBody",
    },
    applicationSecurityHostSum: {
        baseName: "application_security_host_sum",
        type: "UsageBillableSummaryBody",
    },
    applicationSecurityHostTop99P: {
        baseName: "application_security_host_top99p",
        type: "UsageBillableSummaryBody",
    },
    ciPipelineIndexedSpansSum: {
        baseName: "ci_pipeline_indexed_spans_sum",
        type: "UsageBillableSummaryBody",
    },
    ciPipelineMaximum: {
        baseName: "ci_pipeline_maximum",
        type: "UsageBillableSummaryBody",
    },
    ciPipelineSum: {
        baseName: "ci_pipeline_sum",
        type: "UsageBillableSummaryBody",
    },
    ciTestIndexedSpansSum: {
        baseName: "ci_test_indexed_spans_sum",
        type: "UsageBillableSummaryBody",
    },
    ciTestingMaximum: {
        baseName: "ci_testing_maximum",
        type: "UsageBillableSummaryBody",
    },
    ciTestingSum: {
        baseName: "ci_testing_sum",
        type: "UsageBillableSummaryBody",
    },
    cloudCostManagementAverage: {
        baseName: "cloud_cost_management_average",
        type: "UsageBillableSummaryBody",
    },
    cloudCostManagementSum: {
        baseName: "cloud_cost_management_sum",
        type: "UsageBillableSummaryBody",
    },
    cspmContainerSum: {
        baseName: "cspm_container_sum",
        type: "UsageBillableSummaryBody",
    },
    cspmHostSum: {
        baseName: "cspm_host_sum",
        type: "UsageBillableSummaryBody",
    },
    cspmHostTop99P: {
        baseName: "cspm_host_top99p",
        type: "UsageBillableSummaryBody",
    },
    customEventSum: {
        baseName: "custom_event_sum",
        type: "UsageBillableSummaryBody",
    },
    cwsContainerSum: {
        baseName: "cws_container_sum",
        type: "UsageBillableSummaryBody",
    },
    cwsHostSum: {
        baseName: "cws_host_sum",
        type: "UsageBillableSummaryBody",
    },
    cwsHostTop99P: {
        baseName: "cws_host_top99p",
        type: "UsageBillableSummaryBody",
    },
    dbmHostSum: {
        baseName: "dbm_host_sum",
        type: "UsageBillableSummaryBody",
    },
    dbmHostTop99P: {
        baseName: "dbm_host_top99p",
        type: "UsageBillableSummaryBody",
    },
    dbmNormalizedQueriesAverage: {
        baseName: "dbm_normalized_queries_average",
        type: "UsageBillableSummaryBody",
    },
    dbmNormalizedQueriesSum: {
        baseName: "dbm_normalized_queries_sum",
        type: "UsageBillableSummaryBody",
    },
    fargateContainerApmAndProfilerAverage: {
        baseName: "fargate_container_apm_and_profiler_average",
        type: "UsageBillableSummaryBody",
    },
    fargateContainerApmAndProfilerSum: {
        baseName: "fargate_container_apm_and_profiler_sum",
        type: "UsageBillableSummaryBody",
    },
    fargateContainerAverage: {
        baseName: "fargate_container_average",
        type: "UsageBillableSummaryBody",
    },
    fargateContainerProfilerAverage: {
        baseName: "fargate_container_profiler_average",
        type: "UsageBillableSummaryBody",
    },
    fargateContainerProfilerSum: {
        baseName: "fargate_container_profiler_sum",
        type: "UsageBillableSummaryBody",
    },
    fargateContainerSum: {
        baseName: "fargate_container_sum",
        type: "UsageBillableSummaryBody",
    },
    incidentManagementMaximum: {
        baseName: "incident_management_maximum",
        type: "UsageBillableSummaryBody",
    },
    incidentManagementSum: {
        baseName: "incident_management_sum",
        type: "UsageBillableSummaryBody",
    },
    infraAndApmHostSum: {
        baseName: "infra_and_apm_host_sum",
        type: "UsageBillableSummaryBody",
    },
    infraAndApmHostTop99P: {
        baseName: "infra_and_apm_host_top99p",
        type: "UsageBillableSummaryBody",
    },
    infraContainerSum: {
        baseName: "infra_container_sum",
        type: "UsageBillableSummaryBody",
    },
    infraHostSum: {
        baseName: "infra_host_sum",
        type: "UsageBillableSummaryBody",
    },
    infraHostTop99P: {
        baseName: "infra_host_top99p",
        type: "UsageBillableSummaryBody",
    },
    ingestedSpansSum: {
        baseName: "ingested_spans_sum",
        type: "UsageBillableSummaryBody",
    },
    ingestedTimeseriesAverage: {
        baseName: "ingested_timeseries_average",
        type: "UsageBillableSummaryBody",
    },
    ingestedTimeseriesSum: {
        baseName: "ingested_timeseries_sum",
        type: "UsageBillableSummaryBody",
    },
    iotSum: {
        baseName: "iot_sum",
        type: "UsageBillableSummaryBody",
    },
    iotTop99P: {
        baseName: "iot_top99p",
        type: "UsageBillableSummaryBody",
    },
    lambdaFunctionAverage: {
        baseName: "lambda_function_average",
        type: "UsageBillableSummaryBody",
    },
    lambdaFunctionSum: {
        baseName: "lambda_function_sum",
        type: "UsageBillableSummaryBody",
    },
    logsForwardingSum: {
        baseName: "logs_forwarding_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexed15DaySum: {
        baseName: "logs_indexed_15day_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexed180DaySum: {
        baseName: "logs_indexed_180day_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexed1DaySum: {
        baseName: "logs_indexed_1day_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexed30DaySum: {
        baseName: "logs_indexed_30day_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexed360DaySum: {
        baseName: "logs_indexed_360day_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexed3DaySum: {
        baseName: "logs_indexed_3day_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexed45DaySum: {
        baseName: "logs_indexed_45day_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexed60DaySum: {
        baseName: "logs_indexed_60day_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexed7DaySum: {
        baseName: "logs_indexed_7day_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexed90DaySum: {
        baseName: "logs_indexed_90day_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexedCustomRetentionSum: {
        baseName: "logs_indexed_custom_retention_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIndexedSum: {
        baseName: "logs_indexed_sum",
        type: "UsageBillableSummaryBody",
    },
    logsIngestedSum: {
        baseName: "logs_ingested_sum",
        type: "UsageBillableSummaryBody",
    },
    networkDeviceSum: {
        baseName: "network_device_sum",
        type: "UsageBillableSummaryBody",
    },
    networkDeviceTop99P: {
        baseName: "network_device_top99p",
        type: "UsageBillableSummaryBody",
    },
    npmFlowSum: {
        baseName: "npm_flow_sum",
        type: "UsageBillableSummaryBody",
    },
    npmHostSum: {
        baseName: "npm_host_sum",
        type: "UsageBillableSummaryBody",
    },
    npmHostTop99P: {
        baseName: "npm_host_top99p",
        type: "UsageBillableSummaryBody",
    },
    observabilityPipelineSum: {
        baseName: "observability_pipeline_sum",
        type: "UsageBillableSummaryBody",
    },
    onlineArchiveSum: {
        baseName: "online_archive_sum",
        type: "UsageBillableSummaryBody",
    },
    profContainerSum: {
        baseName: "prof_container_sum",
        type: "UsageBillableSummaryBody",
    },
    profHostSum: {
        baseName: "prof_host_sum",
        type: "UsageBillableSummaryBody",
    },
    profHostTop99P: {
        baseName: "prof_host_top99p",
        type: "UsageBillableSummaryBody",
    },
    rumLiteSum: {
        baseName: "rum_lite_sum",
        type: "UsageBillableSummaryBody",
    },
    rumReplaySum: {
        baseName: "rum_replay_sum",
        type: "UsageBillableSummaryBody",
    },
    rumSum: {
        baseName: "rum_sum",
        type: "UsageBillableSummaryBody",
    },
    rumUnitsSum: {
        baseName: "rum_units_sum",
        type: "UsageBillableSummaryBody",
    },
    sensitiveDataScannerSum: {
        baseName: "sensitive_data_scanner_sum",
        type: "UsageBillableSummaryBody",
    },
    serverlessApmSum: {
        baseName: "serverless_apm_sum",
        type: "UsageBillableSummaryBody",
    },
    serverlessInfraAverage: {
        baseName: "serverless_infra_average",
        type: "UsageBillableSummaryBody",
    },
    serverlessInfraSum: {
        baseName: "serverless_infra_sum",
        type: "UsageBillableSummaryBody",
    },
    serverlessInvocationSum: {
        baseName: "serverless_invocation_sum",
        type: "UsageBillableSummaryBody",
    },
    siemSum: {
        baseName: "siem_sum",
        type: "UsageBillableSummaryBody",
    },
    standardTimeseriesAverage: {
        baseName: "standard_timeseries_average",
        type: "UsageBillableSummaryBody",
    },
    syntheticsApiTestsSum: {
        baseName: "synthetics_api_tests_sum",
        type: "UsageBillableSummaryBody",
    },
    syntheticsAppTestingMaximum: {
        baseName: "synthetics_app_testing_maximum",
        type: "UsageBillableSummaryBody",
    },
    syntheticsBrowserChecksSum: {
        baseName: "synthetics_browser_checks_sum",
        type: "UsageBillableSummaryBody",
    },
    timeseriesAverage: {
        baseName: "timeseries_average",
        type: "UsageBillableSummaryBody",
    },
    timeseriesSum: {
        baseName: "timeseries_sum",
        type: "UsageBillableSummaryBody",
    },
    additionalProperties: {
        baseName: "additionalProperties",
        type: "{ [key: string]: any; }",
    },
};
//# sourceMappingURL=UsageBillableSummaryKeys.js.map