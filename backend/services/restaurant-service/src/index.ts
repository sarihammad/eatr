import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`Restaurant service listening on port ${port}`);
});
