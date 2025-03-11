var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Configuration, OpenAIApi, } from "openai-edge";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { CompletionRequestBody } from "@/lib/types";
// Create an OpenAI API client
const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);
export const runtime = "edge";
// This is the instructions that GPT-4 will use to know how to respond. For more information on
// the difference between a system message and a user message, see:
// https://platform.openai.com/docs/guides/gpt/chat-completions-api
const systemMessage = {
    role: "system",
    content: `You are an expert poet, you will be given a list of bulleted strings and 
you will write a short and concise poem using some of the information in the list. 
Only respond with a poem, don't make the poem too long.`,
};
// This is used to format the message that the user sends to the API. Note we should
// never have the client create the prompt directly as this could mean that the client
// could use your api for any general purpose completion and leak the "secret sauce" of
// your prompt.
function buildUserMessage(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = yield req.json();
        // We use zod to validate the request body. To change the data that is sent to the API,
        // change the CompletionRequestBody type in lib/types.ts
        const { layers } = CompletionRequestBody.parse(body);
        const bulletedList = layers.map((layer) => `* ${layer}`).join("\n");
        return {
            role: "user",
            content: bulletedList,
        };
    });
}
export function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        // Ask OpenAI for a streaming completion given the prompt
        const response = yield openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            stream: true,
            temperature: 0,
            messages: [systemMessage, yield buildUserMessage(req)],
        });
        // Convert the response into a friendly text-stream
        const stream = OpenAIStream(response);
        // Respond with the stream
        const result = new StreamingTextResponse(stream);
        return result;
    });
}
