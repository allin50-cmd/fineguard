"use strict";
/**
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache-2.0 License.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-Present Datadog, Inc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesetRespDataAttributesRulesItemsMapping = void 0;
/**
 * The definition of `RulesetRespDataAttributesRulesItemsMapping` object.
 */
class RulesetRespDataAttributesRulesItemsMapping {
    constructor() { }
    /**
     * @ignore
     */
    static getAttributeTypeMap() {
        return RulesetRespDataAttributesRulesItemsMapping.attributeTypeMap;
    }
}
exports.RulesetRespDataAttributesRulesItemsMapping = RulesetRespDataAttributesRulesItemsMapping;
/**
 * @ignore
 */
RulesetRespDataAttributesRulesItemsMapping.attributeTypeMap = {
    destinationKey: {
        baseName: "destination_key",
        type: "string",
        required: true,
    },
    ifNotExists: {
        baseName: "if_not_exists",
        type: "boolean",
        required: true,
    },
    sourceKeys: {
        baseName: "source_keys",
        type: "Array<string>",
        required: true,
    },
    additionalProperties: {
        baseName: "additionalProperties",
        type: "{ [key: string]: any; }",
    },
};
//# sourceMappingURL=RulesetRespDataAttributesRulesItemsMapping.js.map