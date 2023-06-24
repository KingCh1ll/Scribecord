import { Request, Response, Router } from "express";

module.exports = (req: Request, res: Response) => res.status(200).send({ status: 200, message: "DisScribe API online." });
