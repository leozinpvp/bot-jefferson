import { MongoClient, ObjectId } from "mongodb";
import mongoose from "mongoose";
import { MongoStore } from "wwebjs-mongo";

const URI = process.env.MONGO_URI;

await mongoose.connect(URI);

export const store = new MongoStore({ mongoose })

export const mongo = new MongoClient(URI).db();

export function getCol(name) {
    return mongo.collection(name);
}

export function toObjectId(id) {
    return ObjectId.isValid(id) ? new ObjectId(id) : undefined
}

export function isLink(text) {
    return text.startsWith("https://") || text.startsWith("http://")
}
