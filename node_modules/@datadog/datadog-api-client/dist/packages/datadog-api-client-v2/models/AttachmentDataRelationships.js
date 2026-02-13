"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentDataRelationships = void 0;
class AttachmentDataRelationships {
    constructor() { }
    /**
     * @ignore
     */
    static getAttributeTypeMap() {
        return AttachmentDataRelationships.attributeTypeMap;
    }
}
exports.AttachmentDataRelationships = AttachmentDataRelationships;
/**
 * @ignore
 */
AttachmentDataRelationships.attributeTypeMap = {
    lastModifiedByUser: {
        baseName: "last_modified_by_user",
        type: "AttachmentDataRelationshipsLastModifiedByUser",
    },
    additionalProperties: {
        baseName: "additionalProperties",
        type: "{ [key: string]: any; }",
    },
};
//# sourceMappingURL=AttachmentDataRelationships.js.map