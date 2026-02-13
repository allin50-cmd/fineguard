"use strict";
/**
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache-2.0 License.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-Present Datadog, Inc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagFilter = void 0;
/**
 * Tag filter for the budget's entries.
 */
class TagFilter {
    constructor() { }
    /**
     * @ignore
     */
    static getAttributeTypeMap() {
        return TagFilter.attributeTypeMap;
    }
}
exports.TagFilter = TagFilter;
/**
 * @ignore
 */
TagFilter.attributeTypeMap = {
    tagKey: {
        baseName: "tag_key",
        type: "string",
    },
    tagValue: {
        baseName: "tag_value",
        type: "string",
    },
    additionalProperties: {
        baseName: "additionalProperties",
        type: "{ [key: string]: any; }",
    },
};
//# sourceMappingURL=TagFilter.js.map