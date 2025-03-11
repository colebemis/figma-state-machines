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
export function getTextForSelection() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield figmaAPI.run((figma) => {
            const { selection } = figma.currentPage;
            const getTextForNode = (node) => {
                if (node.type === "TEXT") {
                    return node.characters;
                }
                else if (node.type === "STICKY" || node.type === "SHAPE_WITH_TEXT") {
                    return node.text.characters;
                }
                return null;
            };
            const layers = [];
            for (const node of selection) {
                if ("findAllWithCriteria" in node) {
                    const childText = node
                        .findAllWithCriteria({
                        types: ["TEXT", "STICKY", "SHAPE_WITH_TEXT"],
                    })
                        .map(getTextForNode)
                        .filter((t) => t !== null);
                    layers.push(...childText);
                }
                const text = getTextForNode(node);
                if (text !== null) {
                    layers.push(text);
                }
            }
            return layers;
        });
    });
}
