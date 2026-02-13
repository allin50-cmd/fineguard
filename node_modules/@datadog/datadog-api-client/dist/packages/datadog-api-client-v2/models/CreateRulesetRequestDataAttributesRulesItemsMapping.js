"use strict";
/**
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache-2.0 License.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-Present Datadog, Inc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRulesetRequestDataAttributesRulesItemsMapping = void 0;
/**
 * The definition of `CreateRulesetRequestDataAttributesRulesItemsMapping` object.
 */
class CreateRulesetRequestDataAttributesRulesItemsMapping {
    constructor() { }
    /**
     * @ignore
     */
    static getAttributeTypeMap() {
        return CreateRulesetRequestDataAttributesRulesItemsMapping.attributeTypeMap;
    }
}
exports.CreateRulesetRequestDataAttributesRulesItemsMapping = CreateRulesetRequestDataAttributesRulesItemsMapping;
/**
 * @ignore
 */
CreateRulesetRequestDataAttributesRulesItemsMapping.attributeTypeMap = {
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
//# sourceMappingURL=CreateRulesetRequestDataAttributesRulesItemsMapping.js.map