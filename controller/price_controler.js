import crypto from "crypto";
import { modelPrice } from "../model/price_model.js";
import {
  validacionCliente,
  validacionPedido,
  validacionPago,
  validacionUpdateCliente,
  validacionUpdateProducto,
  validacionUpdatePedido,
  validacionUpdatePago,
  validacionProducto,
} from "../schemas/price_eschema.js";
import { object } from "zod";

export const getData = async (req, res) => {
  try {
    const result = await modelPrice.getAll();
    if (result.error) throw result;

    const data = result.map((cliente) => {
      return {
        cliente_id: cliente.cliente_id,
        name: cliente.name,
        pedidos: cliente.pedidos.map((pedido) => {
          let totalPrecio_lista = pedido.productos
            .map((producto) => producto.precio_lista * producto.cantidad)
            .reduce((acc, precio) => (acc += precio));
          let totalPrecio_cliente = pedido.productos
            .map((producto) => producto.precio_cliente * producto.cantidad)
            .reduce((acc, precio) => (acc += precio));
          let totalPagos =
            pedido.pagos === null
              ? 0
              : pedido.pagos.reduce((acc, pago) => (acc += pago));
          return {
            ...pedido,

            ganancia: totalPrecio_cliente - totalPrecio_lista,
            restante: totalPrecio_cliente - totalPagos,
            total: {
              precio_lista: totalPrecio_lista,
              precio_cliente: totalPrecio_cliente,
              abonado: totalPagos,
            },
          };
        }),
      };
    });

    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(error.statusCode).send(error);
  }
};

export const getAllClientes = async (req, res) => {
  try {
    const result = await modelPrice.getClientes();

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(error.statusCode).send(error);
  }
};

export const getCliente = async (req, res) => {
  try {
    const result = await modelPrice.getCliente(req.params.id);
    if (result.error) throw result;

    const data = result.map((cliente) => {
      return {
        cliente_id: cliente.id,
        name: cliente.name,
        pedidos: cliente.pedidos.map((pedido) => {
          let totalPrecio_lista = pedido.productos
            .map((producto) => producto.precio_lista * producto.cantidad)
            .reduce((acc, precio) => (acc += precio));
          let totalPrecio_cliente = pedido.productos
            .map((producto) => producto.precio_cliente * producto.cantidad)
            .reduce((acc, precio) => (acc += precio));
          let totalPagos =
            pedido.pagos === null
              ? 0
              : pedido.pagos
                  .map((pago) => {
                    return pago.pago;
                  })
                  .reduce((acc, pago) => (acc += pago));

          return {
            ...pedido,

            ganancia: totalPrecio_cliente - totalPrecio_lista,
            restante: totalPrecio_cliente - totalPagos,
            total: {
              precio_lista: totalPrecio_lista,
              precio_cliente: totalPrecio_cliente,
              abonado: totalPagos,
            },
          };
        }),
      };
    });

    res.send(data);
  } catch (error) {
    if (error.hasOwnProperty("statusCode")) {
      console.log(error);
      res.status(error.statusCode).send(error);
    } else {
      console.log(error);
    }
  }
};

export const getProductos = async (req, res) => {
  try {
    const result = await modelPrice.getProductos();
    if (result.error) throw result;
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(error.statusCode).send(error);
  }
};

export const postClientes = async (req, res) => {
  try {
    const validacion = validacionCliente(req.body);
    if (validacion.success === false)
      throw { statusCode: 400, validationError: validacion.error.issues[0] };
    const data = { id: crypto.randomUUID(), name: validacion.data.name };
    const result = await modelPrice.postClientes(data);
    if (result.error) throw result;
    res.send(result);
  } catch (error) {
    if (error.hasOwnProperty("statusCode")) {
      res.status(error.statusCode).send(error);
    } else {
      res.send(error);
    }
  }
};

export const postProductos = async (req, res) => {
  try {
    const resultValidacion = validacionProducto(req.body);

    if (resultValidacion.success === false) {
      const error = resultValidacion.error.issues.map((el) => {
        return { ...el, statusCode: 405 };
      });
      throw error[0];
    }

    const data = {
      ...resultValidacion.data,
      id: Math.floor(Math.random() * 1000000) + 1,
    };
    const result = await modelPrice.postProductos(data);

    if (result.error) throw result;
    res.send(result);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).send(error);
    } else res.send(error);
  }
};

export const postPedido = async (req, res) => {
  try {
    const resultValidacion = validacionPedido(req.body);

    if (resultValidacion.success === false) {
      const error = resultValidacion.error.issues.map((el) => {
        return { ...el, statusCode: 405 };
      });
      throw error[0];
    }

    const data = {
      ...resultValidacion.data,
      pedidoId: Math.floor(Math.random() * 1000000) + 1,
      productoId: Math.floor(Math.random() * 1000000) + 1,
    };
    const result = await modelPrice.postPedido(data, req.params.id);

    if (result.error) throw result;
    res.send(result);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).send(error);
    } else res.send(error);
  }
};

export const postProductoToPedido = async (req, res) => {
  try {
    const resultValidacion = validacionProducto(req.body);

    if (resultValidacion.success === false) {
      const error = resultValidacion.error.issues.map((el) => {
        return { ...el, statusCode: 405 };
      });
      throw error[0];
    }

    const params = {
      cliente_id: req.params.clienteId,
      pedido_id: req.params.pedidoId,
    };

    const data = {
      ...resultValidacion.data,
      id: Math.floor(Math.random() * 1000000) + 1,
    };
    const result = await modelPrice.postProductoToPedido(data, params);

    if (result.error) throw result;
    res.send(result);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).send(error);
    } else res.send(error);
  }
};

export const postPago = async (req, res) => {
  try {
    const resultValidacion = validacionPago(req.body);

    if (resultValidacion.success === false)
      throw {
        statusCode: 400,
        validationError: resultValidacion.error.issues[0],
      };

    const data = {
      ...resultValidacion.data,
      id: Math.floor(Math.random() * 1000000) + 1,
    };
    const params = {
      clienteId: req.params.clienteId,
      pedidoId: req.params.pedidoId,
    };
    const resultConsulta = await modelPrice.postPago(data, params);

    if (resultConsulta.error) throw resultConsulta;

    res.send(resultConsulta);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).send(error);
    } else {
      console.log(error);
    }
  }
};

export const updateCliente = async (req, res) => {
  try {
    const resultValidacion = validacionUpdateCliente(req.body);

    if (resultValidacion.success === false)
      throw { ...resultValidacion.error.issues[0], statusCode: 405 };

    const resultUpdate = await modelPrice.updateCliente(
      resultValidacion.data,
      req.params.id
    );

    if (resultUpdate.error) throw resultUpdate;

    res.send(resultUpdate);
  } catch (error) {
    console.log(error);
    if (error.hasOwnProperty("statusCode")) {
      res.status(error.statusCode).send(error);
    } else {
      console.log(error);
    }
  }
};

export const updateProducto = async (req, res) => {
  try {
    const resultValidacion = validacionUpdateProducto(req.body);
    if (resultValidacion.success === false)
      throw { ...resultValidacion.error.issues[0], statusCode: 405 };
    //verificar que la validacion no venga vacia
    if (Object.keys(resultValidacion.data).length === 0) {
      res.status(400).send("no se enviaron datos o son invalidos");
    } else {
      const resultUpdate = await modelPrice.updateProducto(
        resultValidacion.data,
        req.params.id
      );
      if (resultUpdate.error) {
        throw resultUpdate;
      } else {
        res.send(resultUpdate);
      }
    }
  } catch (error) {
    if (error.hasOwnProperty("statusCode")) {
      console.log(error);
      res.status(error.statusCode).send(error);
    } else {
      console.log(error);
    }
  }
};

export const updatePedido = async (req, res) => {
  try {
    // validacion de los datos
    const resultValidacion = validacionUpdatePedido(req.body);
    if (resultValidacion.success === false)
      throw { ...resultValidacion.error.issues[0], statusCode: 405 };

    //separar los datos porque son 2 tablas las que se deben modificar para los pedidos
    // pedidos y pedidos_productos

    let dataPedidos = {};
    let dataPedidosProductos = {};
    for (const key in resultValidacion.data) {
      if (key === "talla" || key === "cantidad") {
        dataPedidosProductos = {
          ...dataPedidosProductos,
          [key]: resultValidacion.data[key],
        };
      } else {
        dataPedidos = { ...dataPedidos, [key]: resultValidacion.data[key] };
      }
    }

    const resultUpdate = await modelPrice.updatePedido(
      dataPedidos,
      dataPedidosProductos,
      req.params.id
    );

    res.send(resultUpdate);
  } catch (error) {
    if (error.hasOwnProperty("statusCode")) {
      console.log(error);
      res.status(error.statusCode).send(error);
    } else {
      console.log(error);
    }
  }
};

export const updatePago = async (req, res) => {
  try {
    const resultValidacion = validacionUpdatePago(req.body);
    if (resultValidacion.success === false)
      throw { ...resultValidacion.error.issues[0], statusCode: 405 };
    const resultUpdate = await modelPrice.updatePago(
      resultValidacion.data,
      req.params.pago
    );

    if (resultUpdate.error) {
      throw resultUpdate;
    } else {
      res.send(resultUpdate);
    }
  } catch (error) {
    if (error.hasOwnProperty("statusCode")) {
      console.log(error);
      res.status(error.statusCode).send(error);
    } else {
      console.log(error);
    }
  }
};

export const deleteAllPagos = async (req, res) => {
  try {
    const result = await modelPrice.deleteAllPagos(req.params.id);
    if (result.error) throw result;
    res.send(result);
  } catch (error) {
    if (error.hasOwnProperty("statusCode")) {
      console.log(error);
      res.status(error.statusCode).send(error);
    } else {
      console.log(error);
    }
  }
};

export const deletePago = async (req, res) => {
  try {
    const params = { clienteId: req.params.id, pagoId: req.params.pagoId };
    const result = await modelPrice.deletePago(params);
    if (result.error) throw result;
    res.send(result);
  } catch (error) {
    if (error.hasOwnProperty("statusCode")) {
      console.log(error);
      res.status(error.statusCode).send(error);
    } else {
      console.log(error);
    }
  }
};

export const getLiquidados = async (req, res) => {
  try {
    const result = await modelPrice.getLiquidados(req.params.id);
    if (result.error) throw result;
    const data = result.map((cliente) => {
      return {
        cliente_id: cliente.id,
        name: cliente.name,
        pedidos_liquidados: cliente.pedidos_liquidados.map((pedido) => {
          let totalPrecio_lista = pedido.productos
            .map((producto) => producto.precio_lista * producto.cantidad)
            .reduce((acc, precio) => (acc += precio));
          let totalPrecio_cliente = pedido.productos
            .map((producto) => producto.precio_cliente * producto.cantidad)
            .reduce((acc, precio) => (acc += precio));
          let totalPagos =
            pedido.pagos === null
              ? 0
              : pedido.pagos
                  .map((pago) => {
                    return pago.pago;
                  })
                  .reduce((acc, pago) => (acc += pago));
          return {
            ...pedido,
            ganancia: totalPrecio_cliente - totalPrecio_lista,
            restante: totalPrecio_cliente - totalPagos,
            total: {
              precio_lista: totalPrecio_lista,
              precio_cliente: totalPrecio_cliente,
              abonado: totalPagos,
            },
          };
        }),
      };
    });

    res.send(data);
  } catch (error) {
    if (error.hasOwnProperty("statusCode")) {
      console.log(error);
      res.status(error.statusCode).send(error);
    } else {
      console.log(error);
    }
  }
};
