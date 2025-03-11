var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { figmaAPI } from "@/lib/figmaAPI";
export function getTextOffset() {
    return __awaiter(this, void 0, void 0, function* () {
        const bounding = yield figmaAPI.run((figma) => {
            const { selection } = figma.currentPage;
            return selection.reduce((acc, node) => {
                const boundingBox = node.absoluteBoundingBox;
                if (!boundingBox) {
                    return acc;
                }
                return {
                    top: Math.min(acc.top, boundingBox.y),
                    right: Math.max(acc.right, boundingBox.x + boundingBox.width),
                };
            }, { top: Infinity, right: -Infinity });
        });
        if (bounding.top === Infinity || bounding.right === -Infinity) {
            return null;
        }
        return {
            x: bounding.right + 48,
            y: bounding.top,
        };
    });
}
