"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User140420082644000 = void 0;
class User140420082644000 {
    constructor() { }
    /**
     * @ignore
     */
    static getAttributeTypeMap() {
        return User140420082644000.attributeTypeMap;
    }
}
exports.User140420082644000 = User140420082644000;
/**
 * @ignore
 */
User140420082644000.attributeTypeMap = {
    attributes: {
        baseName: "attributes",
        type: "UserAttributes",
    },
    id: {
        baseName: "id",
        type: "string",
    },
    type: {
        baseName: "type",
        type: "UserType",
        required: true,
    },
    additionalProperties: {
        baseName: "additionalProperties",
        type: "{ [key: string]: any; }",
    },
};
//# sourceMappingURL=User140420082644000.js.map