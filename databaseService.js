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

  const postEstudianteDatos = ({ codigo }) => {
    return knex('Estudiante').where({
      codigo,
      estado: 0
    }).select()
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

  const postAdministrador = ({ nombre, primer_apellido, segundo_apellido, correo, contrasena }) => {
    return knex('Administrador').insert({
      nombre,
      primer_apellido,
      segundo_apellido,
      correo,
      contrasena
    })
  }

  const patchEstudiante = ({ codigoOri, codigo, nombre, primer_apellido, segundo_apellido, contrasena, clave_carrera, ciclo_escolar, num_semestre, estatus, correo_estudiante, foto }) => {
    return knex('Estudiante')
      .where({
        'Estudiante.codigo': codigoOri
      })
      .update({
        codigo: codigo,
        nombre: nombre,
        primer_apellido: primer_apellido,
        segundo_apellido: segundo_apellido,
        contrasena: contrasena,
        clave_carrera: clave_carrera,
        ciclo_escolar: ciclo_escolar,
        num_semestre: num_semestre,
        estatus: estatus,
        correo_estudiante: correo_estudiante,
        foto
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

  const postProgramas = ({ nombre, descripcion, telefono, correo, institucion, tipo, carreras }) => {
    return knex.transaction(trx => {
      return trx('Programa').insert({
        nombre,
        descripcion,
        telefono,
        correo,
        institucion,
        tipo
      }).then(ids => {
        let carrerasObj = []
        carreras.forEach(carrera => carrerasObj.push({ 'clave_carrera': carrera, 'id_programa': ids[0] }))
        return trx('Programa_carrera').insert(carrerasObj)
      })
    })
  }

  // {
  //   "nombre": "Prueba de arreglo",
  //   "descripcion": "Alguna descripción",
  //   "telefono": 33442345,
  //   "correo": "correo@gmail.com",
  //   "institucion": "Universidad de Guadalajara",
  //   "tipo": "Beca",
  //   "carreras": [
  //     {"clave_carrera": "INCO"},
  //     {"clave_carrera": "INNI"}
  //   ]
  // }

  const getProgramasporTipo = ({ tipo }) => {
    return knex('Programa')
      .leftOuterJoin(
        'Programa_carrera',
        'Programa_carrera.id_programa',
        '=',
        'Programa.id')
      .where({
        tipo,
        'Programa.estado': 0
      })
      .select(
        'Programa.id',
        'Programa.nombre',
        'Programa.descripcion',
        'Programa.telefono',
        'Programa.correo',
        'Programa.institucion',
        'Programa.tipo',
        'Programa_carrera.clave_carrera'
      )
  }

  const getPrograma = ({ id }) => {
    return knex('Programa')
      .leftOuterJoin(
        'Programa_carrera',
        'Programa_carrera.id_programa',
        '=',
        'Programa.id')
      .where({
        'Programa.id': id,
        'Programa.estado': 0
      })
      .select(
        'Programa.id',
        'Programa.nombre',
        'Programa.descripcion',
        'Programa.telefono',
        'Programa.correo',
        'Programa.institucion',
        'Programa.tipo',
        'Programa_carrera.clave_carrera'
      )
  }

  const getLastProgramID = () => {
    return knex('Programa').max('id', { as: 'id' })
  }

  return {
    login,
    postEstudianteDatos,
    postEstudiante,
    patchEstudiante,
    getCarreras,
    postCarreras,
    postProgramas,
    getProgramasporTipo,
    getPrograma,
    postAdministrador,
    getLastProgramID
  }
}

module.exports = {
  databaseService
}
