import z from "zod";

const clienteSchema = z.object({
  name: z
    .string({
      required_error: "El campo es obligatorio",
      invalid_type_error: "Debe ser una cadena de texto",
    })
    .max(100, { message: "No puede tener más de 100 caracteres" })
    .regex(/^[a-zA-Z]+$/, { message: "Solo se permiten letras" }),
});

const pedidoSchema = z.object({
  talla: z
    .number()
    .min(1, { message: "el numero debe ser igual o mayor a 1" })
    .max(40, { message: "el numero debe ser igual o menor a 40" }),
  cantidad: z
    .number()
    .min(1, { message: "el numero debe ser igual o mayor a 1" })
    .max(100, { message: "el numero debe ser igual o menor a 100" }),
  numero_pagos: z
    .number()
    .min(1, { message: "el numero debe ser igual o mayor a 1" })
    .max(10, { message: "el numero debe ser igual o menor a 10" }),
  fecha_inicio: z
    .preprocess(
      (arg) => (typeof arg === "string" ? new Date(arg) : arg), // Convierte string a Date
      z.date({
        invalid_type_error: "Debe ser una fecha válida yyyy-mm-dd",
      })
    )
    .refine((date) => date >= new Date("2024-01-01"), {
      message: "La fecha debe ser posterior a 1 de enero de 2024",
    })
    .refine((date) => date <= new Date("2030-12-31"), {
      message: "La fecha debe ser anterior a 31 de diciembre de 2030",
    }),
  fecha_entrega: z
    .preprocess(
      (arg) => (typeof arg === "string" ? new Date(arg) : arg), // Convierte string a Date
      z.date({
        invalid_type_error: "Debe ser una fecha válida yyyy-mm-dd",
      })
    )
    .refine((date) => date >= new Date("2024-01-01"), {
      message: "La fecha debe ser posterior a 1 de enero de 2024",
    })
    .refine((date) => date <= new Date("2030-12-31"), {
      message: "La fecha debe ser anterior a 31 de diciembre de 2030",
    }),
  id_price: z
    .number({
      message: "el valor debe ser numero entero",
      invalid_type_error: "El valor debe ser un número",
      required_error: "Este campo es obligatorio",
    })
    .positive({ message: "debe ser numero positivo" }),
  precio_cliente: z
    .number({
      message: "el valor puede ser decimal",
      invalid_type_error: "El valor debe ser un número",
      required_error: "Este campo es obligatorio",
    })
    .positive({ message: "debe ser numero positivo" }),
  precio_lista: z
    .number({
      message: "el valor puede ser decimal",
      invalid_type_error: "El valor debe ser un número",
      required_error: "Este campo es obligatorio",
    })
    .positive({ message: "debe ser numero positivo" }),
  marca: z
    .string({
      invalid_type_error: "la marca debe de ser una cadena de texto",
    })
    .min(3, { message: "Debe tener al menos 3 caracteres" })
    .max(100, { message: "No puede exceder de 100 caracteres" })
    .optional(),
  piso: z
    .string({
      invalid_type_error: "la marca debe de ser una cadena de texto",
    })
    .min(1, { message: "Debe tener al menos 1 caracteres" })
    .max(100, { message: "No puede exceder de 100 caracteres" })
    .optional(),
  pasillo: z
    .number({
      message: "el debe ser entero",
      invalid_type_error: "El valor debe ser un número",
    })
    .positive({ message: "debe ser numero positivo" })
    .optional(),
  color: z
    .string({
      invalid_type_error: "la marca debe de ser una cadena de texto",
    })
    .min(3, { message: "Debe tener al menos 3 caracteres" })
    .max(100, { message: "No puede exceder de 100 caracteres" })
    .optional(),
  tipo: z
    .string({
      invalid_type_error: "la marca debe de ser una cadena de texto",
    })
    .min(3, { message: "Debe tener al menos 3 caracteres" })
    .max(100, { message: "No puede exceder de 100 caracteres" })
    .optional(),
});

const pagoSchema = z.object({
  pago: z
    .number({
      message: "el valor debe ser numero entero",
      invalid_type_error: "El valor debe ser un número",
      required_error: "Este campo es obligatorio",
    })
    .min(0, { message: "el valor debe ser mayor a 0" })
    .max(10000, { message: "el valor debe ser menor a 10000" }),
  fecha_abono: z
    .preprocess(
      (arg) => (typeof arg === "string" ? new Date(arg) : arg), // Convierte string a Date
      z.date({
        invalid_type_error: "Debe ser una fecha válida yyyy-mm-dd",
      })
    )
    .refine((date) => date >= new Date("2024-01-01"), {
      message: "La fecha debe ser posterior a 1 de enero de 2024",
    })
    .refine((date) => date <= new Date("2030-12-31"), {
      message: "La fecha debe ser anterior a 31 de diciembre de 2030",
    }),
});

const updateclienteSchema = z.object({
  name: z
    .string({
      required_error: "El campo es obligatorio",
      invalid_type_error: "Debe ser una cadena de texto",
    })
    .min(5, { message: "Debe tener al menos 5 caracteres" })
    .max(20, { message: "No puede tener más de 20 caracteres" })
    .regex(/^[a-zA-Z]+$/, { message: "Solo se permiten letras" }),
});

const productoSchema = z.object({
  id_price: z
    .number({
      message: "el valor debe ser numero entero",
      invalid_type_error: "El valor debe ser un número",
      required_error: "Este campo es obligatorio",
    })
    .positive({ message: "debe ser numero positivo" }),
  precio_cliente: z
    .number({
      message: "el valor puede ser decimal",
      invalid_type_error: "El valor debe ser un número",
      required_error: "Este campo es obligatorio",
    })
    .positive({ message: "debe ser numero positivo" }),
  precio_lista: z
    .number({
      message: "el valor puede ser decimal",
      invalid_type_error: "El valor debe ser un número",
      required_error: "Este campo es obligatorio",
    })
    .positive({ message: "debe ser numero positivo" }),
  marca: z
    .string({
      invalid_type_error: "la marca debe de ser una cadena de texto",
    })
    .min(3, { message: "Debe tener al menos 3 caracteres" })
    .max(100, { message: "No puede exceder de 100 caracteres" })
    .optional(),
  piso: z
    .string({
      invalid_type_error: "la marca debe de ser una cadena de texto",
    })
    .min(1, { message: "Debe tener al menos 1 caracteres" })
    .max(100, { message: "No puede exceder de 100 caracteres" })
    .optional(),
  pasillo: z
    .number({
      message: "el debe ser entero",
      invalid_type_error: "El valor debe ser un número",
    })
    .positive({ message: "debe ser numero positivo" })
    .optional(),
  color: z
    .string({
      invalid_type_error: "la marca debe de ser una cadena de texto",
    })
    .min(3, { message: "Debe tener al menos 3 caracteres" })
    .max(100, { message: "No puede exceder de 100 caracteres" })
    .optional(),
  tipo: z
    .string({
      invalid_type_error: "la marca debe de ser una cadena de texto",
    })
    .min(3, { message: "Debe tener al menos 3 caracteres" })
    .max(100, { message: "No puede exceder de 100 caracteres" })
    .optional(),
});

const updatePedidoSchema = z.object({
  talla: z
    .number()
    .min(1, { message: "el numero debe ser igual o mayor a 1" })
    .max(40, { message: "el numero debe ser igual o menor a 40" }),
  cantidad: z
    .number()
    .min(1, { message: "el numero debe ser igual o mayor a 1" })
    .max(100, { message: "el numero debe ser igual o menor a 100" }),
  numero_pagos: z
    .number()
    .min(1, { message: "el numero debe ser igual o mayor a 1" })
    .max(10, { message: "el numero debe ser igual o menor a 10" }),
  fecha_inicio: z
    .preprocess(
      (arg) => (typeof arg === "string" ? new Date(arg) : arg), // Convierte string a Date
      z.date({
        invalid_type_error: "Debe ser una fecha válida yyyy-mm-dd",
      })
    )
    .refine((date) => date >= new Date("2024-01-01"), {
      message: "La fecha debe ser posterior a 1 de enero de 2024",
    })
    .refine((date) => date <= new Date("2030-12-31"), {
      message: "La fecha debe ser anterior a 31 de diciembre de 2030",
    }),
  fecha_entrega: z
    .preprocess(
      (arg) => (typeof arg === "string" ? new Date(arg) : arg), // Convierte string a Date
      z.date({
        invalid_type_error: "Debe ser una fecha válida yyyy-mm-dd",
      })
    )
    .refine((date) => date >= new Date("2024-01-01"), {
      message: "La fecha debe ser posterior a 1 de enero de 2024",
    })
    .refine((date) => date <= new Date("2030-12-31"), {
      message: "La fecha debe ser anterior a 31 de diciembre de 2030",
    }),
});

export const validacionCliente = (obj) => clienteSchema.safeParse(obj);
export const validacionPedido = (obj) => pedidoSchema.safeParse(obj);
export const validacionPago = (obj) => pagoSchema.safeParse(obj);

export const validacionUpdateCliente = (obj) =>
  updateclienteSchema.safeParse(obj);
export const validacionUpdateProducto = (obj) =>
  productoSchema.partial().safeParse(obj);
export const validacionUpdatePedido = (obj) =>
  updatePedidoSchema.partial().safeParse(obj);
export const validacionUpdatePago = (obj) =>
  pagoSchema.partial().safeParse(obj);
