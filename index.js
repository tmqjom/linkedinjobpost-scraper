import express from "express";
import { routes } from "./src/routes/route.js";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import 'dotenv/config'
import { redisClientPub, redisClientSub } from "./config/redis.js";

mongoose.set('strictQuery', true);
const app = express();
const PORT = "4000";

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log("Database connected");
    await redisClientPub.publish("update-mircroservice",
        JSON.stringify({
            status: "available",
            title: "Microservice1",
            purpose: "linkedin",
            uri: "https://9dda-180-191-236-208.ngrok.io/api/linkedin",
        }));
}).catch((err) => {
    console.log("Error connecting to database", err);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));

routes(app);

app.listen(PORT, () => {
    (`Server is running on http://localhost:${PORT}`);
});
