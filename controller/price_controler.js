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
} from "../schemas/price_eschema.js";

export const getData = async (req, res) => {
  try {
    const result = await modelPrice.getAll();
    if (result.error) throw result;
    const data = result.map((el) => {
      return { ...el, resta: el.total_pedido - el.abonado };
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
    res.status(error.statusCode).send(error);
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

    const resultConsulta = await modelPrice.postPago(data, req.params.id);

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
    const resultUpdate = await modelPrice.updateProducto(
      resultValidacion.data,
      req.params.id
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

export const updatePedido = async (req, res) => {
  try {
    const resultValidacion = validacionUpdatePedido(req.body);
    if (resultValidacion.success === false)
      throw { ...resultValidacion.error.issues[0], statusCode: 405 };
    const resultUpdate = await modelPrice.updatePedido(
      resultValidacion.data,
      req.params.id
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
    const result = await modelPrice.deletePago(req.params.pagoId);
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
