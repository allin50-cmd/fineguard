"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatchAttachmentRequestDataAttributes = void 0;
class PatchAttachmentRequestDataAttributes {
    constructor() { }
    /**
     * @ignore
     */
    static getAttributeTypeMap() {
        return PatchAttachmentRequestDataAttributes.attributeTypeMap;
    }
}
exports.PatchAttachmentRequestDataAttributes = PatchAttachmentRequestDataAttributes;
/**
 * @ignore
 */
PatchAttachmentRequestDataAttributes.attributeTypeMap = {
    attachment: {
        baseName: "attachment",
        type: "PatchAttachmentRequestDataAttributesAttachment",
    },
    additionalProperties: {
        baseName: "additionalProperties",
        type: "{ [key: string]: any; }",
    },
};
//# sourceMappingURL=PatchAttachmentRequestDataAttributes.js.map