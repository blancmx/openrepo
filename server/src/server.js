import app from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Quill 后端服务已启动: http://localhost:${PORT}`);
});
