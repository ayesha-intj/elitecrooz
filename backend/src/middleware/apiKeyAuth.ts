import { Request, Response, NextFunction } from "express";

const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers["api-key"] as string;

  if (apiKey != process.env.APIK_KEY) {
    res.status(401).json({ message: "Invalid or missing API Key" });
    return;
  }

  next();
};

export default apiKeyAuth;
