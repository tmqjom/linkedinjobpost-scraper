import mongoose from "mongoose";
import { ProductSchema } from "../models/model.js";
import { redisClientPub } from "../../config/redis.js";
import PuppeteerService from "../service/PuppeteerService.js";

export const puppeteerService = async (req, res) => {
  await redisClientPub.publish(`update-mircroservice`,
    JSON.stringify({
      status: "in-progress",
      title: "Microservice1",
    }))
  await PuppeteerService.service(req.body);
};

