import { collection } from "./db.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

async function recallPersonalInfo({ query }) {
  const docs = await collection.find(
    {},
    { $vectorize: query, limit: 10, projection: { $vectorize: 1 } }
  );
  return (await docs.toArray()).map((doc) => doc.$vectorize).join("\n");
}

async function storeImportantInfo({ information, category = "general" }) {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });

    const chunks = await splitter.splitText(information);
    const docs = chunks.map((chunk) => ({
      $vectorize: chunk,
      source: "user_conversation",
      category: category,
      timestamp: new Date().toISOString()
    }));

    await collection.insertMany(docs);
    return `Got it! I've remembered that information for you. I now have ${chunks.length} new pieces of information stored.`;
  } catch (error) {
    console.error("Error storing information:", error);
    return "I had trouble remembering that information. Could you try telling me again?";
  }
}

export const DESCRIPTIONS = [
  {
    type: "function",
    name: "recallPersonalInfo",
    description:
      "Search for personal information, notes, tasks, meetings, or anything the user has previously mentioned",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to search for in the user's personal information",
        },
      },
    },
  },
  {
    type: "function",
    name: "storeImportantInfo",
    description:
      "Store important information the user mentions during conversation (tasks, meetings, ideas, personal notes, work stuff, etc.). Use this when the user says something important they want to remember.",
    parameters: {
      type: "object",
      properties: {
        information: {
          type: "string",
          description: "The important information to store",
        },
        category: {
          type: "string",
          description: "Category of information (work, personal, tasks, meetings, ideas, etc.)",
          enum: ["work", "personal", "tasks", "meetings", "ideas", "notes", "general"]
        },
      },
      required: ["information"]
    },
  },
];

export const TOOLS = {
  recallPersonalInfo,
  storeImportantInfo,
};