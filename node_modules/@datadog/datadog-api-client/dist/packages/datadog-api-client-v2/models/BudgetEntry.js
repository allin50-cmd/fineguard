"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetEntry = void 0;
/**
 * The entry of a budget.
 */
class BudgetEntry {
    constructor() { }
    /**
     * @ignore
     */
    static getAttributeTypeMap() {
        return BudgetEntry.attributeTypeMap;
    }
}
exports.BudgetEntry = BudgetEntry;
/**
 * @ignore
 */
BudgetEntry.attributeTypeMap = {
    amount: {
        baseName: "amount",
        type: "number",
        format: "double",
    },
    month: {
        baseName: "month",
        type: "number",
        format: "int64",
    },
    tagFilters: {
        baseName: "tag_filters",
        type: "Array<TagFilter>",
    },
    additionalProperties: {
        baseName: "additionalProperties",
        type: "{ [key: string]: any; }",
    },
};
//# sourceMappingURL=BudgetEntry.js.map