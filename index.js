import express from "express";
import { priceRouter } from "./router/price_router.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.disable("x-powered-by");

app.use(express.json());

app.use("/", priceRouter);
//voy a nesecitar mas router de clientes productos y pedidos

app.listen(PORT, () => {
  console.log(`servidor escuchando en http://localhost:${PORT}`);
});
