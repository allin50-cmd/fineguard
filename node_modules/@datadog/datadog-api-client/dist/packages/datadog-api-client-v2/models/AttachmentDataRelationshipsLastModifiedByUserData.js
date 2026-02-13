"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentDataRelationshipsLastModifiedByUserData = void 0;
class AttachmentDataRelationshipsLastModifiedByUserData {
    constructor() { }
    /**
     * @ignore
     */
    static getAttributeTypeMap() {
        return AttachmentDataRelationshipsLastModifiedByUserData.attributeTypeMap;
    }
}
exports.AttachmentDataRelationshipsLastModifiedByUserData = AttachmentDataRelationshipsLastModifiedByUserData;
/**
 * @ignore
 */
AttachmentDataRelationshipsLastModifiedByUserData.attributeTypeMap = {
    id: {
        baseName: "id",
        type: "string",
        required: true,
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
//# sourceMappingURL=AttachmentDataRelationshipsLastModifiedByUserData.js.map