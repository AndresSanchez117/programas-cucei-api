const databaseService = () => {
  const knex = require('knex')({
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      port: 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB
    }
  })

  // LOGIN
  const login = ({ correo_estudiante, contrasena }) => {
    return knex('Estudiante').where({
      correo_estudiante: correo_estudiante,
      contrasena: contrasena,
      estado: 0
    }).select()
  }

  // ESTUDIANTE

  const getEstudiante = () => {

  }

  const postEstudiante = ({ codigo, nombre, primer_apellido, segundo_apellido, contrasena, clave_carrera, ciclo_escolar, num_semestre, estatus, correo_estudiante }) => {
    return knex('Estudiante').insert({
      codigo: codigo,
      nombre: nombre,
      primer_apellido: primer_apellido,
      segundo_apellido: segundo_apellido,
      contrasena: contrasena,
      clave_carrera: clave_carrera,
      ciclo_escolar: ciclo_escolar,
      num_semestre: num_semestre,
      estatus: estatus,
      correo_estudiante: correo_estudiante
    })
  }

  // CARRERAS

  const getCarreras = () => {
    return knex('Carrera').where({
      estado: 0
    }).select('nombre', 'clave')
  }

  const postCarreras = ({ nombre, clave }) => {
    return knex('Carrera').insert({
      nombre: nombre,
      clave: clave
    })
  }

  // PROGRAMAS

  // TODO: Agregar imagen
  const postProgramas = ({ nombre, descripcion, telefono, correo, institucion, tipo, carreras }) => {

  }

  const getProgramasAsesorias = () => {

  }

  const getProgramasPracticas = () => {

  }

  const getProgramasBecas = () => {

  }

  const getProgramasIntercambios = () => {

  }

  const getProgramasPasantias = () => {

  }

  const getProgramasTrabajos = () => {

  }

  return {
    login,
    getEstudiante,
    postEstudiante,
    getCarreras,
    postCarreras
  }
}

module.exports = {
  databaseService
}
