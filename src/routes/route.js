import {
  puppeteerService,
} from "../controllers/controller.js";

export const routes = (app) => {
  app
    .route("/api/linkedin")
    .post(puppeteerService);
};
