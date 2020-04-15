import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { filterImageFromURL, deleteLocalFiles } from "./util/util";

export default class Server {
  static validateQueryParams(req: Request, res: Response, next: NextFunction) {
    const { image_url } = req.query;
    if (!image_url) {
      return res
        .status(400)
        .send({ error: "The image_url query param is missing" });
    }

    let url: URL;
    try {
      url = new URL(image_url);
    } catch {
      return res.status(400).send({ error: "Invalid URL" });
    }

    return next();
  }

  static async main(args: string[]): Promise<void> {
    // Init the Express application
    const app = express();

    // Set the network port
    const port = process.env.PORT || 8082;

    // Use the body parser middleware for post requests
    app.use(bodyParser.json());

    /**
     * GET /filteredimage?image_url={{URL}}
     * Endpoint to filter an image from a public url.
     * IT SHOULD
     *    1. validate the image_url query
     *    2. call filterImageFromURL(image_url) to filter the image
     *    3. send the resulting file in the response
     *    4. deletes any files on the server on finish of the response
     * QUERY PARAMATERS
     *    image_url: URL of a publicly accessible image
     * RETURNS
     *   the filtered image file
     */
    app.get("/filteredimage", Server.validateQueryParams, async (req, res) => {
      const { image_url } = req.query;

      let filteredPath: string;
      try {
        filteredPath = await filterImageFromURL(image_url);
      } catch (error) {
        return res.status(500).send({error: error.message});
      }

      res.sendFile(filteredPath, async (error) => {
        if (error) return res.status(500).send({ error: error.message });
        await deleteLocalFiles([filteredPath]);
      });
    });

    // Root Endpoint
    // Displays a simple message to the user
    app.get("/", async (req, res) => {
      res.send("try GET /filteredimage?image_url={{}}");
    });

    // Start the Server
    app.listen(port, () => {
      console.log(`server running http://localhost:${port}`);
      console.log(`press CTRL+C to stop server`);
    });
  }
}

Server.main(process.argv);
