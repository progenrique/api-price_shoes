import { Router } from "express";
import {
  getData,
  getAllClientes,
  postClientes,
  getCliente,
  getProductos,
  postPedido,
  postPago,
  updateCliente,
  updateProducto,
  updatePedido,
  updatePago,
} from "../controller/price_controler.js";

export const priceRouter = Router();

priceRouter.get("/", getData);
priceRouter.get("/clientes", getAllClientes);
priceRouter.get("/clientes/:id", getCliente);
priceRouter.get("/productos", getProductos);

priceRouter.post("/clientes", postClientes);
priceRouter.post("/clientes/:id/pedido", postPedido);
priceRouter.post("/clientes/:id/pagos", postPago);

priceRouter.patch("/clientes/:id", updateCliente);
priceRouter.patch("/productos/:id", updateProducto);
priceRouter.patch("/clientes/:id/pedido", updatePedido);
priceRouter.patch("/clientes/:id/pagos/:pago", updatePago);
