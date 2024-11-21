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
  deleteAllPagos,
  deletePago,
  getLiquidados,
  postProductos,
  postProductoToPedido,
} from "../controller/price_controler.js";

export const priceRouter = Router();

priceRouter.get("/", getData);
priceRouter.get("/clientes", getAllClientes);
priceRouter.get("/clientes/:id", getCliente);
priceRouter.get("/clientes/:id/liquidados", getLiquidados); // liquidados por cliente
priceRouter.get("/productos", getProductos);

//priceRouter.post("/productos", postProductos); // falta
priceRouter.post("/clientes", postClientes);
priceRouter.post("/productos", postProductos);
priceRouter.post("/clientes/:id/pedido", postPedido);
priceRouter.post("/clientes/:clienteId/:pedidoId", postPago); //agregar pago
priceRouter.post("/pedidos/:clienteId/:pedidoId", postProductoToPedido); //agregar productos a pedidos ya existentes

priceRouter.patch("/clientes/:id", updateCliente);
priceRouter.patch("/productos/:id", updateProducto);
priceRouter.patch("/pedido/:id", updatePedido); // aqui no va el id del pedido porque cada cliente solo puede tener un pedido y se agregan cambian o quitan productos
priceRouter.patch("/pagos/:pago", updatePago); // aqui si va el numero de pago porque un pedido si va a tener diferentes pagos y con eso se cambia agrega y quitan pagos

priceRouter.delete("/pedido/:id", deleteAllPagos); //liquidar
priceRouter.delete("/clientes/:id/:pagoId", deletePago); // verificar si este edponit se utiliza si no eliminarlo
