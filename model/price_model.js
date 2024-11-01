import msql from "mysql2/promise";

const config = {
  host: "bhqy07iwlv4e0xz2duhs-mysql.services.clever-cloud.com",
  user: "ukybdit7n9q10mwb",
  port: 3306,
  password: "DYe8yJWARTAQ7bZFB0jW",
  database: "bhqy07iwlv4e0xz2duhs",
};

const pool = msql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10, // Número máximo de conexiones
  queueLimit: 0,
});

//const connection = await msql.createConnection(config);

const connection = await pool.getConnection(); // Obtener la conexión

const validarExistenciaClienteId = async (id) => {
  const [resultId] = await connection.query(
    `select * from clientes where id = UUID_TO_BIN(?)`,
    [id]
  );

  if (resultId.length === 0) {
    return {
      error: true,
      message: "Error: cliente no enconrado",
      statusCode: 404,
    };
  } else {
    return { success: true };
  }
};

export const modelPrice = {
  getAll: async () => {
    const consulta = `select 
BIN_TO_UUID(clientes.id) as id, 
clientes.name,
pedidos.id as pedido,
DATE_FORMAT(pedidos.fecha_entrega, '%Y-%m-%d') AS fecha_entrega,
(select sum(pagos.pago) from pagos where pagos.pedido_id = pedidos.id) as abonado,
 (select sum(productos.precio_cliente) from productos
 where  pedidos.cliente_id=clientes.id) as total_pedido,
 pedidos.numero_pagos
from clientes
join pedidos on clientes.id =pedidos.cliente_id
group by clientes.id;`;
    try {
      const [data] = await connection.query(consulta);
      return data;
    } catch (error) {
      console.log(error);
      const err = {
        error: true,
        code: error.code,
        statusCode: 422,
        mesage: error.sqlMessage,
      };
      return err;
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
  getClientes: async () => {
    try {
      const consulta = `select clientes.name, BIN_TO_UUID(clientes.id) AS id from clientes`;
      const [data] = await connection.query(consulta);
      return data;
    } catch (error) {
      const err = {
        error: true,
        code: error.code,
        statusCode: 422,
        mesage: error.sqlMessage,
      };
      return err;
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
  getCliente: async (id) => {
    try {
      const resultCliente = await validarExistenciaClienteId(id);
      if (resultCliente.error) return resultCliente;
      const consultaData = `select
  BIN_TO_UUID(clientes.id) as id, clientes.name,
  pedidos.id as numero_pedido, 
  numero_pagos,
  DATE_FORMAT(fecha_inicio, '%Y-%m-%d') as fecha_inicio,
  DATE_FORMAT(fecha_entrega, '%Y-%m-%d') as fecha_entrega,
  (select 
  json_arrayagg(
  JSON_OBJECT(
  "cantidad",cantidad,
  "producto_id",producto_id,
  "precio_cliente", precio_cliente,
  "precio_lista",precio_lista,
  "marca",marca,
  "piso",piso,
  "pasillo",pasillo,
  "color",color)
  ) from pedidos_productos
  join productos on pedidos_productos.producto_id = productos.id_price
   where pedidos_productos.pedido_id=numero_pedido) as detalle_pedido ,
   (select json_arrayagg(
   JSON_OBJECT(
   "id",pagos.id,
   "fecha_abono",DATE_FORMAT(fecha_abono, '%Y-%m-%d'),
   "pago",pago
   ))
   from pagos where pagos.pedido_id=pedidos.id)as detalle_pagos
   from clientes
   left JOIN pedidos on clientes.id =pedidos.cliente_id 
   where clientes.id = UUID_TO_BIN(?)`;
      const [result] = await connection.query(consultaData, [id]);
      return result;
    } catch (error) {
      if (error.hasOwnProperty("code")) {
        console.log(error);
        return { error: true, code: error.code, statusCode: 400 };
      } else {
        return error;
      }
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
  getProductos: async () => {
    try {
      const consulta = `SELECT * FROM productos;`;
      const [result] = await connection.query(consulta);
      return result;
    } catch (error) {
      console.error(error);
      const err = {
        error: true,
        code: error.code,
        statusCode: 422,
        mesage: error.sqlMessage,
      };
      return err;
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
  postClientes: async (data) => {
    try {
      const datosAEnviar = [data.id, data.name];
      const consulta = `INSERT INTO clientes (id,name) VALUES (UUID_TO_BIN(?),?);`;
      const [result] = await connection.query(consulta, datosAEnviar);
      console.log(result);
    } catch (error) {
      console.error(error);
      console.error(error);
      if (error.hasOwnProperty("code")) {
        return {
          error: true,
          code: error.code,
          statusCode: 400,
          mesage: error.sqlMessage,
        };
      } else {
        return error;
      }
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
  postPedido: async (data, id) => {
    const {
      id_price,
      precio_cliente,
      precio_lista,
      marca,
      piso,
      pasillo,
      color,
      tipo,
      cantidad,
      numero_pagos,
      talla,
      fecha_inicio,
      fecha_entrega,
      pedidoId,
    } = data;
    const resultCliente = await validarExistenciaClienteId(id);
    if (resultCliente.error) return resultCliente;

    try {
      await connection.beginTransaction(); // Iniciar la transacción
      let reultsConsultas = {};

      // verificar si id_price existe en la BD
      const consultaExistenciaProducto = `select * from productos where id_price=?`;
      const [resultExistenciaProducto] = await connection.query(
        consultaExistenciaProducto,
        [id_price]
      );

      // si no existe se agrega el producto
      if (resultExistenciaProducto.length === 0) {
        const datos = {
          marca,
          piso,
          pasillo,
          color,
          tipo,
        };
        let consultaParametros = ``;
        let consultaValores = ``;
        const parametros = [id_price, precio_cliente, precio_lista];
        for (const key in datos) {
          if (datos[key] !== undefined) {
            consultaParametros += `, ${key}`;
            consultaValores += `, ?`;
            parametros.push(datos[key]);
          }
        }
        const consultaIncertarProducto = `INSERT INTO productos(id_price, precio_cliente, precio_lista ${consultaParametros}) VALUES (?, ?, ?${consultaValores})`;

        await connection.query(consultaIncertarProducto, parametros);

        reultsConsultas = {
          ...reultsConsultas,
          producto: "el producto se agrego correctamente",
        };
      } else {
        reultsConsultas = {
          ...reultsConsultas,
          producto: true,
          productoMessage: "producto ya existe",
        };
      }

      //revisar si el cliente_id tiene asociado un pedido

      const [resultExistenciaPedido] = await connection.query(
        `select * from pedidos where cliente_id= UUID_TO_BIN(?);`,
        id
      );
      //si no existe el pedido hay que agregarlo

      if (resultExistenciaPedido.length === 0) {
        const datos = {
          talla,
          id_price,
          fecha_inicio,
          fecha_entrega,
          cliente_id: id,
        }; //*******aleatorio

        let consultaParametros = ``;
        let consultaValores = ``;
        const parametros = [pedidoId, numero_pagos];

        // este for in arma el string dinamicamente  para la consulta

        for (const key in datos) {
          if (datos[key] !== undefined) {
            if (key === "cliente_id") {
              consultaParametros += `, ${key}`;
              consultaValores += `, UUID_TO_BIN(?)`;
              parametros.push(datos[key]);
            } else {
              consultaParametros += `, ${key}`;
              consultaValores += `, ?`;
              parametros.push(datos[key]);
            }
          }
        }

        const consultaIncertarProducto = `INSERT INTO pedidos(id,numero_pagos${consultaParametros}) VALUES (?,?${consultaValores})`;

        connection.query(consultaIncertarProducto, parametros);

        //******************** crear la relacon de pedidos con productos *******************

        await connection.query(
          `INSERT INTO pedidos_productos (pedido_id,producto_id,cantidad) VALUES (?,?,?)`,
          [pedidoId, id_price, cantidad]
        );

        reultsConsultas = {
          ...reultsConsultas,
          pedido: "pedido agregado correctamente",
        };
      } else {
        reultsConsultas = {
          ...reultsConsultas,
          pedidoMessage: "ya hay un pedido asociado a este cliente",
          pedido: true,
        };
      }

      return reultsConsultas;
    } catch (error) {
      // Si ocurre un error, revertir todos los cambios
      await connection.rollback();
      console.log(error);
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        console.error(error);
        return {
          error: true,
          statusCode: 400,
          message: "Clave foránea no válida",
        };
      } else if (error.code === "ECONNREFUSED") {
        return {
          error: true,
          statusCode: 500,
          message: "Error de conexión a la base de datos",
        };
      } else if (error.code === "ER_DUP_ENTRY") {
        return { error: true, statusCode: 400, message: "Registro duplicado" };
      } else {
        // Si no reconoces el error, devuelve un error genérico del servidor
        return {
          error: true,
          statusCode: 500,
          message: "Error en el servidor, por favor intenta más tarde",
        };
      }
    } finally {
      // Liberar la conexión
      connection.release();
    }
  },
  postPago: async (data, clienteId) => {
    try {
      const { id, pago, fecha_abono } = data;
      const resultCliente = await validarExistenciaClienteId(clienteId);
      if (resultCliente.error) return resultCliente;
      //verificar si el cliente tiene algun pedido
      const [resultPedidoId] = await connection.query(
        `select pedidos.id from pedidos join clientes on pedidos.cliente_id=clientes.id where clientes.id= uuid_to_bin(?);`,
        [clienteId]
      );

      if (resultPedidoId.length === 0)
        return {
          message: `el cliente ${clienteId} no tiene pedidos asociados }`,
          statusCode: 404,
        };

      const resultAddPedido = await connection.query(
        `INSERT INTO pagos (id, pago, fecha_abono, pedido_id) VALUES (?,?,?,?);`,
        [id, pago, fecha_abono, resultPedidoId[0].id]
      );

      if (resultAddPedido.affectedRows === 0)
        return {
          error: true,
          message: "No se pudo agregar el pago.",
          statusCode: 422,
        };

      return { success: true, message: "pago agregado correctamente." };
    } catch (error) {
      console.error(error);
      if (error.hasOwnProperty("code")) {
        return { error: true, code: error.code, statusCode: 400 };
      } else {
        return error;
      }
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
  updateCliente: async (data, clienteId) => {
    try {
      const resultCliente = await validarExistenciaClienteId(clienteId);
      if (resultCliente.error) return resultCliente;
      const resultUpdate = await connection.query(
        `UPDATE clientes SET ? WHERE id = UUID_TO_BIN(?);`,
        [data, clienteId]
      );
      if (resultUpdate.affectedRows === 0) {
        return {
          error: true,
          statusCode: 400,
          message: "no se pudo actualizar el nombre",
        };
      } else {
        return {
          success: true,
          mesage: `nombre actualizado exitosamente nuevo nombre ${data.name}`,
        };
      }
    } catch (error) {
      if (error.hasOwnProperty("code")) {
        console.error(error);
        return { error: true, code: error.code, statusCode: 400 };
      } else {
        return error;
      }
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
  updateProducto: async (data, productoId) => {
    try {
      const [resultId] = await connection.query(
        `select * from productos where id_price = ?`,
        [productoId]
      );

      if (resultId.length === 0)
        return {
          error: true,
          message: "Error: producto no enconrado",
          statusCode: 404,
        };

      const resultUpdate = await connection.query(
        `UPDATE productos SET ? WHERE id_price = ?;`,
        [data, productoId]
      );

      console.log(resultUpdate);
      if (resultUpdate.affectedRows === 0) {
        return {
          error: true,
          statusCode: 400,
          message: "no se pudo actualizar el producto",
        };
      } else {
        return {
          success: true,
          mesage: `producto actualizado correctamente`,
        };
      }
    } catch (error) {
      if (error.hasOwnProperty("code")) {
        console.error(error);
        return { error: true, code: error.code, statusCode: 400 };
      } else {
        return error;
      }
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
  updatePedido: async (data, pedidoId) => {
    try {
      const [resultPedido] = await connection.query(
        `SELECT id FROM pedidos where id=767158;`,
        [pedidoId]
      );

      if (resultPedido.length === 0)
        return { error: true, mesage: "pedido no encontrado", statusCode: 404 };
      const resultUpdate = await connection.query(
        `UPDATE pedidos SET ? WHERE id = ?;`,
        [data, pedidoId]
      );
      if (resultUpdate.affectedRows === 0) {
        return {
          error: true,
          statusCode: 400,
          message: "no se pudo actualizar el producto",
        };
      } else {
        return {
          success: true,
          mesage: `producto actualizado correctamente`,
        };
      }
    } catch (error) {
      if (error.hasOwnProperty("code")) {
        console.log(error);
        return { error: true, code: error.code, statusCode: 400 };
      } else {
        return error;
      }
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
  updatePago: async (data, pagoId) => {
    try {
      const resultUpdate = await connection.query(
        `UPDATE pagos SET ? WHERE id = ?;`,
        [data, pagoId]
      );
      if (resultUpdate.affectedRows === 0) {
        return {
          error: true,
          statusCode: 400,
          message: "no se pudo actualizar el pago",
        };
      } else {
        return {
          success: true,
          mesage: `pago actualizado correctamente`,
        };
      }
    } catch (error) {
      if (error.hasOwnProperty("code")) {
        console.log(error);
        return { error: true, code: error.code, statusCode: 400 };
      } else {
        return error;
      }
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
  deleteAllPagos: async (clienteId) => {
    try {
      await connection.beginTransaction();

      //comprobar si hay pedido y guardarlo para las siguientes consultas
      const [resultPedidoId] = await connection.query(
        `SELECT pedidos.id as pedido_id from pedidos 
        join clientes on clientes.id=pedidos.cliente_id
        where clientes.id =uuid_to_bin(?)`,
        [clienteId]
      );
      if (resultPedidoId.length === 0)
        throw {
          error: true,
          statusCode: 400,
          message: "no hay pedido asociado a este cliente",
        };
      const pedidoId = resultPedidoId[0].pedido_id;

      //comprobar si hay pagos para liberar el pedido
      const [resultPagos] = await connection.query(
        `SELECT * FROM price_shoes.pagos where pedido_id =?;`,
        [pedidoId]
      );
      if (resultPagos.length === 0)
        throw {
          error: true,
          statusCode: 400,
          message: "no hay pagos para liquidar el pedido",
        };

      //pasar los pagos a liquidado

      await connection.query(
        `INSERT INTO pagos_liquidados (id, pago,fecha_abono,pedido_id)
SELECT id, pago,fecha_abono,pedido_id
FROM pagos
WHERE pagos.pedido_id = ?;`,
        [pedidoId]
      );

      // copiar el pedido a liquidado
      await connection.query(
        `INSERT INTO pedidos_liquidados (id, numero_pagos, talla, id_price, fecha_inicio, fecha_entrega,cliente_id,pago_id)
SELECT id, numero_pagos, talla, id_price, fecha_inicio, fecha_entrega,cliente_id,pago_id
FROM pedidos
WHERE pedidos.id = ?;`,
        [pedidoId]
      );

      // borrar pagos

      await connection.query(`DELETE FROM pagos WHERE pedido_id = ?;`, [
        pedidoId,
      ]);

      // borrar pedido

      await connection.query(`DELETE FROM pedidos WHERE pedidos.id = ?;`, [
        pedidoId,
      ]);

      return { success: true, message: "pedido liquidado" };
    } catch (error) {
      await connection.rollback();
      if (error.hasOwnProperty("code")) {
        console.log(error);
        return { error: true, code: error.code, statusCode: 400 };
      } else {
        return error;
      }
    } finally {
      connection.release();
    }
  },
  deletePago: async (pagoId) => {
    try {
      await connection.beginTransaction();
      //consultar si el pago existe
      const [resultPago] = await connection.query(
        `SELECT * FROM price_shoes.pagos where id=?`,
        [pagoId]
      );

      if (resultPago.length === 0)
        throw {
          error: true,
          statusCode: 400,
          message: "no hay pagos con ese id",
        };
      const pedidoId = resultPago[0].id;

      //pasar pagos a liquidado
      const [resultLiquidado] = await connection.query(
        `INSERT INTO pagos_liquidados (id, pago,fecha_abono,pedido_id)
          SELECT id, pago,fecha_abono,pedido_id
          FROM pagos
          WHERE pagos.id = ?;`,
        [pedidoId]
      );

      // eliminar el pago mediante el id del pago
      await connection.query(`DELETE FROM pagos WHERE id = ?;`, [pagoId]);

      if (resultLiquidado.affectedRows === 0) {
        return {
          error: true,
          statusCode: 400,
          message: "no se pudo eliminar los pagos intentar mas tarde",
        };
      } else {
        return {
          success: true,
          mesage: `pagos eliminados correctamente`,
        };
      }
    } catch (error) {
      await connection.rollback();
      console.error(error);
      if (error.hasOwnProperty("code")) {
        return {
          error: true,
          code: error.code,
          statusCode: 400,
          mesage: error.sqlMessage,
        };
      } else {
        return error;
      }
    } finally {
      connection.release();
    }
  },
  getLiquidados: async (clienteId) => {
    try {
      const consultaLiquidados = `select bin_to_uuid(id) as id, name,
(select json_arrayagg(
json_object(
 "pedido_id", pedidos_liquidados.id,
 "numero_pagos", pedidos_liquidados.numero_pagos,
 "talla", pedidos_liquidados.talla,
 "id_price", pedidos_liquidados.id_price,
 "fecha_inicio", DATE_FORMAT(pedidos_liquidados.fecha_inicio, '%Y-%m-%d') ,
 "fecha_entrega", DATE_FORMAT(pedidos_liquidados.fecha_entrega , '%Y-%m-%d') 
 )) 
 from pedidos_liquidados
 where pedidos_liquidados.cliente_id=clientes.id ) as pedidos_liquidados,
 (select json_arrayagg(
 json_object(
 "pago_id",pagos_liquidados.id,
 "pago",pagos_liquidados.pago,
 "fecha_abono", DATE_FORMAT(pagos_liquidados.fecha_abono , '%Y-%m-%d'),
 "pedido_id",pagos_liquidados.pedido_id
 ))
 from pagos_liquidados
 join pedidos_liquidados on pagos_liquidados.pedido_id=pedidos_liquidados.id 
 where clientes.id= pedidos_liquidados.cliente_id)as pagos_liquidados
from clientes 
where clientes.id= uuid_to_bin(?);`;

      const [resultLiquidados] = await connection.query(consultaLiquidados, [
        clienteId,
      ]);
      if (resultLiquidados.length === 0)
        throw { statusCode: 404, message: "no found" };
      return resultLiquidados;
    } catch (error) {
      if (error.hasOwnProperty("code")) {
        console.log(error);
        return { error: true, code: error.code, statusCode: 400 };
      } else {
        console.log(error);
        return error;
      }
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
};
