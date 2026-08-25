import express from "express";
import cors from "cors";
import articlesRouter from "./routes/articles.js";
import authRouter from "./routes/auth.js";
import projectsRouter from "./routes/projects.js";
import newsRouter from "./routes/news.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/news", newsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "接口不存在" });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "请求体不是合法的 JSON" });
  }
  console.error(err);
  res.status(500).json({ error: "服务器内部错误" });
});

export default app;
