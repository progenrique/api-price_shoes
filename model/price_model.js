import msql from "mysql2/promise";

/* const config = {
  host: "bhqy07iwlv4e0xz2duhs-mysql.services.clever-cloud.com",
  user: "ukybdit7n9q10mwb",
  port: 3306,
  password: "DYe8yJWARTAQ7bZFB0jW",
  database: "bhqy07iwlv4e0xz2duhs",
};
 */
const config = {
  host: "127.0.0.1",
  user: "root",
  port: 8081,
  password: "Sn@ke",
  database: "price_shoes",
};

const pool = msql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10, // Número máximo de conexiones
  queueLimit: 0,
});

//const connection = await msql.createConnection(config);

const connection = await pool.getConnection(); // Obtener la conexión

//validar uuid
function validarUUID(uuid) {
  const regexUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regexUUID.test(uuid);
}

const validarExistenciaClienteId = async (id) => {
  const validationUUID = validarUUID(id);
  if (validationUUID) {
    const [resultId] = await connection.query(
      `select * from clientes where id = UUID_TO_BIN(?)`,
      [id]
    );

    if (resultId.length === 0) {
      return {
        error: true,
        success: false,
        message: "Error: cliente no enconrado",
        statusCode: 404,
      };
    } else {
      return { success: true, error: false };
    }
  } else {
    return {
      error: true,
      message: "Error: cliente no enconrado",
      statusCode: 404,
    };
  }
};

const validarExistenciaProductos = async (productoId) => {
  const [resultProductoId] = await connection.query(
    `SELECT id FROM price_shoes.productos where id_price=?`,
    [productoId]
  );
  if (resultProductoId.length !== 0) {
    return {
      error: true,
      success: false,
      statusCode: 208,
      message: "el producto ya se encuentra en la BD",
      id: resultProductoId,
    };
  } else {
    return { success: true };
  }
};

// funcion para crear dinamicamente la consulta ya que se utiliza en 3 metodos para no repetir codigo
// retorna los campos de la columna los signos de ? y los valores del arreglo (parametros)

const insertSql = (data, table) => {
  let columnas = ``;
  let valores = ``;
  const parametros = [];
  for (const key in data) {
    if (data[key] !== undefined) {
      if (parametros.length === 0) {
        if ((key === "id" && table === "clientes") || key === "cliente_id") {
          columnas += ` ${key}`;
          valores += ` UUID_TO_BIN(?)`;
          parametros.push(data[key]);
        } else {
          columnas += ` ${key}`;
          valores += ` ?`;
          parametros.push(data[key]);
        }
      } else {
        if ((key === "id" && table === "clientes") || key === "cliente_id") {
          columnas += `, ${key}`;
          valores += `, UUID_TO_BIN(?)`;
          parametros.push(data[key]);
        } else {
          columnas += `, ${key}`;
          valores += `, ?`;
          parametros.push(data[key]);
        }
      }
    }
  }

  return {
    consulta: `INSERT INTO ${table} (${columnas}) VALUES (${valores});`,
    parametros,
  };
};

export const modelPrice = {
  getAll: async () => {
    const consulta = `SELECT BIN_TO_UUID(clientes.id) AS cliente_id,
clientes.name,
JSON_ARRAYAGG(
JSON_OBJECT(
"numero_pedido",pedidos.id,
"numero_pagos",pedidos.numero_pagos,
"fecha_entrega",pedidos.fecha_entrega,
"pagos",(SELECT json_arrayagg(pagos.pago) FROM pagos WHERE pagos.pedido_id=pedidos.id),
"productos",(select json_arrayagg(
json_object(
"producto_id",productos.id,
"precio_lista",productos.precio_lista,
"precio_cliente",productos.precio_cliente,
"id_price",productos.id_price,
"cantidad",pedidos_productos.cantidad
))
from productos
JOIN pedidos_productos ON pedidos.id= pedidos_productos.pedido_id
where pedidos.id=pedidos_productos.pedido_id AND productos.id=pedidos_productos.producto_id
))) AS pedidos
FROM clientes
 JOIN pedidos ON clientes.id=pedidos.cliente_id 
GROUP BY clientes.id,clientes.name;`;
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
      const [data] = await connection.query(
        `select clientes.name, BIN_TO_UUID(clientes.id) AS id from clientes`
      );
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
      const consultaData = `SELECT
  BIN_TO_UUID(clientes.id) AS id, clientes.name,
  JSON_ARRAYAGG(
  JSON_OBJECT(
  "pagos",(SELECT JSON_ARRAYAGG(
  JSON_OBJECT(
  "pago_id",pagos.id,
  "pago",pagos.pago,
  "fecha_abono",DATE_FORMAT(pagos.fecha_abono, '%Y-%m-%d')  
  )) FROM pagos WHERE pagos.pedido_id=pedidos.id),
  "pedido_id",pedidos.id,
  "numero_pagos",pedidos.numero_pagos,
  "fecha_inicio",  DATE_FORMAT(pedidos.fecha_inicio, '%Y-%m-%d'),
  "fecha_entrega", DATE_FORMAT(pedidos.fecha_entrega, '%Y-%m-%d'),
  "productos",(SELECT JSON_ARRAYAGG(
JSON_OBJECT(
"producto_id",productos.id,
"id_price",productos.id_price,
"precio_lista",productos.precio_lista,
"precio_cliente",productos.precio_cliente,
"marca",productos.marca,
"piso",productos.piso,
"pasillo",productos.pasillo,
"color",productos.color,
"tipo",productos.tipo,
"talla",pedidos_productos.talla,
"cantidad",pedidos_productos.cantidad
))
FROM productos
JOIN pedidos_productos ON pedidos.id= pedidos_productos.pedido_id
WHERE pedidos.id=pedidos_productos.pedido_id AND productos.id=pedidos_productos.producto_id
))) AS pedidos  
   FROM clientes
   LEFT JOIN pedidos ON clientes.id =pedidos.cliente_id
   WHERE clientes.id = UUID_TO_BIN(?);`;
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
      const querry = insertSql(data, "clientes");
      const [result] = await connection.query(
        querry.consulta,
        querry.parametros
      );

      await connection.commit(); // Confirma los cambios
      if (result.affectedRows > 0)
        return { success: true, message: "Nombre agregado correctamente" };
    } catch (error) {
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
  postProductos: async (data) => {
    try {
      await connection.beginTransaction(); // Iniciar la transacción
      // verificar si existe el id de producto
      const validacionProdctoId = await validarExistenciaProductos(
        data.id_price
      );
      if (validacionProdctoId.success === false) throw validacionProdctoId;

      // esta funcion me regresa lo que va en valores los signos de ? y los paranmetros
      const querry = insertSql(data, "productos");
      const [result] = await connection.query(
        querry.consulta,
        querry.parametros
      );
      await connection.commit(); // Confirma los cambios

      if (result.affectedRows > 0)
        return { success: true, message: "Producto agregado correctamente" };
    } catch (error) {
      console.error(error);
      if (error.hasOwnProperty("code")) {
        return {
          error: true,
          code: error.code,
          statusCode: error.statusCode,
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
  postPedido: async (data, clienteId) => {
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
      productoId,
    } = data;
    try {
      await connection.beginTransaction(); // Iniciar la transacción

      //verificar si el id del cliente esta en la BD
      const resultCliente = await validarExistenciaClienteId(clienteId);
      if (resultCliente.error) return resultCliente;

      let reultsConsultas = {};
      // verificar si id_price existe en la BD
      const validacionProdctoId = await validarExistenciaProductos(id_price);

      // si no existe se agrega el producto
      // si existe el id_price guardar el id de la tabla productos para despues crear la relacion
      if (validacionProdctoId.success === true) {
        const dataProductos = {
          id_price,
          precio_cliente,
          precio_lista,
          marca,
          color,
          tipo,
          pasillo,
          piso,
          id: productoId,
        };

        const querry = insertSql(dataProductos, "productos");
        await connection.query(querry.consulta, querry.parametros);

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
        // nota la data que se usa para los inserts la puedo mandar directamente desde el controlador para no armarla aqui en cada consulta
        // se agrega a la tabla pedidos
        const data = {
          fecha_inicio,
          fecha_entrega,
          cliente_id: clienteId,
          id: pedidoId,
          numero_pagos,
        };
        const querry = insertSql(data, "pedidos");
        await connection.query(querry.consulta, querry.parametros);

        //******************** crear la relacon de pedidos con productos *******************

        await connection.query(
          `INSERT INTO pedidos_productos (pedido_id,producto_id,cantidad,talla) VALUES (?,?,?,?)`,
          [pedidoId, validacionProdctoId.id[0].id, cantidad, talla]
        );

        await connection.commit(); // Confirma los cambios

        return (reultsConsultas = {
          ...reultsConsultas,
          pedido: "pedido agregado correctamente",
        });
      }
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
  postProductoToPedido: async (data, params) => {
    try {
      let respuesta = {};
      const { cliente_id, pedido_id } = params;
      const {
        id_price,
        precio_cliente,
        precio_lista,
        marca,
        color,
        tipo,
        pasillo,
        piso,
        id,
        talla,
        cantidad,
      } = data;

      await connection.beginTransaction(); // Iniciar la transacción

      // verificar que el cliente tenga este pedido asociado
      const [resultPedidoCliente] = await connection.query(
        `select pedidos.id from pedidos
join clientes on pedidos.cliente_id=clientes.id 
 where pedidos.id=? and clientes.id=uuid_to_bin(?)`,
        [pedido_id, cliente_id]
      );
      if (resultPedidoCliente.length === 0) {
        throw {
          error: true,
          statusCode: 404,
          message: "id del pedido no esta asociado a este cliente ",
        };
      }

      //verificar si el producto esiste
      const resultProducto = await validarExistenciaProductos(id_price);
      if (resultProducto.success === true) {
        // si no existe agregarlo

        const dataProducto = {
          id_price,
          precio_cliente,
          precio_lista,
          marca,
          color,
          tipo,
          pasillo,
          piso,
          id,
        };
        const querry = insertSql(dataProducto, "productos");
        await connection.query(querry.consulta, querry.parametros);

        //***** crear la relacion con el id del cotrolador

        await connection.query(
          `INSERT INTO pedidos_productos (pedido_id,producto_id,cantidad,talla) VALUES (?,?,?,?)`,
          [pedido_id, id, cantidad, talla]
        );
        respuesta = { ...respuesta, mesage: "producto agregado correctamente" };
      } else {
        // verificar si el producto ya esta asociado al pedido si es asi incrementar la cantidad en 1

        const [resultRelacion] = await connection.query(
          `select cantidad from pedidos_productos where producto_id=? and pedido_id=?`,
          [resultProducto.id[0].id, pedido_id]
        );

        if (resultRelacion.length > 0) {
          const newCantidad = resultRelacion[0].cantidad;
          console.log(newCantidad);
          await connection.query(
            `UPDATE pedidos_productos SET cantidad = ? WHERE pedido_id = ? AND producto_id=?`,
            [newCantidad + 1, pedido_id, resultProducto.id[0].id]
          );

          await connection.commit(); // Confirma los cambios
          return (respuesta = {
            ...respuesta,
            pedido: "se agrego el mismo producto al pedido ",
          });
        } else {
          // crear la relacion con el id del producto ya existente

          await connection.query(
            `INSERT INTO pedidos_productos (pedido_id,producto_id,cantidad,talla) VALUES (?,?,?,?)`,
            [pedido_id, resultProducto.id[0].id, cantidad, talla]
          );
          await connection.commit(); // Confirma los cambios

          return (respuesta = {
            ...respuesta,
            pedido: "producto agregado al pedido correctamente",
          });
        }
      }
      await connection.commit(); // Confirma los cambios
      return respuesta;
    } catch (error) {
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
      connection.release();
    }
  },
  postPago: async (data, params) => {
    try {
      await connection.beginTransaction(); // Iniciar la transacción
      const { id, pago, fecha_abono } = data;
      const { clienteId, pedidoId } = params;

      const resultCliente = await validarExistenciaClienteId(clienteId);
      if (resultCliente.error) return resultCliente;

      //verificar si el cliente tiene algun pedido
      const [resultClientePedido] = await connection.query(
        `select pedidos.id from pedidos join clientes on pedidos.cliente_id=clientes.id where clientes.id= uuid_to_bin(?);`,
        [clienteId]
      );
      if (resultClientePedido.length === 0)
        return {
          message: `el cliente ${clienteId} no tiene pedidos asociados`,
          statusCode: 404,
        };

      // verificar si el pedido_id existe
      const [resultPedidoId] = await connection.query(
        `SELECT * FROM price_shoes.pedidos where id =?;`,
        [pedidoId]
      );
      if (resultPedidoId.length === 0)
        return {
          message: `el pedido ${pedidoId} no esta asociado a este cliente o no existe `,
          statusCode: 404,
        };

      const dataQuerry = { id, pago, fecha_abono, pedido_id: pedidoId };

      const querry = insertSql(dataQuerry, "pagos");

      const result = await connection.query(querry.consulta, querry.parametros);
      await connection.commit(); // Confirma los cambios

      if (result.affectedRows === 0)
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
        `select * from productos where id = ?`,
        [productoId]
      );

      if (resultId.length === 0)
        return {
          error: true,
          message: "Error: producto no enconrado",
          statusCode: 404,
        };

      const resultUpdate = await connection.query(
        `UPDATE productos SET ? WHERE id = ?;`,
        [data, productoId]
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
  updatePedido: async (dataPedido, dataPedidoProducto, pedidoId) => {
    try {
      await connection.beginTransaction(); // Iniciar la transacción

      // verificar si el pedido existe
      const [resultPedido] = await connection.query(
        `SELECT id FROM pedidos where id=?;`,
        [pedidoId]
      );
      if (resultPedido.length === 0)
        return { error: true, mesage: "pedido no encontrado", statusCode: 404 };

      //actualizar tabla pedidos
      if (Object.keys(dataPedido).length > 0) {
        const [resultUpdate] = await connection.query(
          `UPDATE pedidos SET ? WHERE id = ?;`,
          [dataPedido, pedidoId]
        );
        if (resultUpdate.affectedRows > 0)
          return {
            success: true,
            mesage: `producto actualizado correctamente`,
          };
      }

      //realizar el update a la tabla pedidos_productos
      if (Object.keys(dataPedidoProducto).length > 0) {
        const [resultUpdate] = await connection.query(
          `UPDATE pedidos_productos SET ? WHERE pedido_id = ?;`,
          [dataPedidoProducto, pedidoId]
        );
        if (resultUpdate.affectedRows > 0)
          return {
            success: true,
            mesage: `producto actualizado correctamente`,
          };
      }

      await connection.commit(); // Confirma los cambios
    } catch (error) {
      // Si ocurre un error, revertir todos los cambios
      await connection.rollback();
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
      // verificar si el pago_id existe
      const [resultPagoId] = await connection.query(
        `SELECT id FROM pagos where id=?;`,
        [pagoId]
      );
      if (resultPagoId.length === 0)
        throw {
          error: true,
          message: `el pago_id no existe`,
          statusCode: 404,
        };

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
      } else if (error.hasOwnProperty("statusCode")) {
        return {
          error: true,
          message: error.message,
          statusCode: error.statusCode,
        };
      } else {
        console.log(error);
      }
    } finally {
      // Liberar la conexión
      if (connection) connection.release();
    }
  },
  deleteAllPagos: async (pedidoId) => {
    try {
      await connection.beginTransaction();

      //comprobar si el pedido existe
      const [resultPedidoId] = await connection.query(
        `select * from pedidos where pedidos.id=?;`,
        [pedidoId]
      );

      if (resultPedidoId.length === 0) {
        throw {
          error: true,
          statusCode: 400,
          message: "no hay pedido asociado a este cliente",
        };
      }

      //comprobar si hay pagos para liberar el pedido
      const [resultPagos] = await connection.query(
        `SELECT id FROM pagos where pedido_id =?;`,
        [pedidoId]
      );

      if (resultPagos.length === 0)
        throw {
          error: true,
          statusCode: 400,
          message: "no hay pagos para liquidar el pedido285",
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
        `INSERT INTO pedidos_liquidados (id, numero_pagos, fecha_inicio, fecha_entrega,cliente_id)
SELECT id, numero_pagos, fecha_inicio, fecha_entrega,cliente_id
FROM pedidos
WHERE pedidos.id = ?;`,
        [pedidoId]
      );

      // copiar pedidos_productos a  pedidos_productos_liquidados

      await connection.query(
        `INSERT INTO pedidos_productos_liquidados (pedido_id, producto_id, cantidad, id, talla)
SELECT pedido_id, producto_id, cantidad, id, talla
FROM pedidos_productos
WHERE pedidos_productos.pedido_id = ?;`,
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
      await connection.commit(); // Confirma los cambios
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
  deletePago: async (params) => {
    try {
      const { clienteId, pagoId } = params;
      await connection.beginTransaction();
      //verificar que coincida el cliente_id con el pedido_id

      const [resultRelacion] = await connection.query(
        `SELECT clientes.name 
FROM pagos
JOIN pedidos ON pagos.pedido_id=pedidos.id
JOIN clientes ON pedidos.cliente_id=clientes.id
WHERE clientes.id=uuid_to_bin(?) AND pagos.id=?;`,
        [clienteId, pagoId]
      );
      if (resultRelacion.length === 0)
        throw {
          error: true,
          statusCode: 400,
          message: "no hay pagos con ese id",
        };

      //pasar pagos a liquidado
      const [resultLiquidado] = await connection.query(
        `INSERT INTO pagos_liquidados (id, pago,fecha_abono,pedido_id)
          SELECT id, pago,fecha_abono,pedido_id
          FROM pagos
          WHERE pagos.id = ?;`,
        [pagoId]
      );

      // eliminar el pago mediante el id del pago
      await connection.query(`DELETE FROM pagos WHERE id = ?;`, [pagoId]);
      await connection.commit(); // Confirma los cambios
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
      await connection.beginTransaction(); // Iniciar la transacción
      // comprobar que el clienteId exista

      const resultValidacion = validarExistenciaClienteId(clienteId);
      if (resultValidacion.error) return resultValidacion;

      const consultaLiquidados = ` SELECT
  BIN_TO_UUID(clientes.id) AS id, clientes.name,
  JSON_ARRAYAGG(
  JSON_OBJECT(
   "pagos",(SELECT JSON_ARRAYAGG(
  JSON_OBJECT(
  "pago",pagos_liquidados.pago,
  "fecha_abono",DATE_FORMAT(pagos_liquidados.fecha_abono, '%Y-%m-%d')  
  )) FROM pagos_liquidados WHERE pagos_liquidados.pedido_id=pedidos_liquidados.id),
  "pedido_id",pedidos_liquidados.id,
  "numero_pagos",pedidos_liquidados.numero_pagos,
  "fecha_inicio",  DATE_FORMAT(pedidos_liquidados.fecha_inicio, '%Y-%m-%d'),
  "fecha_entrega", DATE_FORMAT(pedidos_liquidados.fecha_entrega, '%Y-%m-%d'),
  "productos",(SELECT JSON_ARRAYAGG(
JSON_OBJECT(
"producto_id",productos.id_price,
"precio_lista",productos.precio_lista,
"precio_cliente",productos.precio_cliente,
"marca",productos.marca,
"piso",productos.piso,
"pasillo",productos.pasillo,
"color",productos.color,
"tipo",productos.tipo,
"talla",pedidos_productos_liquidados.talla,
"cantidad",pedidos_productos_liquidados.cantidad
))
FROM productos
JOIN pedidos_productos_liquidados ON pedidos_liquidados.id= pedidos_productos_liquidados.pedido_id
WHERE pedidos_liquidados.id=pedidos_productos_liquidados.pedido_id AND productos.id=pedidos_productos_liquidados.producto_id
)
  ))AS pedidos_liquidados
  FROM clientes
   LEFT JOIN pedidos_liquidados ON clientes.id =pedidos_liquidados.cliente_id
   WHERE clientes.id = UUID_TO_BIN(?);`;

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
