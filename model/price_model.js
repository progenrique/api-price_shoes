import msql from "mysql2/promise";

// estudiar a fondo promesas y async await

const config = {
  host: "localhost",
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

const connection = await msql.createConnection(config);

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
      const err = {
        error: true,
        code: error.code,
        statusCode: 422,
        mesage: error.sqlMessage,
      };
      return err;
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
    }
  },
  getProductos: async () => {
    try {
      const consulta = `SELECT * FROM price_shoes.productos;`;
      const [result] = await connection.query(consulta);
      return result;
    } catch (error) {
      const err = {
        error: true,
        code: error.code,
        statusCode: 422,
        mesage: error.sqlMessage,
      };
      return err;
    }
  },
  postClientes: async (data) => {
    try {
      const datosAEnviar = [data.id, data.name];
      const consulta = `INSERT INTO clientes (id,name) VALUES (UUID_TO_BIN(?),?);`;
      const [result] = await connection.query(consulta, datosAEnviar);
      console.log(result);
    } catch (error) {
      const err = {
        error: true,
        code: error.code,
        statusCode: 422,
        mesage:
          "error al intentar acceder a la base de datos favor de intentar mas tarde",
      };
      console.log(err);
      return err;
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
    const connectionTransaction = await pool.getConnection(); // Obtener la conexión

    try {
      await connectionTransaction.beginTransaction(); // Iniciar la transacción
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
      await connectionTransaction.rollback();
      console.log(error);
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
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
      connectionTransaction.release();
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
      if (error.hasOwnProperty("code")) {
        console.log(error);
        return { error: true, code: error.code, statusCode: 400 };
      } else {
        return error;
      }
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
        console.log(error);
        return { error: true, code: error.code, statusCode: 400 };
      } else {
        return error;
      }
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
    }
  },
  updatePedido: async (data, pedidoId) => {
    try {
      const resultCliente = await validarExistenciaClienteId(clienteId);
      if (resultCliente.error) return resultCliente;
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
      return data;
    } catch (error) {
      if (error.hasOwnProperty("code")) {
        console.log(error);
        return { error: true, code: error.code, statusCode: 400 };
      } else {
        return error;
      }
    }
  },
};
